import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import {
  Box, MapPin, Calendar, Search, Filter, ShoppingBag, 
  CheckCircle2, Clock, XCircle, ChevronRight, AlertCircle
} from 'lucide-react';
import styles from './OrderHistoryPage.module.css';

type Tab = 'semua' | 'pending' | 'completed' | 'rejected';

interface Order {
  id: string;
  status: 'pending' | 'completed' | 'rejected';
  title: string;
  category: string;
  location: string;
  date: string;
  total: number;
  image: string;
  reason?: string;
}

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock orders
  const orders: Order[] = [
    {
      id: 'ORD-20250112-0042',
      status: 'pending',
      title: 'Snorkeling Gili Premium',
      category: 'Aktivitas Bahari',
      location: 'Gili Trawangan, Lombok',
      date: '12 Jan 2025',
      total: 900000,
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=80'
    },
    {
      id: 'ORD-20241220-0118',
      status: 'completed',
      title: 'Gili Sea Garden Resort',
      category: 'Akomodasi',
      location: 'Lombok',
      date: '20 Des 2024',
      total: 1350000,
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=200&q=80'
    },
    {
      id: 'ORD-20241105-0092',
      status: 'rejected',
      title: 'Diving Bunaken Explore',
      category: 'Aktivitas Bahari',
      location: 'Bunaken, Sulawesi Utara',
      date: '05 Nov 2024',
      total: 2500000,
      image: 'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=200&q=80',
      reason: 'Kuota penuh pada tanggal yang dipilih.'
    }
  ];

  const filteredOrders = orders.filter(order => {
    const matchTab = activeTab === 'semua' || order.status === activeTab;
    const matchSearch = order.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <div className={`${styles.badge} ${styles.badgePending}`}><Clock size={14}/> Menunggu Pembayaran</div>;
      case 'completed':
        return <div className={`${styles.badge} ${styles.badgeCompleted}`}><CheckCircle2 size={14}/> Selesai</div>;
      case 'rejected':
        return <div className={`${styles.badge} ${styles.badgeRejected}`}><XCircle size={14}/> Ditolak</div>;
      default:
        return null;
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
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Riwayat Pesanan</h1>
          <p className={styles.pageDesc}>Pantau status pesanan dan kelola tiket wisata bahari Anda.</p>
        </div>

        <div className={styles.contentLayout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.userProfileCard}>
              <img src={user?.avatar || 'https://i.pravatar.cc/150?img=11'} alt="Profile" className={styles.profileImg} />
              <div className={styles.profileInfo}>
                <h3 className={styles.profileName}>{user?.name || 'Wisatawan'}</h3>
                <p className={styles.profileEmail}>{user?.email || 'user@divexplore.id'}</p>
              </div>
            </div>
            
            <nav className={styles.sideNav}>
              <a href="#" className={`${styles.sideNavLink} ${styles.active}`}><ShoppingBag size={18}/> Pesanan Saya</a>
              <a href="#" className={styles.sideNavLink}><Box size={18}/> Wishlist</a>
              <a href="#" className={styles.sideNavLink}><AlertCircle size={18}/> Ulasan Saya</a>
            </nav>
          </aside>

          {/* Main Orders List */}
          <div className={styles.ordersArea}>
            <div className={styles.toolbar}>
              <div className={styles.tabs}>
                {(['semua', 'pending', 'completed', 'rejected'] as Tab[]).map(tab => (
                  <button 
                    key={tab} 
                    className={`${styles.tabBtn} ${activeTab === tab ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <div className={styles.searchBox}>
                <Search size={16} className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Cari ID pesanan atau nama produk..." 
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.ordersList}>
              {filteredOrders.length === 0 ? (
                <div className={styles.emptyState}>
                  <ShoppingBag size={48} className={styles.emptyIcon} />
                  <p>Tidak ada pesanan ditemukan.</p>
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <div className={styles.headerLeft}>
                        <ShoppingBag size={16} className={styles.storeIcon} />
                        <span className={styles.storeName}>{order.category}</span>
                        <span className={styles.orderDate}>{order.date}</span>
                        <span className={styles.orderId}>{order.id}</span>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className={styles.orderBody}>
                      <img src={order.image} alt={order.title} className={styles.orderImg} />
                      <div className={styles.orderInfo}>
                        <h3 className={styles.orderTitle}>{order.title}</h3>
                        <p className={styles.orderLoc}><MapPin size={12}/> {order.location}</p>
                        {order.status === 'rejected' && (
                          <div className={styles.rejectReason}>
                            <AlertCircle size={14} />
                            Alasan Penolakan: {order.reason}
                          </div>
                        )}
                      </div>
                      <div className={styles.orderPrice}>
                        <span className={styles.priceLabel}>Total Belanja</span>
                        <span className={styles.priceValue}>Rp {order.total.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    
                    <div className={styles.orderFooter}>
                      {order.status === 'pending' && (
                        <>
                          <button className={styles.btnSecondary} onClick={() => navigate(`/payment-status?status=pending`)}>Lihat Instruksi</button>
                          <button className={styles.btnPrimary}>Bayar Sekarang</button>
                        </>
                      )}
                      {order.status === 'completed' && (
                        <>
                          <button className={styles.btnSecondary}>Beri Ulasan</button>
                          <button className={styles.btnPrimary}>Beli Lagi</button>
                        </>
                      )}
                      {order.status === 'rejected' && (
                        <>
                          <button className={styles.btnSecondary} onClick={() => navigate('/rejected-order')}>Lihat Detail</button>
                          <button className={styles.btnPrimary} onClick={() => navigate('/catalog')}>Cari Vendor Lain</button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
