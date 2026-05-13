import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import { Box } from 'lucide-react';
import styles from './Header.module.css';
import Swal from 'sweetalert2';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

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
        <Box className={styles.logoIcon} size={24} />
        <span>DIVEXPLORE-3D</span>
      </div>
      <nav className={styles.navLinks}>
        <span
          className={`${styles.navLink} ${isActive('/') ? styles.activeLink : ''}`}
          onClick={() => navigate('/')}
        >
          Destinasi
        </span>
        <span
          className={`${styles.navLink} ${isActive('/catalog') || isActive('/product') ? styles.activeLink : ''}`}
          onClick={() => navigate('/catalog')}
        >
          Katalog
        </span>
        {isAuthenticated && (
          <span
            className={`${styles.navLink} ${isActive('/orders') ? styles.activeLink : ''}`}
            onClick={() => navigate('/orders')}
          >
            Pesanan Saya
          </span>
        )}
      </nav>
      <div className={styles.userSection}>
        {isAuthenticated && user ? (
          <>
            <div className={styles.userInfo}>
              <img src={user.avatar || 'https://i.pravatar.cc/150'} alt="User" className={styles.avatar} />
              <span>{user.name}</span>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout}>Keluar</button>
          </>
        ) : (
          <button className={styles.logoutBtn} onClick={() => navigate('/login')}>Masuk</button>
        )}
      </div>
    </header>
  );
}
