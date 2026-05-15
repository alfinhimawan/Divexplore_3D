import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { useAuth } from "../../app/providers/AuthContext";
import {
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
  ChevronLeft,
  ShieldCheck,
  Clock,
  Tag,
} from "lucide-react";
import styles from "./CatalogPage.module.css";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import Swal from 'sweetalert2';

// ── DATA CATALOG STRUCTURE ──────────────────────────────────────────────
type CatalogStructure = {
  [key: string]: {
    label: string;
    color: string;
    colorBg: string;
    items: any[];
  };
};

const DEFAULT_CATALOG: CatalogStructure = {
  aktivitas: {
    label: "Aktivitas Bahari",
    color: "#0ea5e9",
    colorBg: "rgba(14,165,233,0.12)",
    items: [],
  },
  peralatan: {
    label: "Peralatan & Perlengkapan",
    color: "#8b5cf6",
    colorBg: "rgba(139,92,246,0.12)",
    items: [],
  },
  akomodasi: {
    label: "Akomodasi Homestay",
    color: "#f59e0b",
    colorBg: "rgba(245,158,11,0.12)",
    items: [],
  },
  kuliner: {
    label: "Kuliner & Oleh-Oleh",
    color: "#ef4444",
    colorBg: "rgba(239,68,68,0.12)",
    items: [],
  },
  fotografi: {
    label: "Fotografi & Dokumentasi",
    color: "#10b981",
    colorBg: "rgba(16,185,129,0.12)",
    items: [],
  },
};

type CategoryKey = keyof typeof DEFAULT_CATALOG;

const CATEGORY_ICONS: Record<CategoryKey, React.ReactNode> = {
  aktivitas: <Waves size={18} />,
  peralatan: <Package size={18} />,
  akomodasi: <Home size={18} />,
  kuliner: <Utensils size={18} />,
  fotografi: <Camera size={18} />,
};

function formatRupiah(num: number) {
  return "Rp " + num.toLocaleString("id-ID");
}

