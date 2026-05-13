import { Box, Camera, MessageCircle, Globe } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerBrand}>
          <div className={styles.footerLogo}>
            <Box size={24} className={styles.logoIcon} />
            <span>DIVEXPLORE-3D</span>
          </div>
          <p>Platform Wisata Bahari 3D #1 di Indonesia. Jelajahi keindahan bawah laut Nusantara dari genggaman Anda.</p>
        </div>
        
        <div className={styles.footerLinkGroups}>
          <div className={styles.linkGroup}>
            <h4>DESTINASI</h4>
            <ul>
              <li><a href="/">Gili Trawangan</a></li>
              <li><a href="/">Gili Meno</a></li>
              <li><a href="/">Gili Air</a></li>
            </ul>
          </div>
          
          <div className={styles.linkGroup}>
            <h4>LAYANAN</h4>
            <ul>
              <li><a href="/catalog">Katalog Wisata</a></li>
              <li><a href="/">Paket Tambahan / Addons</a></li>
            </ul>
          </div>

          <div className={styles.linkGroup}>
            <h4>BANTUAN</h4>
            <ul>
              <li><a href="/">FAQ</a></li>
              <li><a href="/">Syarat & Ketentuan</a></li>
              <li><a href="/">Kebijakan Privasi</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className={styles.footerBottom}>
        <div className={styles.copyright}>
          © 2026 DIVEXPLORE-3D. All rights reserved.
        </div>
        <div className={styles.socials}>
          <a href="#" className={styles.socialLink}><Camera size={20} /></a>
          <a href="#" className={styles.socialLink}><MessageCircle size={20} /></a>
          <a href="#" className={styles.socialLink}><Globe size={20} /></a>
        </div>
      </div>
    </footer>
  );
}
