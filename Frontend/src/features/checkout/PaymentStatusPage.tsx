import { useState, useEffect, useMemo, useLayoutEffect } from 'react';
// import emailjs from '@emailjs/browser';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import {
  Box,
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
  AlertTriangle
} from 'lucide-react';
import styles from './PaymentStatusPage.module.css';
import Header from '../../components/common/Header';

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
const VA_SECONDS = 60;

export default function PaymentStatusPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const rawStatus = searchParams.get('status') ?? 'pending';
  const status: StatusType = ['pending', 'success', 'expired'].includes(rawStatus)
    ? (rawStatus as StatusType)
    : 'pending';

  // Preview switcher (dev helper shown as tabs)
  const [previewStatus, setPreviewStatus] = useState<StatusType>(status);



  // VA countdown (pending only)
  const [vaSeconds, setVaSeconds] = useState(VA_SECONDS);
  useEffect(() => {
    if (previewStatus !== 'pending') return;
    const t = setInterval(() => {
      setVaSeconds(s => {
        if (s <= 1) {
          setPreviewStatus('expired');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [previewStatus]);
  const vaMin = String(Math.floor(vaSeconds / 60)).padStart(2, '0');
  const vaSec = String(vaSeconds % 60).padStart(2, '0');

  const [copied, setCopied] = useState(false);
  const vaNumber = '8801 2345 6789 0042';
  const orderId = '#ORD-20250112-0042';

  // Read cart data
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useLayoutEffect(() => {
    const saved = localStorage.getItem('divexplore_cart');
    if (saved) {
      try {
        // eslint-disable-next-line
        setCartItems(JSON.parse(saved));
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
      const customer = savedCustomer ? JSON.parse(savedCustomer) : { email: user?.email, name: user?.name };
      
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
  }, [previewStatus, isEmailSent, user?.email, user?.name]);

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

      {/* Steps */}
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

      {/* Dev Preview Toggle Removed */}

      {/* Main Card Area */}
      <main className={styles.main}>
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
              <p className={styles.vaLabel}>VIRTUAL ACCOUNT BANK MANDIRI</p>
              <div className={styles.vaNumber}>
                <span>{vaNumber}</span>
                <button className={styles.copyBtn} onClick={handleCopy}>
                  <Copy size={14} />
                  {copied ? 'Disalin!' : 'Salin'}
                </button>
              </div>
            </div>

            <div className={`${styles.countdownBadge} ${vaSeconds < 120 ? styles.urgentBadge : ''}`}>
              <AlertTriangle size={14} />
              Bayar sebelum {vaMin}:{vaSec} hari ini
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
                <div className={styles.docIcon}>📄</div>
                <span>Transaksi Kedaluwarsa</span>
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
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <Box size={20} className={styles.logoIcon} />
              <span>DIVEXPLORE-3D</span>
            </div>
            <p>Platform Wisata Bahari 3D #1 Indonesia</p>
          </div>
          <div className={styles.footerLinks}>
            <div>
              <h4>DESTINASI</h4>
              <a href="#">Raja Ampat</a>
              <a href="#">Bunaken</a>
            </div>
            <div>
              <h4>TENTANG</h4>
              <a href="#">Manifesto</a>
              <a href="#">Tim Kami</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2025 DIVEXPLORE-3D. All rights reserved.</span>
          <div className={styles.socialIcons}><span>IG</span><span>TW</span></div>
        </div>
      </footer>
    </div>
  );
}
