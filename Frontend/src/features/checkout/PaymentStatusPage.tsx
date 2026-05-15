import { useState, useEffect, useMemo, useLayoutEffect, useRef } from 'react';
import Swal from 'sweetalert2';
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

type StatusType = 'pending' | 'success' | 'expired' | 'cancelled';

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
  const [isChecking, setIsChecking] = useState(false);
  const pollingRef = useRef<any>(null);
  
  // Ambil dari state atau fallback ke localStorage dengan pengaman
  const paymentResult = useMemo(() => {
    try {
      if (location.state?.paymentResult) return location.state.paymentResult;
      
      // PRIORITAS 1: Data Live dari Server (Tampilkan secepat mungkin!)
      if (liveResult) {
        return liveResult;
      }
      
      // PRIORITAS 2: Data tersimpan di browser (Cache)
      const saved = localStorage.getItem('divexplore_last_payment');
      if (saved) {
        const parsed = JSON.parse(saved);
        const lastOrderStr = localStorage.getItem('divexplore_last_order_data');
        
        if (lastOrderStr) {
          const lastOrder = JSON.parse(lastOrderStr);
          // Hanya gunakan cache JIKA ID-nya benar-benar cocok (UUID-nya sama)
          if (parsed.order_id && parsed.order_id.startsWith(lastOrder.id)) {
            return parsed;
          }
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  }, [location.state, liveResult]);

  const lastSnapToken = localStorage.getItem('divexplore_last_snap_token');

  // Helper to extract VA and Bank Name - SUPER AGGRESSIVE DETECTION
  const paymentDetails = useMemo(() => {
    if (!paymentResult) return null;
    
    let bankName = 'Metode Pembayaran';
    let vaNo = '';
    let qrUrl = '';
    
    // DETEKSI JENIS BANK
    if (paymentResult.va_numbers && paymentResult.va_numbers.length > 0) {
      const va = paymentResult.va_numbers[0];
      bankName = `BANK ${va.bank.toUpperCase()}`;
      vaNo = va.va_number;
    } 
    else if (paymentResult.permata_va_number) {
      bankName = 'BANK PERMATA';
      vaNo = paymentResult.permata_va_number;
    } 
    else if (paymentResult.bill_key) {
      bankName = 'BANK MANDIRI';
      const biller = paymentResult.biller_code || '70012';
      vaNo = `${biller} - ${paymentResult.bill_key}`;
    }
    else if (paymentResult.payment_type === 'gopay' || paymentResult.payment_type === 'qris') {
      bankName = 'GOPAY / QRIS';
      const qrAction = paymentResult.actions?.find((a: any) => a.name === 'generate-qr-code');
      qrUrl = qrAction?.url || '';
      vaNo = 'Silakan Scan QR Code';
    }
    else if (paymentResult.payment_code) {
      bankName = 'KODE PEMBAYARAN';
      vaNo = paymentResult.payment_code;
    }

    // SEARCHING AGRESSIVE (Jika vaNo masih kosong)
    if (!vaNo) {
      vaNo = paymentResult.va_number || paymentResult.va_no || paymentResult.bill_key || paymentResult.payment_code || '';
      if (paymentResult.bank) bankName = `BANK ${paymentResult.bank.toUpperCase()}`;
    }

    return { bankName, vaNo, qrUrl };
  }, [paymentResult]);

  const { user } = useAuth();
  const rawStatus = searchParams.get('status') ?? 'pending';
  const status: StatusType = ['pending', 'success', 'expired', 'cancelled'].includes(rawStatus)
    ? (rawStatus as StatusType)
    : 'pending';

  // Preview switcher (dev helper shown as tabs)
  const [previewStatus, setPreviewStatus] = useState<StatusType>(status);



  // VA countdown (pending only)
  const [vaSeconds, setVaSeconds] = useState(0);

  useEffect(() => {
    const calculateDiff = () => {
      // Cari waktu kedaluwarsa dari berbagai sumber
      let expiryMs = 0;

      if (paymentResult?.expiry_time) {
        const expiryStr = paymentResult.expiry_time.replace(' ', 'T');
        expiryMs = new Date(expiryStr).getTime();
      } else {
        // Fallback: ambil timeout_at dari data pesanan di localStorage
        try {
          const orderStr = localStorage.getItem('divexplore_last_order_data');
          if (orderStr) {
            const order = JSON.parse(orderStr);
            if (order.timeout_at) {
              expiryMs = new Date(order.timeout_at).getTime();
            }
          }
        } catch (e) {}
      }

      if (expiryMs > 0) {
        const diff = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
        setVaSeconds(diff);
        if (diff <= 0) setPreviewStatus('expired');
      } else {
        // Hanya jika benar-benar tidak ada data, hitung mundur 1 detik
        setVaSeconds(s => (s > 0 ? s - 1 : 0));
      }
    };

    const t = setInterval(calculateDiff, 1000);
    return () => clearInterval(t);
  }, [paymentResult]);

  // Ambil data pembayaran terbaru dari server (dengan Polling)
  useEffect(() => {
    const fetchStatus = async () => {
      const lastOrderStr = localStorage.getItem('divexplore_last_order_data');
      if (!lastOrderStr) {
        setIsStatusFetched(true);
        return;
      }

      try {
        const order = JSON.parse(lastOrderStr);
        
        // Cek ke Midtrans via Backend
        const res = await api.get(`/api/orders/${order.id}/payment-status`);
        const midtransData = res.data?.data;
        
        if (midtransData && midtransData.payment_type && midtransData.payment_type !== 'null') {
          console.log('[Payment] Server has payment data:', midtransData.payment_type);
          setLiveResult({ ...midtransData, internal_order_id: order.id });
          localStorage.setItem('divexplore_last_payment', JSON.stringify(midtransData));
          // Data ditemukan, hentikan polling
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (e) {
        console.warn('[Payment] Polling error:', e);
      } finally {
        setIsStatusFetched(true);
      }
    };

    fetchStatus();
    pollingRef.current = setInterval(fetchStatus, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // LOGIKA AUTO-TRIGGER SNAP MIDTRANS
  useEffect(() => {
    // Tunggu sampai status benar-benar terambil (isStatusFetched)
    if (autoPay && lastSnapToken && window.snap && isStatusFetched) {
      
      // Jika hasil fetch menunjukkan sudah ada metode (VA/QRIS), JANGAN buka popup
      const hasPaymentMethod = liveResult?.payment_type || 
                               (liveResult?.va_numbers && liveResult.va_numbers.length > 0) ||
                               liveResult?.permata_va_number ||
                               liveResult?.bill_key;

      if (hasPaymentMethod && hasPaymentMethod !== 'null') {
        console.log("[Payment] Skipping popup - method already exists:", hasPaymentMethod);
        setIsSnapOpen(false);
        return;
      }

      console.log("[Payment] Opening Midtrans Snap Popup...");
      setIsSnapOpen(true);
      window.snap.pay(lastSnapToken, {
        onSuccess: (result: any) => {
          console.log('[Payment] Success:', result);
          // HENTIKAN polling agar tidak menimpa data
          if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
          localStorage.setItem('divexplore_last_payment', JSON.stringify(result));
          localStorage.removeItem('divexplore_last_snap_token');
          setLiveResult(result);
          setIsSnapOpen(false);
          setPreviewStatus('success');
        },
        onPending: (result: any) => {
          console.log('[Payment] Pending (user picked method):', result);
          if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
          localStorage.setItem('divexplore_last_payment', JSON.stringify(result));
          localStorage.removeItem('divexplore_last_snap_token');
          setLiveResult(result);
          setIsSnapOpen(false);
          setPreviewStatus('pending');
          // Hapus auto_pay dari URL agar refresh tidak buka popup lagi
          navigate('/payment-status?status=pending', { replace: true });
        },
        onError: (result: any) => {
          console.log('[Payment] Error:', result);
          setIsSnapOpen(false);
          localStorage.removeItem('divexplore_last_snap_token');
          alert("Pembayaran gagal!");
        },
        onClose: () => {
          console.log('[Payment] Popup closed by user');
          setIsSnapOpen(false);
          setPreviewStatus('pending');
        }
      });
    }
  }, [autoPay, lastSnapToken, navigate, isStatusFetched, liveResult]);

  const vaHrs = String(Math.floor(vaSeconds / 3600)).padStart(2, '0');
  const vaMin = String(Math.floor((vaSeconds % 3600) / 60)).padStart(2, '0');
  const vaSec = String(vaSeconds % 60).padStart(2, '0');

  const [copied, setCopied] = useState(false);
  const vaNumber = paymentDetails?.vaNo || (isChecking ? 'Menyinkronkan...' : 'Menunggu pilihan bank...');
  const bankLabel = paymentDetails?.bankName || (isChecking ? 'Mengecek...' : 'Memuat metode...');
  
  // Ambil ID pesanan dengan fallback super teliti
  const orderId = useMemo(() => {
    if (paymentResult?.order_id) return paymentResult.order_id;
    if (liveResult?.order_id) return liveResult.order_id;
    if (liveResult?.internal_order_id) return liveResult.internal_order_id;
    
    const saved = localStorage.getItem('divexplore_last_order_data');
    if (saved) return JSON.parse(saved).id;
    
    return 'Memuat ID Pesanan...';
  }, [paymentResult, liveResult]);

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

  // DATA ORDER ASLI DARI DATABASE (DITERIMA SETELAH CHECKOUT)
  const actualOrder = useMemo(() => {
    try {
      const orderStr = localStorage.getItem('divexplore_last_order_data');
      return orderStr ? JSON.parse(orderStr) : null;
    } catch (e) {
      return null;
    }
  }, []);

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

  const handleCheckStatus = async () => {
    Swal.fire({
      title: 'Menyinkronkan...',
      text: 'Mengecek status pembayaran Anda ke Midtrans',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    setIsChecking(true);
    
    try {
      const lastOrderStr = localStorage.getItem('divexplore_last_order_data');
      if (!lastOrderStr) {
        Swal.fire('Error', 'Data pesanan tidak ditemukan di browser.', 'error');
        setIsChecking(false);
        return;
      }

      const order = JSON.parse(lastOrderStr);
      
      // Panggil API status pembayaran asli (Sinkronisasi Midtrans -> Supabase)
      const res = await api.get(`/api/orders/${order.id}/payment-status`);
      
      // Deteksi struktur data secara cerdas (Axios interceptor friendly)
      const midtransData = res.data?.data || res.data;
      
      // Jika benar-benar tidak ada data atau status_code 404 asli dari Midtrans tanpa fallback
      if (!midtransData || (midtransData.status_code === '404' && !midtransData.is_fallback)) {
        Swal.fire('Info', 'Transaksi belum terdaftar di Midtrans. Silakan selesaikan pembayaran di pop-up.', 'info');
        setIsChecking(false);
        return;
      }

      // Update state live dengan data VALID dari server
      setLiveResult({ ...midtransData, internal_order_id: order.id });
      const currentStatus = midtransData.transaction_status;
      
      if (currentStatus === 'settlement' || currentStatus === 'capture') {
        setPreviewStatus('success');
        Swal.fire({
          title: 'Berhasil!',
          text: 'Pembayaran Anda telah kami terima.',
          icon: 'success',
          confirmButtonText: 'Lanjutkan',
          confirmButtonColor: '#10b981'
        });
      } else if (currentStatus === 'pending') {
        setPreviewStatus('pending');
        Swal.fire({
          title: 'Menunggu Pembayaran',
          text: 'Kami belum menerima pembayaran Anda. Silakan selesaikan transaksi sesuai instruksi.',
          icon: 'warning',
          confirmButtonText: 'Mengerti',
          confirmButtonColor: '#f59e0b'
        });
      } else if (currentStatus === 'expire' || currentStatus === 'cancel' || currentStatus === 'deny' || currentStatus === 'cancelled') {
        setPreviewStatus('expired');
        Swal.fire('Transaksi Gagal', `Status: ${currentStatus.toUpperCase()}`, 'error');
      } else {
        Swal.fire('Info', `Status Pembayaran: ${currentStatus.toUpperCase()}`, 'info');
      }
    } catch (e: any) {
      console.error("[Payment] Sync Error:", e);
      const errorMsg = e.response?.data?.message || e.message || "Gagal menghubungi server";
      Swal.fire('Gagal Sinkron', errorMsg, 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleCancelOrder = async () => {
    const result = await Swal.fire({
      title: 'Batalkan Pesanan?',
      text: "Tindakan ini tidak dapat dibatalkan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Batalkan!',
      cancelButtonText: 'Kembali'
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Membatalkan...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      try {
        const lastOrderStr = localStorage.getItem('divexplore_last_order_data');
        if (!lastOrderStr) throw new Error("Data pesanan tidak ditemukan.");
        
        const order = JSON.parse(lastOrderStr);
        await api.post(`/api/orders/${order.id}/cancel`);

        // Bersihkan cache agar tidak muncul pop-up lagi
        localStorage.removeItem('divexplore_last_payment');
        localStorage.removeItem('divexplore_last_order_data');
        localStorage.removeItem('divexplore_last_snap_token');

        await Swal.fire({
          title: 'Dibatalkan',
          text: 'Pesanan Anda telah berhasil dibatalkan.',
          icon: 'success'
        });

        navigate('/orders');
      } catch (e: any) {
        console.error("[Payment] Cancel Error:", e);
        Swal.fire('Gagal', e.response?.data?.message || 'Gagal membatalkan pesanan.', 'error');
      }
    }
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

        {/* Konten Utama - Hanya muncul jika snap sudah tertutup DAN status sudah siap */}
        {(!isSnapOpen && isStatusFetched) ? (
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
            <button className={styles.ghostBtn} onClick={handleCancelOrder}>
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
                  <p className={styles.successOrderName}>{actualOrder?.orderItems?.[0]?.product?.nama_produk || actualOrder?.items?.[0]?.name || firstItem.name}</p>
                  <div className={styles.successOrderMeta}>
                    <MapPin size={12} />
                    <span>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {actualOrder?.orderItems?.[0]?.qty || actualOrder?.items?.[0]?.quantity || 1} Orang</span>
                  </div>
                </div>
                <div className={styles.successOrderPrice}>
                  Rp {Math.round(Number(actualOrder?.total_pembayaran || total)).toLocaleString('id-ID')}
                </div>
              </div>
              <div className={styles.successPayMethod}>
                <span>Metode Pembayaran</span>
                <span>{paymentDetails?.bankName || 'Terdeteksi Otomatis'}</span>
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

            {/* ── EXPIRED / CANCELLED ── */}
            {(previewStatus === 'expired' || previewStatus === 'cancelled') && (
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

                <button className={styles.primaryBtn} onClick={() => navigate('/catalog')}>
                  Pesan Kembali
                </button>
                <button className={styles.ghostBtn} onClick={() => navigate('/orders')}>
                  <ShoppingBag size={15} />
                  Lihat Pesanan Saya
                </button>
              </div>
            )}
          </>
        ) : !isSnapOpen && (
          <div className={styles.loadingOverlay}>
             <RefreshCw size={30} className={styles.spinIcon} color="#0ea5e9" />
             <p>Sinkronisasi data pembayaran...</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
