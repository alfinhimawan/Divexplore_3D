import { useNavigate } from 'react-router-dom';
import { XCircle, AlertTriangle, Search, ChevronLeft, ShieldAlert, CreditCard, RotateCcw } from 'lucide-react';
import styles from './RejectedOrderPage.module.css';
import Header from '../../components/common/Header';

export default function RejectedOrderPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {/* Header */}
      <Header />

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
