import { useState, useEffect, useMemo, useLayoutEffect } from 'react';
// import emailjs from '@emailjs/browser';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  ChevronRight,
  RefreshCw,
  Home,
  ShoppingBag,
  Star,
  MapPin,
  Shield,
  AlertTriangle,
  FileText
} from 'lucide-react';
import styles from './PaymentStatusPage.module.css';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import { api } from '../../utils/api';

type StatusType = 'pending' | 'success' | 'expired';

type CartItem = {
  name: string;
  type: string;
  location: string;
  price: number;
  quantity: number;
  image: string;
  addons: { price: number }[];
};

// Countdown for pending VA payment (1 min demo)


export default function PaymentStatusPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const autoPay = searchParams.get('auto_pay') === 'true';
  
  const [isSnapOpen, setIsSnapOpen] = useState(autoPay);
  const [isStatusFetched, setIsStatusFetched] = useState(false);
  const [liveResult, setLiveResult] = useState<any>(null);
  
  // Ambil dari state atau fallback ke localStorage dengan pengaman
  const paymentResult = useMemo(() => {
    try {
      if (location.state?.paymentResult) return location.state.paymentResult;
      // Gunakan data live jika tersedia
      if (liveResult?.payment_type) return liveResult;
      
      const saved = localStorage.getItem('divexplore_last_payment');
      if (!saved) return null;
      return JSON.parse(saved);
    } catch (e) {
      console.error("Gagal parse paymentResult:", e);
      return null;
    }
  }, [location.state, liveResult]);

  const lastSnapToken = localStorage.getItem('divexplore_last_snap_token');

  // Helper to extract VA and Bank Name
  const paymentDetails = useMemo(() => {
    if (!paymentResult) return null;
    
    let bankName = 'Metode Pembayaran';
    let vaNo = '';
    let qrUrl = '';
    
    if (paymentResult.va_numbers && paymentResult.va_numbers.length > 0) {
      bankName = `BANK ${paymentResult.va_numbers[0].bank.toUpperCase()}`;
      vaNo = paymentResult.va_numbers[0].va_number;
    } else if (paymentResult.permata_va_number) {
      bankName = 'BANK PERMATA';
      vaNo = paymentResult.permata_va_number;
    } else if (paymentResult.bill_key) {
      bankName = 'BANK MANDIRI';
      vaNo = `${paymentResult.biller_code} ${paymentResult.bill_key}`;
    } else if (paymentResult.payment_type === 'gopay' || paymentResult.payment_type === 'qris') {
      bankName = 'GOPAY / QRIS';
      // Cari URL QR Code di array actions
      const qrAction = paymentResult.actions?.find((a: any) => a.name === 'generate-qr-code');
      qrUrl = qrAction?.url || '';
      vaNo = 'Silakan Scan QR Code';
    }

    return { bankName, vaNo, qrUrl };
  }, [paymentResult]);

  const { user } = useAuth();
  const rawStatus = searchParams.get('status') ?? 'pending';
  const status: StatusType = ['pending', 'success', 'expired'].includes(rawStatus)
    ? (rawStatus as StatusType)
    : 'pending';

  // Preview switcher (dev helper shown as tabs)
  const [previewStatus, setPreviewStatus] = useState<StatusType>(status);



  // VA countdown (pending only)
  const [vaSeconds, setVaSeconds] = useState(0);

  useEffect(() => {
    const calculateDiff = () => {
      if (paymentResult?.expiry_time) {
        const expiryStr = paymentResult.expiry_time.replace(' ', 'T');
        const expiry = new Date(expiryStr).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((expiry - now) / 1000));
        setVaSeconds(diff);
        if (diff <= 0) setPreviewStatus('expired');
      } else {
        // Jika tidak ada expiry_time, hitung mundur dari 24 jam dummy
        setVaSeconds(s => (s > 0 ? s - 1 : 86400));
      }
    };

    const t = setInterval(calculateDiff, 1000);
    return () => clearInterval(t);
  }, [paymentResult]);

  // Ambil data pembayaran terbaru dari server
  useEffect(() => {
    const fetchStatus = async () => {
      const lastOrderStr = localStorage.getItem('divexplore_last_order_data');
      if (!lastOrderStr) return;
      try {
        const order = JSON.parse(lastOrderStr);
        
        // 1. Ambil detail pesanan lengkap (untuk cek paymentLogs di DB kita)
        const orderRes = await api.get(`/api/orders/${order.id}`);
        const dbOrder = orderRes.data?.data;
        
        if (dbOrder?.paymentLogs?.length > 0) {
          const lastLog = dbOrder.paymentLogs[0];
          if (lastLog.raw_response) {
            const parsed = JSON.parse(lastLog.raw_response);
            setLiveResult(parsed);
            setIsStatusFetched(true);
            return; // STOP jika sudah ada log di DB, jangan buka popup
          }
        }

        // 2. Jika tidak ada di DB, barulah cek ke Midtrans (fallback)
        const res = await api.get(`/api/orders/${order.id}/payment-status`);
        const midtransData = res.data?.data;
        if (midtransData) {
          setLiveResult(midtransData);
          // Jika sudah ada payment_type, berarti user sudah pilih metode
          if (midtransData.payment_type) {
            localStorage.setItem('divexplore_last_payment', JSON.stringify(midtransData));
          }
        }
      } catch (e) {
        console.error("Gagal sinkron status Midtrans:", e);
      } finally {
        setIsStatusFetched(true);
      }
    };
    fetchStatus();
  }, []);

  // LOGIKA AUTO-TRIGGER SNAP MIDTRANS
  useEffect(() => {
    // Hanya jalankan auto-pay jika:
    // 1. Parameter auto_pay=true
    // 2. Ada token
    // 3. Status sudah dicek (isStatusFetched)
    // 4. USER BELUM PILIH METODE (liveResult.payment_type belum ada)
    if (autoPay && lastSnapToken && window.snap && isStatusFetched) {
      if (liveResult?.payment_type) {
        console.log("User already chose payment method, skipping auto-popup");
        setIsSnapOpen(false);
        return;
      }
      
      setIsSnapOpen(true);
      window.snap.pay(lastSnapToken, {
        onSuccess: function(result: any) {
          setIsSnapOpen(false);
          localStorage.setItem('divexplore_last_payment', JSON.stringify(result));
          setPreviewStatus('success');
          localStorage.removeItem('divexplore_last_snap_token');
          navigate('/payment-status?status=success', { replace: true });
        },
        onPending: function(result: any) {
          setIsSnapOpen(false);
          localStorage.setItem('divexplore_last_payment', JSON.stringify(result));
          setPreviewStatus('pending');
          localStorage.removeItem('divexplore_last_snap_token');
          navigate('/payment-status?status=pending', { replace: true });
        },
        onError: function() {
          setIsSnapOpen(false);
          alert("Pembayaran gagal!");
          localStorage.removeItem('divexplore_last_snap_token');
          navigate('/payment-status?status=pending', { replace: true });
        },
        onClose: function() {
          setIsSnapOpen(false);
          setPreviewStatus('pending');
          // Refresh status untuk melihat apakah user sempat pilih metode sebelum tutup
          window.location.reload();
        }
      });
    }
  }, [autoPay, lastSnapToken, navigate, isStatusFetched, liveResult]);

  const vaHrs = String(Math.floor(vaSeconds / 3600)).padStart(2, '0');
  const vaMin = String(Math.floor((vaSeconds % 3600) / 60)).padStart(2, '0');
  const vaSec = String(vaSeconds % 60).padStart(2, '0');

  const [copied, setCopied] = useState(false);
  const vaNumber = paymentDetails?.vaNo || '8801 2345 6789 0042';
  const bankLabel = paymentDetails?.bankName || 'VIRTUAL ACCOUNT BANK MANDIRI';
  const orderId = paymentResult?.order_id || '#ORD-20250112-0042';

  // Read cart data
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useLayoutEffect(() => {
    // Utamakan ambil dari data pesanan terakhir yang baru dibuat
    const lastOrder = localStorage.getItem('divexplore_last_order_data');
    const savedCart = localStorage.getItem('divexplore_cart');
    
    if (lastOrder) {
      try {
        const order = JSON.parse(lastOrder);
        if (order && typeof order === 'object') {
          // Transform data order backend ke format UI CartItem jika perlu
          const items = order.items?.map((it: any) => ({
            name: it.product?.nama_produk || 'Produk',
            type: it.product?.vendor?.kategori || 'Destinasi',
            location: it.product?.lokasi || 'Indonesia',
            price: Number(it.harga_per_unit || it.harga_satuan || 0),
            quantity: it.qty || 1,
            image: it.product?.thumbnail_url || '',
            addons: it.addons || []
          })) || [];
          if (items.length > 0) {
            setCartItems(items);
            return; // Berhasil ambil dari order
          }
        }
      } catch (e) {
        console.error("Gagal parse last order:", e);
      }
    }
    
    // Fallback ke keranjang jika order data bermasalah
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      } catch (error) {
        console.error('Failed to parse cart data:', error);
      }
    }
  }, []);

  const firstItem = useMemo(() => cartItems[0] || {
    name: 'Gili Trawangan Snorkeling Experience',
    type: 'Snorkeling',
    location: 'Gili Trawangan, Lombok',
    price: 350000,
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=80',
    addons: []
  }, [cartItems]);

  const addonTotal = useMemo(() => (firstItem.addons || []).reduce((s: number, a: { price: number }) => s + (a.price * firstItem.quantity), 0), [firstItem]);
  const subtotal = useMemo(() => (firstItem.price * firstItem.quantity) + addonTotal, [firstItem.price, firstItem.quantity, addonTotal]);
  const taxes = useMemo(() => subtotal * 0.11, [subtotal]);
  const total = useMemo(() => subtotal + taxes, [subtotal, taxes]);

  // Email Notification State
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [isPopupClosing, setIsPopupClosing] = useState(false);

  useEffect(() => {
    if (previewStatus === 'success' && !isEmailSent) {
      const savedCustomer = localStorage.getItem('divexplore_customer');
      const customer = savedCustomer ? JSON.parse(savedCustomer) : { email: user?.email, name: user?.nama_lengkap };
      
      // Send Actual Email via EmailJS
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (serviceId && templateId && publicKey) {
        // eslint-disable-next-line
        setIsEmailSent(true);
        setShowEmailPopup(true);
        setIsPopupClosing(false);
        console.log("EmailJS settings found, but actual send is currently commented out for demo.");
      } else {
        // Fallback simulasi jika .env belum diisi
        setTimeout(() => {
          setIsEmailSent(true);
          setShowEmailPopup(true);
          setIsPopupClosing(false);
          console.log('Simulated Email sent to:', customer.email);
        }, 1500);
      }
    }
  }, [previewStatus, isEmailSent, user?.email, user?.nama_lengkap]);

  useEffect(() => {
    if (!showEmailPopup) return;
    const timer = setTimeout(() => setIsPopupClosing(true), 5000);
    return () => clearTimeout(timer);
  }, [showEmailPopup]);

  useEffect(() => {
    if (!isPopupClosing) return;
    const timer = setTimeout(() => {
      setShowEmailPopup(false);
      setIsPopupClosing(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [isPopupClosing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(vaNumber.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [isChecking, setIsChecking] = useState(false);

  const handleCheckStatus = () => {
    setIsChecking(true);
    // Simulasi pengecekan ke payment gateway (misal 2 detik)
    setTimeout(() => {
      setIsChecking(false);
      setPreviewStatus('success'); // selalu sukses untuk demo ini
    }, 2000);
  };

  return (
    <div className={styles.container}>
      {showEmailPopup && previewStatus === 'success' && (
        <div className={`${styles.emailNotifPopup} ${isPopupClosing ? styles.hideEmailNotifPopup : ''}`}>
          Email konfirmasi pembayaran berhasil dikirim!
        </div>
      )}
      {/* Header */}
      <Header />

      {/* Steps - Hanya muncul jika snap sudah tertutup */}
      {!isSnapOpen && (
        <div className={styles.stepsBar}>
          <div className={styles.step}>
            <div className={`${styles.stepCircle} ${styles.stepDone}`}><CheckCircle2 size={16} /></div>
            <span className={styles.stepLabel}>Keranjang</span>
          </div>
          <div className={`${styles.stepLine} ${styles.stepLineDone}`} />
          <div className={styles.step}>
            <div className={`${styles.stepCircle} ${styles.stepDone}`}><CheckCircle2 size={16} /></div>
            <span className={styles.stepLabel}>Checkout</span>
          </div>
          <div className={`${styles.stepLine} ${previewStatus === 'success' ? styles.stepLineDone : ''}`} />
          <div className={styles.step}>
            <div className={`${styles.stepCircle} ${
              previewStatus === 'success' ? styles.stepDone :
              previewStatus === 'pending' ? styles.stepActive :
              styles.stepExpired
            }`}>
              {previewStatus === 'success' ? <CheckCircle2 size={16} /> :
               previewStatus === 'expired' ? <XCircle size={16} /> : '3'}
            </div>
            <span className={`${styles.stepLabel} ${previewStatus === 'success' ? styles.stepLabelDone : previewStatus === 'pending' ? styles.stepLabelActive : styles.stepLabelExpired}`}>
              Pembayaran
            </span>
          </div>
        </div>
      )}

      {/* Main Card Area */}
      <main className={styles.main}>
        {/* Loading Overlay saat Snap Terbuka */}
        {isSnapOpen && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinnerWrap}>
              <RefreshCw size={40} className={styles.spinIcon} color="#0ea5e9" />
            </div>
            <p>Menyiapkan Pembayaran Aman...</p>
          </div>
        )}

        {/* Konten Utama - Hanya muncul jika snap sudah tertutup */}
        {!isSnapOpen && (
          <>
            {/* ── PENDING ── */}
        {previewStatus === 'pending' && (
          <div className={`${styles.statusCard} ${styles.pendingCard}`}>
            <div className={styles.statusIcon}>
              <div className={styles.pendingIconCircle}>
                <Clock size={36} color="#f59e0b" />
              </div>
            </div>
            <h1 className={styles.statusTitle}>Menunggu Pembayaran</h1>
            <p className={styles.orderId}>{orderId}</p>

            <div className={styles.vaBox}>
              <p className={styles.vaLabel}>{bankLabel}</p>
              {paymentDetails?.qrUrl ? (
                <div className={styles.qrContainer}>
                  <img src={paymentDetails.qrUrl} alt="QRIS Code" className={styles.qrImage} />
                  <p className={styles.qrHint}>Scan QR Code di atas dengan aplikasi pembayaran Anda</p>
                </div>
              ) : (
                <div className={styles.vaNumber}>
                  <span>{vaNumber}</span>
                  <button className={styles.copyBtn} onClick={handleCopy}>
                    <Copy size={14} />
                    {copied ? 'Disalin!' : 'Salin'}
                  </button>
                </div>
              )}
            </div>

            <div className={`${styles.countdownBadge} ${vaSeconds < 3600 ? styles.urgentBadge : ''}`}>
              <AlertTriangle size={14} />
              Batas waktu pembayaran: {vaHrs}:{vaMin}:{vaSec}
            </div>

            <button 
              className={styles.primaryBtn} 
              onClick={handleCheckStatus}
              disabled={isChecking}
            >
              <RefreshCw size={16} className={isChecking ? styles.spin : ''} />
              {isChecking ? 'Mengecek Status...' : 'Cek Status Pembayaran'}
            </button>
            <button className={styles.ghostBtn} onClick={() => navigate('/')}>
              Batalkan Pesanan
            </button>

            <div className={styles.secureNote}>
              <Shield size={14} color="#10b981" />
              <span>Transaksi aman & terenkripsi</span>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {previewStatus === 'success' && (
          <div className={`${styles.statusCard} ${styles.successCard}`}>
            <div className={styles.statusIcon}>
              <div className={styles.successIconCircle}>
                <CheckCircle2 size={40} color="#10b981" />
              </div>
            </div>
            <h1 className={styles.statusTitle}>Pembayaran Berhasil!</h1>
            <div className={styles.pointsBadge}>
              <Star size={14} fill="#f59e0b" color="#f59e0b" />
              +350 Poin
            </div>

            <div className={styles.successOrderBox}>
              <div className={styles.successOrderItem}>
                <img
                  src={firstItem.image}
                  alt="Order"
                  className={styles.successOrderImg}
                />
                <div>
                  <p className={styles.successOrderName}>{firstItem.name}</p>
                  <div className={styles.successOrderMeta}>
                    <MapPin size={12} />
                    <span>14 Jun 2026 • {firstItem.quantity} Orang</span>
                  </div>
                </div>
                <div className={styles.successOrderPrice}>Rp {total.toLocaleString('id-ID')}</div>
              </div>
              <div className={styles.successPayMethod}>
                <span>Metode Pembayaran</span>
                <span>BCA Virtual Account</span>
              </div>
            </div>


            <button className={styles.primaryBtnSuccess} onClick={() => navigate('/orders')}>
              <ShoppingBag size={16} />
              Lihat Pesanan
              <ChevronRight size={16} />
            </button>
            <button className={styles.ghostBtnSuccess}>
              <Download size={15} />
              Unduh e-Invoice
            </button>
          </div>
        )}

            {/* ── EXPIRED ── */}
            {previewStatus === 'expired' && (
              <div className={`${styles.statusCard} ${styles.expiredCard}`}>
                <div className={styles.statusIcon}>
                  <div className={styles.expiredIconCircle}>
                    <XCircle size={36} color="#ef4444" />
                  </div>
                </div>
                <h1 className={styles.statusTitle}>Waktu Habis — Pesanan Dibatalkan</h1>
                <p className={styles.expiredDesc}>
                  Pembayaran Anda belum kami terima karena melebihi batas waktu 15 menit.
                </p>

                <div className={styles.expiredIllustration}>
                  <div className={styles.expiredDoc}>
                    <div className={styles.docIcon}><FileText size={32} color="#94a3b8" /></div>
                    <span><FileText size={16} style={{marginRight: "8px"}} /> Transaksi Kedaluwarsa</span>
                  </div>
                </div>

                <button className={styles.primaryBtn} onClick={() => navigate('/checkout')}>
                  Pesan Kembali
                </button>
                <button className={styles.ghostBtn} onClick={() => navigate('/')}>
                  <Home size={15} />
                  Kembali ke Beranda
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
