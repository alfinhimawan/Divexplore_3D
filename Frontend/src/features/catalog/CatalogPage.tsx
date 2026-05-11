import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import {
  Box,
  ShoppingCart,
  MapPin,
  Star,
  Filter,
  Search,
  Waves,
  Camera,
  Home,
  Utensils,
  Package,
  ChevronRight,
  ShieldCheck,
  Clock,
  Tag
} from 'lucide-react';
import styles from './CatalogPage.module.css';
import Header from '../../components/common/Header';

// ── DATA CATALOG ──────────────────────────────────────────────
const CATALOG_DATA = {
  aktivitas: {
    label: 'Aktivitas Bahari',
    color: '#0ea5e9',
    colorBg: 'rgba(14,165,233,0.12)',
    items: [
      { id: 'ak1', name: 'Island Hopping (Sharing)', desc: 'Keliling 3 Gili – Glass Bottom Boat', hargaJual: 150000, unit: '/pax', image: '/images/island_hopping_1778505755023.png' },
      { id: 'ak2', name: 'Island Hopping (Private)', desc: 'Keliling 3 Gili – Kapal Pribadi', hargaJual: 1200000, unit: '/kapal', image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=400&q=80' },
      { id: 'ak3', name: 'Diving (DSD 1 Log)', desc: 'Discovery Scuba Dive untuk pemula', hargaJual: 900000, unit: '/pax', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80' },
      { id: 'ak4', name: 'Diving (Fun Dive 2 Log)', desc: 'Penyelaman berlisensi PADI/SSI', hargaJual: 1500000, unit: '/pax', image: 'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=400&q=80' },
      { id: 'ak5', name: 'Jetski', desc: 'Motorized sport (15 menit)', hargaJual: 250000, unit: '/pax', image: 'https://images.unsplash.com/photo-1530053969600-caed2596d242?w=400&q=80' },
      { id: 'ak6', name: 'Banana Boat', desc: 'Kapasitas 5 orang (15 menit)', hargaJual: 75000, unit: '/pax', image: 'https://images.unsplash.com/photo-1518467166778-b88f373ffec7?w=400&q=80' },
      { id: 'ak7', name: 'Stand-up Paddle', desc: 'Non-motorized watersport', hargaJual: 100000, unit: '/jam', image: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=400&q=80' },
      { id: 'ak8', name: 'Kayak Transparan', desc: 'Eksplorasi pesisir dangkal', hargaJual: 150000, unit: '/jam', image: '/images/kayak_transparan_1778505772045.png' },
    ]
  },
  peralatan: {
    label: 'Peralatan & Perlengkapan',
    color: '#8b5cf6',
    colorBg: 'rgba(139,92,246,0.12)',
    items: [
      { id: 'pe1', name: 'Set Snorkel Premium', desc: 'Masker + snorkel anti-fog berkualitas', hargaJual: 75000, unit: '/hari', image: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=400&q=80' },
      { id: 'pe2', name: 'Kamera Aksi (GoPro)', desc: 'Hero series lengkap dengan housing', hargaJual: 200000, unit: '/hari', image: 'https://images.unsplash.com/photo-1516655855035-d5215bcb5604?w=400&q=80' },
      { id: 'pe3', name: 'Rash Guard / Wetsuit', desc: 'Pelindung kulit anti-UV dan ubur-ubur', hargaJual: 50000, unit: '/hari', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80' },
      { id: 'pe4', name: 'Dry Bag (10L)', desc: 'Pelindung barang anti-air 10 liter', hargaJual: 85000, unit: '', image: 'https://images.unsplash.com/photo-1520116468816-95b69f847357?w=400&q=80' },
      { id: 'pe5', name: 'Sunblock Terumbu Karang', desc: 'Reef-safe SPF 50+ ramah lingkungan', hargaJual: 120000, unit: '', image: 'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=400&q=80' },
    ]
  },
  akomodasi: {
    label: 'Akomodasi Homestay Kaluk',
    color: '#f59e0b',
    colorBg: 'rgba(245,158,11,0.12)',
    items: [
      { id: 'ak1', name: 'Standard Garden View', desc: 'Kamar nyaman dengan pemandangan taman', hargaJual: 400000, unit: '/malam', image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80', kapasitas: '2 Orang' },
      { id: 'ak2', name: 'Deluxe Ocean View', desc: 'Kamar premium dengan view pantai langsung', hargaJual: 850000, unit: '/malam', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80', kapasitas: '2 Orang' },
      { id: 'ak3', name: 'Private Family Bungalow', desc: 'Bungalow eksklusif untuk keluarga besar', hargaJual: 2000000, unit: '/malam', image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80', kapasitas: '4 Orang' },
      { id: 'ak4', name: 'Paket Spa / Sauna', desc: 'Relaksasi total dengan terapi air laut', hargaJual: 250000, unit: '/sesi', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80', kapasitas: '1 Orang' },
    ]
  },
  kuliner: {
    label: 'Kuliner & Oleh-Oleh',
    color: '#ef4444',
    colorBg: 'rgba(239,68,68,0.12)',
    items: [
      // Seafood Pak Sukardi
      { id: 'ku1', name: 'Paket Seafood Platter', desc: 'Seafood Pak Sukardi • Aneka hidangan laut segar', hargaJual: 250000, unit: '/porsi', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80' },
      { id: 'ku2', name: 'Kepiting Saus Padang', desc: 'Seafood Pak Sukardi • Kepiting segar bumbu Padang', hargaJual: 150000, unit: '/porsi', image: '/images/kepiting_saus_padang_1778505687377.png' },
      { id: 'ku3', name: 'Cumi Bakar Madu Pedas', desc: 'Seafood Pak Sukardi • Cumi segar bakar madu', hargaJual: 75000, unit: '/porsi', image: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=400&q=80' },
      { id: 'ku4', name: 'Udang Dakar Jimbaran', desc: 'Seafood Pak Sukardi • Udang segar ala Jimbaran', hargaJual: 85000, unit: '/porsi', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80' },
      { id: 'ku5', name: 'Plecing Kangkung Seafood', desc: 'Seafood Pak Sukardi • Sayur segar bumbu Lombok', hargaJual: 25000, unit: '/porsi', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80' },
      { id: 'ku6', name: 'Es Kuwut Lombok', desc: 'Seafood Pak Sukardi • Minuman segar khas Lombok', hargaJual: 25000, unit: '/gelas', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80' },
      // Warung Ibu Morwah
      { id: 'ku7', name: 'Ikan Kerapu Dumbu Taiwong', desc: 'Warung Ibu Morwah • Ikan kerapu bumbu khas', hargaJual: 90000, unit: '/porsi', image: 'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=400&q=80' },
      { id: 'ku8', name: 'Ikan Kakap Dakar Kecap', desc: 'Warung Ibu Morwah • Ikan kakap bakar kecap manis', hargaJual: 85000, unit: '/porsi', image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80' },
      { id: 'ku9', name: 'Sate Pusut Ikan Marin', desc: 'Warung Ibu Morwah • Sate ikan khas Lombok', hargaJual: 40000, unit: '/porsi', image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&q=80' },
      { id: 'ku10', name: 'Ikan Baronang Rica-Rica', desc: 'Warung Ibu Morwah • Pedas gurih khas Manado', hargaJual: 80000, unit: '/porsi', image: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=400&q=80' },
      { id: 'ku11', name: 'Sop Ikan Kua Asam', desc: 'Warung Ibu Morwah • Segar dan hangat', hargaJual: 60000, unit: '/mangkuk', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80' },
      { id: 'ku12', name: 'Es Kelapa Muda Jeruk Nipis', desc: 'Warung Ibu Morwah • Minuman kelapa muda segar', hargaJual: 20000, unit: '/gelas', image: '/images/es_kelapa_muda_1778505704145.png' },
      // Oleh-oleh DIVEXPLORE
      { id: 'ku13', name: 'Hampers Daun (Bundling)', desc: 'Oleh DIVEXPLORE • Paket souvenir eksklusif', hargaJual: 200000, unit: '/set', image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&q=80' },
      { id: 'ku14', name: 'Keripik Tempong Limo', desc: 'Oleh DIVEXPLORE • Keripik pedas khas Lombok', hargaJual: 75000, unit: '/250g', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80' },
      { id: 'ku15', name: 'Cumi Asin Kering', desc: 'Oleh DIVEXPLORE • Cumi asin premium', hargaJual: 60000, unit: '/100g', image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&q=80' },
      { id: 'ku16', name: 'Ikan Asin Tongkol Dauk', desc: 'Oleh DIVEXPLORE • Ikan asin kering pilihan', hargaJual: 60000, unit: '/150g', image: '/images/ikan_asin_1778505720009.png' },
      { id: 'ku17', name: 'Abon Ikan Tuna', desc: 'Oleh DIVEXPLORE • Abon tuna lezat', hargaJual: 45000, unit: '/100g', image: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400&q=80' },
      { id: 'ku18', name: 'Dodol Rumput Laut', desc: 'Oleh DIVEXPLORE • Dodol manis khas pesisir', hargaJual: 40000, unit: '/250g', image: 'https://images.unsplash.com/photo-1607478900766-efe13248b125?w=400&q=80' },
      { id: 'ku19', name: 'Sambal Roa Pesisir', desc: 'Oleh DIVEXPLORE • Sambal ikan roa khas', hargaJual: 35000, unit: '/botol', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80' },
      { id: 'ku20', name: 'Kerupuk Kulit Ikan / Kopi', desc: 'Oleh DIVEXPLORE • Kerupuk renyah khas', hargaJual: 30000, unit: '/100g', image: '/images/kerupuk_kulit_1778505735892.png' },
      { id: 'ku21', name: 'Tori Crispy Daindo', desc: 'Oleh DIVEXPLORE • Camilan krispy favorit', hargaJual: 25000, unit: '/pcs', image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&q=80' },
    ]
  },
  fotografi: {
    label: 'Fotografi & Dokumentasi',
    color: '#10b981',
    colorBg: 'rgba(16,185,129,0.12)',
    items: [
      { id: 'fo1', name: 'Fotografer Darat / Pantai', desc: 'Sesi foto profesional di pantai & darat', hargaJual: 300000, unit: '/jam', image: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=400&q=80' },
      { id: 'fo2', name: 'Pendampingan Foto Bawah Air', desc: 'Fotografer profesional dalam air berlisensi', hargaJual: 500000, unit: '/jam', image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80' },
      { id: 'fo3', name: 'Dokumentasi Udara (Drone)', desc: 'Video & foto aerial resolusi 4K', hargaJual: 600000, unit: '/jam', image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&q=80' },
    ]
  }
};

type CategoryKey = keyof typeof CATALOG_DATA;

const CATEGORY_ICONS: Record<CategoryKey, React.ReactNode> = {
  aktivitas: <Waves size={18} />,
  peralatan: <Package size={18} />,
  akomodasi: <Home size={18} />,
  kuliner: <Utensils size={18} />,
  fotografi: <Camera size={18} />,
};

function formatRupiah(num: number) {
  return 'Rp ' + num.toLocaleString('id-ID');
}

export default function CatalogPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('aktivitas');
  const [searchQuery, setSearchQuery] = useState('');

  const currentCat = CATALOG_DATA[activeCategory];
  const filtered = currentCat.items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <Header />

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Beranda</span>
        <ChevronRight size={14} />
        <span className={styles.active}>Katalog Vendor</span>
      </div>

      {/* Hero Banner */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Tag size={14} />
            Harga Resmi Vendor E-Commerce
          </div>
          <h1 className={styles.heroTitle}>Katalog Lengkap Divexplore</h1>
          <p className={styles.heroSubtitle}>
            Semua produk & layanan dari vendor terverifikasi — aktivitas bahari, akomodasi, kuliner, peralatan, hingga dokumentasi profesional.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}><span>5</span> Kategori Vendor</div>
            <div className={styles.statDivider} />
            <div className={styles.heroStat}><span>38+</span> Produk & Layanan</div>
            <div className={styles.statDivider} />
            <div className={styles.heroStat}><span>100%</span> Vendor Lokal</div>
          </div>
        </div>
        <div className={styles.heroImage}>
          <img
            src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80"
            alt="Underwater Diving"
          />
          <div className={styles.heroImageOverlay} />
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainWrapper}>
        {/* Sidebar — Category Filter */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>
            <Filter size={16} />
            Kategori
          </div>
          <div className={styles.categoryList}>
            {(Object.keys(CATALOG_DATA) as CategoryKey[]).map(key => {
              const cat = CATALOG_DATA[key];
              const isActive = activeCategory === key;
              return (
                <button
                  key={key}
                  className={`${styles.categoryBtn} ${isActive ? styles.categoryActive : ''}`}
                  style={isActive ? { borderColor: cat.color, background: cat.colorBg, color: cat.color } : {}}
                  onClick={() => { setActiveCategory(key); setSearchQuery(''); }}
                >
                  <span className={styles.catIcon} style={isActive ? { color: cat.color } : {}}>
                    {CATEGORY_ICONS[key]}
                  </span>
                  <span className={styles.catLabel}>{cat.label}</span>
                  <span className={styles.catCount}>{cat.items.length}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.sidebarInfo}>
            <ShieldCheck size={14} color="#0ea5e9" />
            <span>Semua vendor telah diverifikasi Divexplore</span>
          </div>
          <div className={styles.sidebarInfo}>
            <Clock size={14} color="#0ea5e9" />
            <span>Harga berlaku per Mei 2026</span>
          </div>
        </aside>

        {/* Product Grid */}
        <main className={styles.productArea}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <h2 className={styles.categoryHeading}>
                <span style={{ color: currentCat.color, display: 'inline-flex', alignItems: 'center', marginRight: '8px' }}>
                  {CATEGORY_ICONS[activeCategory]}
                </span>
                {currentCat.label}
              </h2>
              <span className={styles.resultCount}>{filtered.length} produk</span>
            </div>
            <div className={styles.searchBar}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder={`Cari di ${currentCat.label}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <Search size={40} color="#334155" />
              <p>Tidak ada produk yang cocok dengan pencarian Anda.</p>
            </div>
          ) : (
            <div className={styles.productGrid}>
              {filtered.map(item => (
                <div key={item.id} className={styles.productCard}>
                  <div 
                    className={styles.cardImageWrapper} 
                    onClick={() => navigate('/product')}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={item.image} alt={item.name} className={styles.cardImage} />
                    <div className={styles.cardBadge} style={{ background: currentCat.color, color: '#fff' }}>
                      {CATEGORY_ICONS[activeCategory]}
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <h3 
                      className={styles.cardName} 
                      onClick={() => navigate('/product')}
                      style={{ cursor: 'pointer' }}
                    >
                      {item.name}
                    </h3>
                    <p className={styles.cardDesc}>{item.desc}</p>
                    {'kapasitas' in item && (
                      <div className={styles.cardMeta}>
                        <MapPin size={12} /> {(item as any).kapasitas}
                      </div>
                    )}
                    <div className={styles.cardFooter}>
                      <div className={styles.cardPrice}>
                        <span className={styles.priceVal} style={{ color: currentCat.color }}>
                          {formatRupiah(item.hargaJual)}
                        </span>
                        {item.unit && <span className={styles.priceUnit}>{item.unit}</span>}
                      </div>
                      <div className={styles.cardStars}>
                        <Star size={11} fill="#f59e0b" color="#f59e0b" />
                        <Star size={11} fill="#f59e0b" color="#f59e0b" />
                        <Star size={11} fill="#f59e0b" color="#f59e0b" />
                        <Star size={11} fill="#f59e0b" color="#f59e0b" />
                        <Star size={11} fill="#f59e0b" color="#f59e0b" />
                      </div>
                    </div>
                    <button
                      className={styles.addToCartBtn}
                      style={{ background: currentCat.color }}
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login');
                        } else {
                          navigate('/cart');
                        }
                      }}
                    >
                      <ShoppingCart size={15} />
                      {isAuthenticated ? 'Tambah ke Keranjang' : '🔒 Masuk untuk Memesan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <Box size={20} className={styles.logoIcon} />
              <span>DIVEXPLORE-3D</span>
            </div>
            <p>Platform Wisata Bahari 3D #1 Indonesia.</p>
          </div>
          <div className={styles.footerNote}>
            © 2026 DIVEXPLORE-3D. Harga katalog dari vendor e-commerce Divisi E-Commerce.
          </div>
        </div>
      </footer>
    </div>
  );
}
