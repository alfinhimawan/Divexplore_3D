import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import { Box, Calendar, Users, Star, CheckCircle2 } from 'lucide-react';
import styles from './ReviewPage.module.css';

export default function ReviewPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  
  const [overallRating, setOverallRating] = useState(4);
  const [hoverOverall, setHoverOverall] = useState(0);
  
  const [subRatings, setSubRatings] = useState({
    kualitas: 5,
    pelayanan: 4,
    harga: 3
  });

  const [reviewText, setReviewText] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    setIsSubmitted(true);
    setTimeout(() => {
      navigate('/orders');
    }, 3000);
  };

  const renderStars = (rating: number, onRate?: (val: number) => void, onHover?: (val: number) => void, hoverVal?: number, size = 20) => {
    return (
      <div className={styles.starRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${styles.star} ${(hoverVal || rating) >= star ? styles.starFilled : ''} ${onRate ? styles.starInteractive : ''}`}
            onClick={() => onRate && onRate(star)}
            onMouseEnter={() => onHover && onHover(star)}
            onMouseLeave={() => onHover && onHover(0)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {isSubmitted && (
        <div className={styles.toast}>
          <CheckCircle2 size={24} color="#10b981" />
          <div>
            <h4>Ulasan terkirim!</h4>
            <p>+50 Poin Loyalitas diperoleh</p>
          </div>
        </div>
      )}

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
          <span>Beranda</span> / <span onClick={() => navigate('/orders')} style={{cursor: 'pointer'}}>Riwayat Pesanan</span> / <span className={styles.bcActive}>Tulis Ulasan</span>
        </div>
        
        <h1 className={styles.pageTitle}>Bagikan Pengalaman Anda</h1>

        <div className={styles.reviewCard}>
          <div className={styles.productInfo}>
            <div className={styles.quoteIcon}>"</div>
            <div>
              <h3 className={styles.productName}>Gili Trawangan Dive Experience</h3>
              <div className={styles.productMeta}>
                <span className={styles.metaItem}><Calendar size={14} /> 12 Okt 2024</span>
                <span className={styles.metaItem}><Users size={14} /> 2 orang</span>
              </div>
            </div>
          </div>

          <div className={styles.overallRatingSection}>
            <p className={styles.sectionLabel}>Beri Penilaian Keseluruhan</p>
            {renderStars(overallRating, setOverallRating, setHoverOverall, hoverOverall, 40)}
          </div>

          <div className={styles.subRatingsContainer}>
            <div className={styles.subRatingRow}>
              <span>Kualitas Aktivitas</span>
              {renderStars(subRatings.kualitas, (val) => setSubRatings({...subRatings, kualitas: val}))}
            </div>
            <div className={styles.subRatingRow}>
              <span>Pelayanan Vendor</span>
              {renderStars(subRatings.pelayanan, (val) => setSubRatings({...subRatings, pelayanan: val}))}
            </div>
            <div className={styles.subRatingRow}>
              <span>Nilai Harga</span>
              {renderStars(subRatings.harga, (val) => setSubRatings({...subRatings, harga: val}))}
            </div>
          </div>

          <div className={styles.feedbackSection}>
            <p className={styles.sectionLabel}>Ceritakan pengalaman Anda...</p>
            <div className={styles.textareaWrapper}>
              <textarea
                className={styles.textarea}
                placeholder="Bagaimana pengalaman menyelam Anda? Apa hal favorit Anda?"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={500}
              />
              <div className={styles.charCount}>
                <span>Min. 50 karakter</span>
                <span>{reviewText.length}/500</span>
              </div>
            </div>
          </div>

          <div className={styles.checkboxWrapper}>
            <input 
              type="checkbox" 
              id="isPublic" 
              className={styles.checkbox} 
              checked={isPublic} 
              onChange={(e) => setIsPublic(e.target.checked)} 
            />
            <label htmlFor="isPublic" className={styles.checkboxLabel}>Izinkan ulasan ditampilkan publik</label>
          </div>

          <div className={styles.actions}>
            <button 
              className={styles.submitBtn} 
              onClick={handleSubmit}
              disabled={isSubmitted || reviewText.length < 50}
            >
              {isSubmitted ? 'Mengirim...' : 'Kirim Ulasan'}
            </button>
            <button className={styles.skipBtn} onClick={() => navigate('/orders')}>Lewati</button>
          </div>
        </div>
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
