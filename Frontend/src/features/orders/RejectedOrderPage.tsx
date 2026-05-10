import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import { Box, XCircle, AlertTriangle, Search, ChevronLeft, ShieldAlert, CreditCard, RotateCcw } from 'lucide-react';
import styles from './RejectedOrderPage.module.css';

export default function RejectedOrderPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

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

      <main className={styles.main}>
        <button className={styles.backBtn} onClick={() => navigate('/orders')}>
          <ChevronLeft size={18} /> Kembali ke Riwayat
        </button>

        <div className={styles.content}>
          {/* Main Error Card */}
          <div className={styles.errorCard}>
            <div className={styles.iconWrapper}>
              <div className={styles.iconPulse}>
                <XCircle size={56} color="#ef4444" />
              </div>
            </div>
            
            <h1 className={styles.errorTitle}>Pesanan Ditolak oleh Vendor</h1>
            <p className={styles.errorDesc}>
              Mohon maaf, pesanan Anda dengan ID <strong className={styles.highlight}>#ORD-20241105-0092</strong> tidak dapat diproses saat ini. 
              Hal ini biasanya terjadi karena perubahan ketersediaan jadwal atau kuota dari pihak vendor.
            </p>

            <div className={styles.reasonBox}>
              <AlertTriangle size={20} color="#f59e0b" className={styles.reasonIcon} />
              <div className={styles.reasonText}>
                <strong>Alasan Penolakan:</strong>
                <span>"Kuota peserta untuk tanggal yang Anda pilih telah penuh."</span>
              </div>
            </div>

            <div className={styles.refundInfo}>
              <div className={styles.refundHeader}>
                <ShieldAlert size={18} color="#10b981" />
                <span>Informasi Pengembalian Dana (Refund)</span>
              </div>
              <p>Dana sebesar <strong>Rp 2.500.000</strong> akan dikembalikan secara otomatis ke metode pembayaran asli Anda (BCA Virtual Account). Proses ini membutuhkan waktu 1-3 hari kerja.</p>
              <div className={styles.refundSteps}>
                <div className={styles.step}>
                  <div className={styles.stepIcon}><XCircle size={14} color="#ef4444" /></div>
                  <span>Pesanan Ditolak</span>
                </div>
                <div className={styles.stepLine}></div>
                <div className={styles.step}>
                  <div className={`${styles.stepIcon} ${styles.stepActive}`}><RotateCcw size={14} color="#0ea5e9" /></div>
                  <span className={styles.stepTextActive}>Memproses Refund</span>
                </div>
                <div className={styles.stepLine}></div>
                <div className={styles.step}>
                  <div className={styles.stepIcon}><CreditCard size={14} color="#64748b" /></div>
                  <span className={styles.stepTextPending}>Dana Dikembalikan</span>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => navigate('/catalog')}>
                <Search size={18} /> Cari Vendor Lain
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
