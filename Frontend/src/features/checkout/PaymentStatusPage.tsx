import { useState, useEffect } from 'react';
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

type StatusType = 'pending' | 'success' | 'expired';

// Countdown for pending VA payment (15 min)
const VA_SECONDS = 15 * 60;

export default function PaymentStatusPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user, logout } = useAuth();
  const rawStatus = searchParams.get('status') ?? 'pending';
  const status: StatusType = ['pending', 'success', 'expired'].includes(rawStatus)
    ? (rawStatus as StatusType)
    : 'pending';

  // Preview switcher (dev helper shown as tabs)
  const [previewStatus, setPreviewStatus] = useState<StatusType>(status);

  // VA countdown (pending only)
  const [vaSeconds, setVaSeconds] = useState(VA_SECONDS);
  useEffect(() => {
    if (previewStatus !== 'pending' || vaSeconds <= 0) return;
    const t = setInterval(() => setVaSeconds(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [previewStatus, vaSeconds]);
  const vaMin = String(Math.floor(vaSeconds / 60)).padStart(2, '0');
  const vaSec = String(vaSeconds % 60).padStart(2, '0');

  const [copied, setCopied] = useState(false);
  const vaNumber = '8801 2345 6789 0042';
  const orderId = '#ORD-20250112-0042';

  const handleCopy = () => {
    navigator.clipboard.writeText(vaNumber.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckStatus = () => {
    // Simulate random outcome for demo
    const outcomes: StatusType[] = ['success', 'expired'];
    setPreviewStatus(outcomes[Math.floor(Math.random() * outcomes.length)]);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Box className={styles.logoIcon} size={24} />
          <span>DIVEXPLORE-3D</span>
        </div>
        <nav className={styles.navLinks}>
          <span className={styles.navLink} onClick={() => navigate('/')}>Destinasi</span>
          <span className={styles.navLink} onClick={() => navigate('/catalog')}>Vendor</span>
          <span className={styles.navLink}>Tentang</span>
        </nav>
        <div className={styles.userSection}>
          {isAuthenticated && user ? (
            <>
              <div className={styles.userInfo}>
                <img src={user.avatar} alt="User" className={styles.avatar} />
                <span>{user.name}</span>
              </div>
              <button className={styles.logoutBtn} onClick={logout}>Keluar</button>
            </>
          ) : (
            <button className={styles.logoutBtn} onClick={() => navigate('/login')}>Masuk</button>
          )}
        </div>
      </header>

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

      {/* Dev Preview Toggle (visible for all 3 states demo) */}
      <div className={styles.previewToggle}>
        <span className={styles.toggleLabel}>Preview Status:</span>
        {(['pending', 'success', 'expired'] as StatusType[]).map(s => (
          <button
            key={s}
            className={`${styles.toggleBtn} ${previewStatus === s ? styles.toggleActive : ''}`}
            onClick={() => setPreviewStatus(s)}
          >
            {s === 'pending' ? '⏳ Pending' : s === 'success' ? '✅ Berhasil' : '❌ Expired'}
          </button>
        ))}
      </div>

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

            <button className={styles.primaryBtn} onClick={handleCheckStatus}>
              <RefreshCw size={16} />
              Cek Status Pembayaran
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
                  src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=80"
                  alt="Order"
                  className={styles.successOrderImg}
                />
                <div>
                  <p className={styles.successOrderName}>Gili Trawangan Snorkeling</p>
                  <div className={styles.successOrderMeta}>
                    <MapPin size={12} />
                    <span>12 Jan 2025 • 2 Orang</span>
                  </div>
                </div>
                <div className={styles.successOrderPrice}>Rp 900.000</div>
              </div>
              <div className={styles.successPayMethod}>
                <span>Metode Pembayaran</span>
                <span>BCA Virtual Account</span>
              </div>
            </div>

            <button className={styles.primaryBtnSuccess} onClick={() => navigate('/')}>
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
