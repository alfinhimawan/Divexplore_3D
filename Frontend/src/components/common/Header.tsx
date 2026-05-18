import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import { ShoppingCart, Map, Grid, History, LogOut, LogIn } from 'lucide-react';
import styles from './Header.module.css';
import Swal from 'sweetalert2';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const saved = localStorage.getItem('divexplore_cart');
      if (saved) {
        try {
          const items = JSON.parse(saved);
          setCartCount(Array.isArray(items) ? items.length : 0);
        } catch (e) {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('cartUpdated', updateCount);
    
    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('cartUpdated', updateCount);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Yakin ingin keluar?',
      text: 'Anda akan keluar dari akun Divexplore-3D.',
      icon: 'question',
      iconColor: '#0ea5e9',
      showCancelButton: true,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      background: '#0f172a',
      color: '#f1f5f9',
      reverseButtons: true,
      customClass: {
        popup: 'swal-popup-dark',
      },
    });

    if (result.isConfirmed) {
      logout();
      navigate('/');
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <img src="/logo.png" alt="Divexplore-3D Logo" className={styles.logoImage} />
        <span>DIVEXPLORE-3D</span>
      </div>
      <nav className={styles.navLinks}>
        <span
          className={`${styles.navLink} ${isActive('/') ? styles.activeLink : ''}`}
          onClick={() => navigate('/')}
        >
          <Map size={16} />
          Destinasi
        </span>
        <span
          className={`${styles.navLink} ${isActive('/catalog') || isActive('/product') ? styles.activeLink : ''}`}
          onClick={() => navigate('/catalog')}
        >
          <Grid size={16} />
          Katalog
        </span>
        {isAuthenticated && (
          <span
            className={`${styles.navLink} ${isActive('/orders') ? styles.activeLink : ''}`}
            onClick={() => navigate('/orders')}
          >
            <History size={16} />
            Riwayat Pesanan
          </span>
        )}
        <div 
          className={`${styles.cartIconWrapper} ${isActive('/cart') ? styles.activeCart : ''}`}
          onClick={() => navigate('/cart')}
          title="Keranjang Belanja"
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
        </div>
      </nav>
      <div className={styles.userSection}>
        {isAuthenticated && user ? (
          <>
            <div className={styles.userInfo}>
              <img 
                src={user.foto_profil_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama_lengkap)}&background=0ea5e9&color=fff`} 
                alt="User" 
                className={styles.avatar} 
              />
              <span>{user.nama_lengkap}</span>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <LogOut size={14} /> Keluar
            </button>
          </>
        ) : (
          <button className={styles.logoutBtn} onClick={() => navigate('/login')}>
            <LogIn size={14} /> Masuk
          </button>
        )}
      </div>
    </header>
  );
}
