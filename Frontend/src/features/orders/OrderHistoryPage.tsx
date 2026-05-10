import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import {
  Box, Calendar, Users, CreditCard,
  ChevronLeft, ChevronRight, CheckCircle2
} from 'lucide-react';
import styles from './OrderHistoryPage.module.css';

type Tab = 'semua' | 'pending' | 'aktif' | 'selesai' | 'dibatalkan';

interface Order {
  id: string;
  orderId: string;
  status: 'pending' | 'aktif' | 'selesai' | 'dibatalkan';
  title: string;
  vendor: string;
  date: string;
  pax: number;
  paymentMethod: string;
  orderDate: string;
  total: number;
  image: string;
  hasReviewed?: boolean;
}

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('semua');

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('divexplore_cart');
    if (saved) {
      const cartItems = JSON.parse(saved);
      const convertedOrders: Order[] = cartItems.map((item: any, index: number) => {
        const addonTotal = item.addons ? item.addons.reduce((s: number, a: any) => s + (a.price * item.quantity), 0) : 0;
        const subtotal = (item.price * item.quantity) + addonTotal;
        const taxes = subtotal * 0.11;
        const total = subtotal + taxes;
        
        return {
          id: String(index + 1),
          orderId: `#ORD-DX3D-00${index + 1}`,
          status: 'selesai',
          title: item.name,
          vendor: 'Divexplore Verified Vendor',
          date: '14 Jun 2026',
          pax: item.quantity,
          paymentMethod: 'BCA Virtual Account',
          orderDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          total: total,
          image: item.image,
          hasReviewed: false
        };
      });
      setOrders(convertedOrders);
    }
  }, []);

  const filteredOrders = orders.filter(order => {
    return activeTab === 'semua' || order.status === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className={`${styles.badge} ${styles.badgePending}`}>PENDING</span>;
      case 'aktif': return <span className={`${styles.badge} ${styles.badgeActive}`}>ACTIVE</span>;
      case 'selesai': return <span className={`${styles.badge} ${styles.badgeCompleted}`}>COMPLETED</span>;
      case 'dibatalkan': return <span className={`${styles.badge} ${styles.badgeCanceled}`}>CANCELED</span>;
      default: return null;
    }
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

      <main className={styles.main}>
        <div className={styles.breadcrumb}>
          <span>Beranda</span> / <span>Profil</span> / <span className={styles.bcActive}>Riwayat Pesanan</span>
        </div>
        
        <h1 className={styles.pageTitle}>Riwayat Pesanan</h1>

        <div className={styles.tabsContainer}>
          {(['semua', 'pending', 'aktif', 'selesai', 'dibatalkan'] as Tab[]).map(tab => (
            <button 
              key={tab} 
              className={`${styles.tabBtn} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.ordersList}>
          {filteredOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Tidak ada pesanan ditemukan.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className={`${styles.orderCard} ${order.status === 'aktif' ? styles.orderCardActive : ''} ${order.status === 'dibatalkan' ? styles.orderCardCanceled : ''}`}>
                <div className={styles.cardMain}>
                  <img src={order.image} alt={order.title} className={styles.orderImg} />
                  
                  <div className={styles.orderTitleCol}>
                    <div className={styles.orderIdRow}>
                      <span className={styles.orderId}>{order.orderId}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <h3 className={styles.orderTitle}>{order.title}</h3>
                    <p className={styles.orderVendor}>{order.vendor}</p>
                  </div>

                  <div className={styles.orderMetaCol}>
                    <div className={styles.metaRow}><Calendar size={14} /> {order.date}</div>
                    <div className={styles.metaRow}><Users size={14} /> {order.pax} Peserta</div>
                  </div>

                  <div className={styles.orderPaymentCol}>
                    <div className={styles.metaRow}><CreditCard size={14} /> {order.paymentMethod}</div>
                    <div className={styles.orderDateLabel}>Dipesan pada {order.orderDate}</div>
                  </div>
                </div>

                <div className={styles.cardRight}>
                  <div className={styles.priceContainer}>
                    <span className={styles.priceValue}>Rp {order.total.toLocaleString('id-ID')}</span>
                  </div>
                  
                  <div className={styles.actionButtons}>
                    {order.status === 'selesai' && (
                      <>
                        {order.hasReviewed ? (
                          <div className={styles.reviewedBadge}><CheckCircle2 size={14} /> Sudah Diulas</div>
                        ) : (
                          <button className={styles.btnPrimary} onClick={() => navigate('/review')}>Tulis Ulasan</button>
                        )}
                        <button className={styles.btnSecondary}>Unduh Invoice</button>
                      </>
                    )}
                    {order.status === 'pending' && (
                      <>
                        <button className={styles.btnWarning}>Bayar Sekarang</button>
                        <button className={styles.btnDangerGhost}>Batalkan</button>
                      </>
                    )}
                    {order.status === 'aktif' && (
                      <>
                        <button className={styles.btnSecondary}>Detail Pesanan</button>
                        <button className={styles.btnSecondaryGhost}>E-Ticket</button>
                      </>
                    )}
                    {order.status === 'dibatalkan' && (
                      <button className={styles.btnSecondaryGhost}>Pesan Lagi</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination mock */}
        <div className={styles.pagination}>
          <button className={styles.pageBtn}><ChevronLeft size={16} /> Prev</button>
          <button className={`${styles.pageBtn} ${styles.pageActive}`}>1</button>
          <button className={styles.pageBtn}>2</button>
          <button className={styles.pageBtn}>3</button>
          <span className={styles.pageDots}>...</span>
          <button className={styles.pageBtn}>11</button>
          <button className={styles.pageBtn}>Next <ChevronRight size={16} /></button>
        </div>
      </main>
    </div>
  );
}