export default function CatalogPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] =
    useState<CategoryKey>("aktivitas");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [catalogData, setCatalogData] = useState<CatalogStructure>(DEFAULT_CATALOG);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;


  const handleViewDetail = (productId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/product/${productId}${filterDate ? `?date=${filterDate}` : ""}`);
  };

  // Fetching data asli saat halaman pertama kali dibuka
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        // Tembak API Backend
        const response = await api.get("/api/products");
        const products = response.data.products;

        // Bikin copy dari default catalog yang kosong
        const newCatalog = JSON.parse(JSON.stringify(DEFAULT_CATALOG));

        // Memilah produk berdasarkan kategori dari relasi Vendor
        products.forEach((p: any) => {
          const catStr = p.vendor?.kategori || "aktivitas_tur";

          let targetCat: CategoryKey = "aktivitas";
          if (catStr === "peralatan") targetCat = "peralatan";
          else if (catStr === "homestay") targetCat = "akomodasi";
          else if (catStr === "kuliner") targetCat = "kuliner";
          else if (catStr === "fotografi") targetCat = "fotografi";

          newCatalog[targetCat].items.push({
            id: p.id,
            name: p.nama_produk,
            desc: p.deskripsi || p.vendor?.nama_toko,
            hargaJual: parseFloat(p.harga),
            unit: (() => {
              if (catStr === "homestay") return "/malam";
              if (catStr === "fotografi") return "/sesi";
              if (catStr === "kuliner") return "/porsi";
              if (catStr === "peralatan") return "/unit";
              return "/orang";
            })(),
            image:
              p.thumbnail_url ||
              "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80",
            addons: (p.crossSellingAsMain || []).filter((item: any) => {
              const cat = item.addonProduct?.vendor?.kategori?.toLowerCase() || "";
              return !cat.includes("homestay") && !cat.includes("akomodasi");
            }),
            inventories: p.inventories || [],
          });
        });

        setCatalogData(newCatalog);
      } catch (error) {
        console.error("Gagal mengambil data produk:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const currentCat = catalogData[activeCategory];
  const filtered = currentCat.items.filter(
    (item: any) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <Header />

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          Beranda
        </span>
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
            Semua produk & layanan dari vendor terverifikasi — aktivitas bahari,
            akomodasi, kuliner, peralatan, hingga dokumentasi profesional.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span>{Object.keys(catalogData).length}</span> Kategori Vendor
            </div>
            <div className={styles.statDivider} />
            <div className={styles.heroStat}>
              <span>
                {Object.values(catalogData).reduce(
                  (sum, cat) => sum + cat.items.length,
                  0,
                )}
              </span>{" "}
              Produk & Layanan
            </div>
            <div className={styles.statDivider} />
            <div className={styles.heroStat}>
              <span>100%</span> Vendor Lokal
            </div>
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
            {(Object.keys(catalogData) as CategoryKey[]).map((key) => {
              const cat = catalogData[key];
              const isActive = activeCategory === key;
              return (
                <button
                  key={key}
                  className={`${styles.categoryBtn} ${isActive ? styles.categoryActive : ""}`}
                  style={
                    isActive
                      ? {
                          borderColor: cat.color,
                          background: cat.colorBg,
                          color: cat.color,
                        }
                      : {}
                  }
                  onClick={() => {
                    setActiveCategory(key);
                    setSearchQuery("");
                  }}
                >
                  <span
                    className={styles.catIcon}
                    style={isActive ? { color: cat.color } : {}}
                  >
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
            <span>Semua vendor telah diverifikasi Admin</span>
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
                <span
                  style={{
                    color: currentCat.color,
                    display: "inline-flex",
                    alignItems: "center",
                    marginRight: "8px",
                  }}
                >
                  {CATEGORY_ICONS[activeCategory]}
                </span>
                {currentCat.label}
              </h2>
              <span className={styles.resultCount}>
                {filtered.length} produk
              </span>
              <div className={styles.filterGroup}>
                <div className={styles.searchBar}>
                  <Search className={styles.searchIcon} size={18} />
                  <input
                    type="text"
                    placeholder={`Cari ${currentCat.label.toLowerCase()}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                <div className={styles.dateFilter}>
                  <Clock className={styles.filterIcon} size={18} />
                  <input
                    type="date"
                    min={(() => {
                      const now = new Date();
                      const offset = now.getTimezoneOffset() * 60000;
                      return new Date(now.getTime() - offset).toISOString().split('T')[0];
                    })()}
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className={styles.dateInput}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className={styles.emptyState}>
              <Clock size={40} color="#334155" className={styles.spin} />
              <p>Mengambil data dari server Divexplore 3D...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <Search size={40} color="#334155" />
              <p>Tidak ada produk yang cocok dengan pencarian Anda.</p>
            </div>
          ) : (
            <div className={styles.productGrid}>
              {currentItems.map((item: any) => (
                <div key={item.id} className={styles.productCard}>
                  {/* ... same card content ... */}
                  <div
                    className={styles.cardImageWrapper}
                    onClick={() => handleViewDetail(item.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className={styles.cardImage}
                    />
                    <div
                      className={styles.cardBadge}
                      style={{ background: currentCat.color, color: "#fff" }}
                    >
                      {CATEGORY_ICONS[activeCategory]}
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <h3
                      className={styles.cardName}
                      onClick={() => handleViewDetail(item.id)}
                      style={{ cursor: "pointer" }}
                    >
                      {item.name}
                    </h3>
                    <p className={styles.cardDesc}>{item.desc}</p>
                    {"kapasitas" in item && (
                      <div className={styles.cardMeta}>
                        <MapPin size={12} /> {(item as any).kapasitas}
                      </div>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <div className={styles.cardAddons}>
                        <Package size={12} color="#0ea5e9" /> +
                        {item.addons.length} Tambahan Opsional
                      </div>
                    )}
                    <div className={styles.cardStock}>
                      <Clock size={12} /> 
                      {(() => {
                        const totalStock = (item as any).inventories?.reduce((acc: any, inv: any) => acc + inv.available_qty, 0) || 0;
                        const name = item.name.toLowerCase();
                        
                        let label = 'slot';
                        if (activeCategory === 'akomodasi') {
                          if (name.includes('spa') || name.includes('massage') || name.includes('layanan')) {
                            label = 'layanan';
                          } else {
                            label = 'kamar';
                          }
                        } else if (activeCategory === 'kuliner') {
                          label = 'porsi';
                        } else if (activeCategory === 'peralatan') {
                          label = 'unit';
                        } else if (activeCategory === 'fotografi') {
                          label = 'sesi';
                        } else {
                          // Default untuk Aktivitas / Tur
                          label = 'pax';
                        }
                        
                        return ` Tersedia ${totalStock} ${label}`;
                      })()}
                    </div>
                    <div className={styles.cardFooter}>
                      <div className={styles.cardPrice}>
                        <span
                          className={styles.priceVal}
                          style={{ color: currentCat.color }}
                        >
                          {formatRupiah(item.hargaJual)}
                        </span>
                        {item.unit && (
                          <span className={styles.priceUnit}>{item.unit}</span>
                        )}
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
                        // Ambil keranjang yang sudah ada
                        const existingCart = JSON.parse(localStorage.getItem('divexplore_cart') || '[]');
                        
                        // Cek apakah item sudah ada di keranjang (berdasarkan product_id)
                        const itemIndex = existingCart.findIndex((i: any) => i.product_id === item.id);
                        
                        if (itemIndex > -1) {
                          existingCart[itemIndex].quantity += 1;
                        } else {
                          existingCart.push({
                            id: item.id, // Untuk mapping di CartPage
                            product_id: item.id, // Untuk Backend
                            name: item.name,
                            type: currentCat.label,
                            location: '', // Dikosongkan agar tidak muncul ikon pin di deskripsi
                            price: item.hargaJual,
                            quantity: 1,
                            image: item.image,
                            addons: [],
                          });
                        }
                        
                        localStorage.setItem("divexplore_cart", JSON.stringify(existingCart));
                        
                        // Trigger custom event agar Header terupdate
                        window.dispatchEvent(new Event('cartUpdated'));
                        
                        if (!isAuthenticated) {
                          Swal.fire({
                            title: 'Masuk ke Keranjang Tamu',
                            text: 'Produk ditambahkan ke keranjang tamu. Silakan login untuk memproses pesanan.',
                            icon: 'info',
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 4000,
                            background: '#1e293b',
                            color: '#f8fafc',
                            iconColor: '#f59e0b'
                          });
                        } else {
                          Swal.fire({
                            title: 'Berhasil!',
                            text: 'Pesanan berhasil dimasukkan ke keranjang',
                            icon: 'success',
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 3000,
                            background: '#1e293b',
                            color: '#f8fafc',
                            iconColor: '#0ea5e9'
                          });
                        }
                      }}
                    >
                      <ShoppingCart size={15} />
                      Tambah ke Keranjang
                    </button>
                    <button
                      className={styles.detailBtn}
                      onClick={() => handleViewDetail(item.id)}
                    >
                      Lihat Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination UI */}
          {!isLoading && totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  className={`${styles.pageBtn} ${currentPage === num ? styles.pageActive : ""}`}
                  style={currentPage === num ? { background: currentCat.color, borderColor: currentCat.color } : {}}
                  onClick={() => paginate(num)}
                >
                  {num}
                </button>
              ))}

              <button
                className={styles.pageBtn}
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
