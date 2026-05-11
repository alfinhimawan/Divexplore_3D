import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import { Box } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const isActive = (path: string) => {
    // Exact match for home, partial for others
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
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
        <span 
          className={styles.navLink}
        >
          Tentang
        </span>
      </nav>
      <div className={styles.userSection}>
        {isAuthenticated && user ? (
          <>
            <div className={styles.userInfo}>
              <img src={user.avatar || 'https://i.pravatar.cc/150'} alt="User" className={styles.avatar} />
              <span>{user.name}</span>
            </div>
            <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/'); }}>Keluar</button>
          </>
        ) : (
          <button className={styles.logoutBtn} onClick={() => navigate('/login')}>Masuk</button>
        )}
      </div>
    </header>
  );
}
