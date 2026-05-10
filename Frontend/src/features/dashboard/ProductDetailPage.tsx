import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import { 
  Box, 
  Clock, 
  Users, 
  Award, 
  MapPin, 
  Star, 
  Calendar, 
  ShoppingCart, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  FileText,
  Minus,
  Plus
} from 'lucide-react';
import styles from './ProductDetailPage.module.css';

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [quantity, setQuantity] = useState(2);
  const [addons, setAddons] = useState({
    makanSiang: true,
    sewaAlat: true,
    antarJemput: false
  });
  const [activeTab, setActiveTab] = useState('deskripsi');

  // Pricing logic
  const basePrice = 350000;
  const makanSiangPrice = 75000;
  const sewaAlatPrice = 100000;
  const antarJemputPrice = 50000;

  const calculateTotal = () => {
    let perPerson = basePrice;
    if (addons.makanSiang) perPerson += makanSiangPrice;
    if (addons.sewaAlat) perPerson += sewaAlatPrice;
    if (addons.antarJemput) perPerson += antarJemputPrice;
    return perPerson * quantity;
  };

  const handleBook = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate('/cart');
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
          <Box className={styles.logoIcon} size={24} />
          <span>DIVEXPLORE-3D</span>
        </div>
        <nav className={styles.navLinks}>
          <span className={styles.navLink} onClick={() => navigate('/')}>Destinasi</span>
          <span className={styles.navLink} onClick={() => navigate('/catalog')} style={{color: 'white', fontWeight: 600}}>Katalog</span>
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

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <span>Beranda</span>
        <span>&gt;</span>
        <span>Katalog</span>
        <span>&gt;</span>
        <span>Snorkeling</span>
        <span>&gt;</span>
        <span className={styles.active}>Bunaken</span>
      </div>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Left Column: Gallery & Info */}
        <div className={styles.leftColumn}>
          <div className={styles.gallery}>
            <div className={styles.mainImageContainer}>
              <img 
                src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
                alt="Snorkeling Gili Premium" 
                className={styles.mainImage}
              />
              <div className={styles.tagsOverlay}>
                <span className={styles.tagBlue}>SNORKELING</span>
                <span className={styles.tagOrange}>PREMIUM</span>
              </div>
              <button className={styles.view360Btn}>
                <Box size={16} />
                Lihat 360°
              </button>
            </div>
            
            <div className={styles.thumbnails}>
              <img src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=80" className={`${styles.thumbnail} ${styles.active}`} alt="Thumb 1" />
              <img src="https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=200&q=80" className={styles.thumbnail} alt="Thumb 2" />
              <img src="https://images.unsplash.com/photo-1544552866-d3ed42536fc6?w=200&q=80" className={styles.thumbnail} alt="Thumb 3" />
              <img src="https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=200&q=80" className={styles.thumbnail} alt="Thumb 4" />
            </div>
          </div>

          <div className={styles.infoCards}>
            <div className={styles.infoCard}>
              <Clock className={styles.infoIcon} size={24} />
              <span className={styles.infoValue}>3-4 Jam</span>
              <span className={styles.infoLabel}>Durasi</span>
            </div>
            <div className={styles.infoCard}>
              <Users className={styles.infoIcon} size={24} />
              <span className={styles.infoValue}>Max 12 Orang</span>
              <span className={styles.infoLabel}>Kapasitas</span>
            </div>
            <div className={styles.infoCard}>
              <Award className={styles.infoIcon} size={24} />
              <span className={styles.infoValue}>Pemula OK</span>
              <span className={styles.infoLabel}>Level</span>
            </div>
            <div className={styles.infoCard}>
              <MapPin className={styles.infoIcon} size={24} />
              <span className={styles.infoValue}>Bunaken</span>
              <span className={styles.infoLabel}>Sulawesi Utara</span>
            </div>
          </div>
        </div>

        {/* Right Column: Booking Card */}
        <div className={styles.rightColumn}>
          <div className={styles.bookingCard}>
            <div className={styles.bookingHeader}>
              <span className={styles.tagBlue}>SNORKELING</span>
              <span style={{fontSize: '13px', color: '#94a3b8'}}>Lombok</span>
            </div>
            
            <h1 className={styles.productTitle}>Snorkeling Gili Premium</h1>
            
            <div className={styles.ratingRow}>
              <div className={styles.stars}>
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
              </div>
              <span className={styles.ratingText}>4.9</span>
              <span className={styles.reviewCount}>(124 ulasan)</span>
              <a href="#" className={styles.reviewLink}>Lihat ulasan</a>
            </div>

            <div className={styles.priceDisplay}>
              <div className={styles.currentPrice}>
                Rp 350.000 <span>/orang</span>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Pilih Tanggal:</label>
              <div className={styles.dateInputWrapper}>
                <Calendar size={16} className={styles.calendarIcon} />
                <input type="text" placeholder="Pilih tanggal kunjungan..." className={styles.dateInput} readOnly value="14 Juni 2026" />
                <span className={styles.quotaBadge}>✔ Kuota tersisa: 12</span>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Jumlah:</label>
              <div className={styles.qtySelector}>
                <button className={styles.qtyBtn} onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus size={16} />
                </button>
                <span className={styles.qtyValue}>{quantity}</span>
                <button className={styles.qtyBtn} onClick={() => setQuantity(quantity + 1)}>
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Tambahan Opsional:</label>
              <div className={styles.addons}>
                <div className={styles.addonItem}>
                  <div className={styles.addonLeft}>
                    <input type="checkbox" className={styles.checkbox} checked={addons.makanSiang} onChange={() => setAddons({...addons, makanSiang: !addons.makanSiang})} />
                    <span className={styles.addonName}>🍽 Makan Siang</span>
                  </div>
                  <span className={styles.addonPrice}>+Rp 75.000</span>
                </div>
                <div className={styles.addonItem}>
                  <div className={styles.addonLeft}>
                    <input type="checkbox" className={styles.checkbox} checked={addons.sewaAlat} onChange={() => setAddons({...addons, sewaAlat: !addons.sewaAlat})} />
                    <span className={styles.addonName}>🤿 Sewa Alat Selam</span>
                  </div>
                  <span className={styles.addonPrice}>+Rp 100.000</span>
                </div>
                <div className={styles.addonItem}>
                  <div className={styles.addonLeft}>
                    <input type="checkbox" className={styles.checkbox} checked={addons.antarJemput} onChange={() => setAddons({...addons, antarJemput: !addons.antarJemput})} />
                    <span className={styles.addonName}>🚐 Antar-Jemput</span>
                  </div>
                  <span className={styles.addonPrice}>+Rp 50.000</span>
                </div>
              </div>
            </div>

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total:</span>
              <div className={styles.totalPriceWrapper}>
                <span className={styles.oldPrice}>Rp 975.000</span>
                <span className={styles.finalPrice}>Rp {calculateTotal().toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button className={styles.btnPrimary} onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login');
                } else {
                  navigate('/cart');
                }
              }}>
                <ShoppingCart size={18} />
                {isAuthenticated ? 'Tambah ke Keranjang' : '🔒 Masuk untuk Memesan'}
              </button>
              <button className={styles.btnSuccess} onClick={handleBook}>
                <Zap size={18} />
                Beli Sekarang
              </button>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.footerFeature}>
                <ShieldCheck size={14} color="#ef4444" />
                Pembayaran Aman
              </div>
              <div className={styles.footerFeature}>
                <Clock size={14} />
                Refund 24 Jam
              </div>
              <div className={styles.footerFeature}>
                <Star size={14} color="#f59e0b" />
                Vendor Terverifikasi
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Tabs Section (Deskripsi, dll) */}
      <section className={styles.tabsSection}>
        <div className={styles.tabsHeader}>
          <button className={`${styles.tabBtn} ${activeTab === 'deskripsi' ? styles.active : ''}`} onClick={() => setActiveTab('deskripsi')}>
            <FileText size={16} /> Deskripsi
          </button>
          <button className={`${styles.tabBtn} ${activeTab === 'lokasi' ? styles.active : ''}`} onClick={() => setActiveTab('lokasi')}>
            <MapPin size={16} /> Lokasi & Peta
          </button>
          <button className={`${styles.tabBtn} ${activeTab === 'ulasan' ? styles.active : ''}`} onClick={() => setActiveTab('ulasan')}>
            <Star size={16} /> Ulasan
          </button>
        </div>

        <div className={styles.tabContent}>
          <div className={styles.descriptionCol}>
            <h2 className={styles.sectionTitle}>Tentang Paket Snorkeling Gili Premium</h2>
            <p className={styles.descText}>
              Nikmati petualangan bawah laut yang tak terlupakan di Taman Nasional Bunaken, salah satu surga snorkeling terbaik di dunia. Dengan kejernihan air yang luar biasa dan keanekaragaman hayati laut yang kaya, Bunaken menawarkan pengalaman yang sempurna bagi para pecinta alam bawah laut, baik pemula maupun yang sudah berpengalaman.
            </p>
            <p className={styles.descText}>
              Paket Premium kami dirancang untuk memberikan pengalaman snorkeling terbaik dengan panduan profesional bersertifikat, peralatan berkualitas tinggi, dan akses ke lokasi-lokasi terbaik di sekitar pulau Bunaken. Anda akan menjelajahi terumbu karang yang berwarna-warni, bertemu dengan berbagai spesies ikan tropis, dan menyaksikan keindahan bawah laut yang memukau.
            </p>
            <p className={styles.descText}>
              Setiap sesi snorkeling dipimpin oleh pemandu lokal berpengalaman yang fasih dalam bahasa Indonesia dan Inggris. Keselamatan dan kenyamanan Anda adalah prioritas utama kami — semua peralatan keselamatan disediakan dan briefing keselamatan dilakukan sebelum penyelaman dimulai.
            </p>

            <div className={styles.whatsIncluded}>
              <div className={styles.includedTitle}>
                <CheckCircle2 size={20} color="#10b981" />
                Apa yang Termasuk
              </div>
              <div className={styles.includedList}>
                <div className={styles.includedItem}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Panduan snorkeling profesional bersertifikat</span>
                </div>
                <div className={styles.includedItem}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Peralatan snorkeling lengkap (masker, snorkel, fins, wetsuit)</span>
                </div>
                <div className={styles.includedItem}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Transportasi kapal speedboat ke 3 titik snorkeling</span>
                </div>
                <div className={styles.includedItem}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Air mineral dan snack ringan selama aktivitas</span>
                </div>
                <div className={styles.includedItem}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Foto dan video bawah laut gratis (15 foto terbaik)</span>
                </div>
                <div className={styles.includedItem}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Asuransi kecelakaan selama aktivitas berlangsung</span>
                </div>
                <div className={styles.includedItem}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>E-sertifikat peserta snorkeling Bunaken</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.reviewsCol}>
            <div className={styles.reviewsHeader}>
              <h2 className={styles.sectionTitle}>
                <Star size={20} color="#f59e0b" style={{display: 'inline', marginRight: '8px'}} />
                Ulasan Terbaru
              </h2>
              <a href="#" className={styles.viewAllLink}>Lihat semua →</a>
            </div>

            <div className={styles.reviewCard}>
              <div className={styles.reviewerInfo}>
                <div className={styles.reviewerProfile}>
                  <img src="https://i.pravatar.cc/150?img=32" alt="Sari Dewi" className={styles.reviewerAvatar} />
                  <div>
                    <div className={styles.reviewerName}>Sari Dewi</div>
                    <div className={styles.stars}>
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                    </div>
                  </div>
                </div>
                <span className={styles.reviewDate}>14 Jun 2025</span>
              </div>
              <p className={styles.reviewText}>
                Pengalaman luar biasa! Air sangat jernih dan terumbu karangnya sangat indah. Pemandunya sangat profesional dan sabar. Pasti akan balik lagi!
              </p>
              <div className={styles.reviewTags}>
                <span className={styles.reviewTag}>Snorkeling</span>
                <span className={styles.reviewTag}>Premium</span>
              </div>
            </div>

            <div className={styles.reviewCard}>
              <div className={styles.reviewerInfo}>
                <div className={styles.reviewerProfile}>
                  <img src="https://i.pravatar.cc/150?img=12" alt="Budi Santoso" className={styles.reviewerAvatar} />
                  <div>
                    <div className={styles.reviewerName}>Budi Santoso</div>
                    <div className={styles.stars}>
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                    </div>
                  </div>
                </div>
                <span className={styles.reviewDate}>2 Jun 2025</span>
              </div>
              <p className={styles.reviewText}>
                Pertama kali snorkeling dan benar-benar terpukau. Tim sangat membantu dan memberikan rasa aman. Foto bawah air yang diberikan juga kualitasnya bagus sekali.
              </p>
              <div className={styles.reviewTags}>
                <span className={styles.reviewTag}>Pemula</span>
                <span className={styles.reviewTag}>Foto Gratis</span>
              </div>
            </div>

            <div className={styles.reviewCard}>
              <div className={styles.reviewerInfo}>
                <div className={styles.reviewerProfile}>
                  <img src="https://i.pravatar.cc/150?img=47" alt="Maya Rizka" className={styles.reviewerAvatar} />
                  <div>
                    <div className={styles.reviewerName}>Maya Rizka</div>
                    <div className={styles.stars}>
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                    </div>
                  </div>
                </div>
                <span className={styles.reviewDate}>28 Mei 2025</span>
              </div>
              <p className={styles.reviewText}>
                Worth every penny! Bunaken memang surga snorkeling sesungguhnya. Kami ketemu penyu laut dan ribuan ikan warna-warni. Pelayanan sangat memuaskan dari awal hingga akhir.
              </p>
              <div className={styles.reviewTags}>
                <span className={styles.reviewTag}>Keluarga</span>
                <span className={styles.reviewTag}>Rekomendasi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products UMKM */}
      <section className={styles.relatedSection}>
        <div className={styles.relatedHeader}>
          <h2 className={styles.sectionTitle}>
            <ShoppingCart size={20} style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}} />
            Produk UMKM & Hotel Terkait
          </h2>
          <a href="#" className={styles.viewAllLink}>Lihat Semua →</a>
        </div>
        
        <div className={styles.relatedGrid}>
          {/* Item 1 */}
          <div className={styles.relatedCard}>
            <div className={styles.relatedImageContainer}>
              <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80" alt="Kuliner" className={styles.relatedImage} />
              <span className={styles.relatedTag}>KULINER</span>
            </div>
            <div className={styles.relatedInfo}>
              <h3 className={styles.relatedTitle}>Warung Pesisir Bu Bagong</h3>
              <div className={styles.relatedLocation}>
                <MapPin size={10} /> Pantai Gili Trawangan, Lombok
              </div>
              <div className={styles.relatedFooter}>
                <div className={styles.relatedPrice}>Rp 65.000<span>/porsi</span></div>
                <button className={styles.addBtn} onClick={() => { if (!isAuthenticated) { navigate('/login'); } }}>{ isAuthenticated ? 'Tambah' : '🔒 Masuk'}</button>
              </div>
            </div>
          </div>

          {/* Item 2 */}
          <div className={styles.relatedCard}>
            <div className={styles.relatedImageContainer}>
              <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80" alt="Hotel" className={styles.relatedImage} />
              <span className={`${styles.relatedTag} ${styles.relatedTagBlue}`}>HOTEL</span>
            </div>
            <div className={styles.relatedInfo}>
              <h3 className={styles.relatedTitle}>Gili Sea Garden Resort ★★★</h3>
              <div className={styles.relatedLocation}>
                <MapPin size={10} /> Gili Trawangan, Lombok
              </div>
              <div className={styles.relatedFooter}>
                <div className={styles.relatedPrice}>Rp 450.000<span>/malam</span></div>
                <button className={styles.addBtn} onClick={() => { if (!isAuthenticated) { navigate('/login'); } }}>{ isAuthenticated ? 'Tambah' : '🔒 Masuk'}</button>
              </div>
            </div>
          </div>

          {/* Item 3 */}
          <div className={styles.relatedCard}>
            <div className={styles.relatedImageContainer}>
              <img src="https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&q=80" alt="UMKM" className={styles.relatedImage} />
              <span className={styles.relatedTag}>UMKM</span>
            </div>
            <div className={styles.relatedInfo}>
              <h3 className={styles.relatedTitle}>Kerajinan Laut Mama Vivi</h3>
              <div className={styles.relatedLocation}>
                <MapPin size={10} /> Gili Trawangan, Lombok
              </div>
              <div className={styles.relatedFooter}>
                <div className={styles.relatedPrice}>Rp 35.000<span>/pcs</span></div>
                <button className={styles.addBtn} onClick={() => { if (!isAuthenticated) { navigate('/login'); } }}>{ isAuthenticated ? 'Tambah' : '🔒 Masuk'}</button>
              </div>
            </div>
          </div>

          {/* Item 4 */}
          <div className={styles.relatedCard}>
            <div className={styles.relatedImageContainer}>
              <img src="https://images.unsplash.com/photo-1520116468816-95b69f847357?w=400&q=80" alt="Tur Bahari" className={styles.relatedImage} />
              <span className={`${styles.relatedTag} ${styles.relatedTagGreen}`}>TUR BAHARI</span>
            </div>
            <div className={styles.relatedInfo}>
              <h3 className={styles.relatedTitle}>Tur Nelayan Tradisional Gili</h3>
              <div className={styles.relatedLocation}>
                <MapPin size={10} /> Gili, Lombok
              </div>
              <div className={styles.relatedFooter}>
                <div className={styles.relatedPrice}>Rp 120.000<span>/orang</span></div>
                <button className={styles.addBtn} onClick={() => { if (!isAuthenticated) { navigate('/login'); } }}>{ isAuthenticated ? 'Tambah' : '🔒 Masuk'}</button>
              </div>
            </div>
          </div>

          {/* Item 5 */}
          <div className={styles.relatedCard}>
            <div className={styles.relatedImageContainer}>
              <img src="https://images.unsplash.com/photo-1516655855035-d5215bcb5604?w=400&q=80" alt="Sewa Kamera" className={styles.relatedImage} />
              <span className={styles.relatedTag}>UMKM</span>
            </div>
            <div className={styles.relatedInfo}>
              <h3 className={styles.relatedTitle}>Sewa Kamera Bawah Air GoPro</h3>
              <div className={styles.relatedLocation}>
                <MapPin size={10} /> Gili Trawangan, Lombok
              </div>
              <div className={styles.relatedFooter}>
                <div className={styles.relatedPrice}>Rp 80.000<span>/hari</span></div>
                <button className={styles.addBtn} onClick={() => { if (!isAuthenticated) { navigate('/login'); } }}>{ isAuthenticated ? 'Tambah' : '🔒 Masuk'}</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.globalFooter}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <Box className={styles.logoIcon} size={24} />
              <span>DIVEXPLORE-3D</span>
            </div>
            <p className={styles.footerDesc}>
              Platform Wisata Bahari 3D #1 Indonesia. Jelajahi keindahan bawah laut dari layar Anda.
            </p>
            <div className={styles.socialLinks}>
              <div className={styles.socialBtn}>IG</div>
              <div className={styles.socialBtn}>TW</div>
              <div className={styles.socialBtn}>FB</div>
            </div>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkGroupTitle}>DESTINASI</h4>
              <a href="#" className={styles.footerLinkItem}>Raja Ampat</a>
              <a href="#" className={styles.footerLinkItem}>Bunaken</a>
              <a href="#" className={styles.footerLinkItem}>Lombok</a>
              <a href="#" className={styles.footerLinkItem}>Wakatobi</a>
            </div>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkGroupTitle}>TENTANG</h4>
              <a href="#" className={styles.footerLinkItem}>Manifesto</a>
              <a href="#" className={styles.footerLinkItem}>Tim Kami</a>
              <a href="#" className={styles.footerLinkItem}>Karir</a>
              <a href="#" className={styles.footerLinkItem}>Blog</a>
            </div>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkGroupTitle}>BANTUAN</h4>
              <a href="#" className={styles.footerLinkItem}>Pusat Bantuan</a>
              <a href="#" className={styles.footerLinkItem}>Kebijakan Privasi</a>
              <a href="#" className={styles.footerLinkItem}>Syarat & Ketentuan</a>
              <a href="#" className={styles.footerLinkItem}>Kontak Kami</a>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div>© 2026 DIVEXPLORE-3D. All rights reserved.</div>
          <div className={styles.bottomIcons}>
            <Box size={16} />
            <span>IG</span>
            <span>TW</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
