import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import { api } from '../../utils/api';
import { 
  Box, 
  Clock, 
  Users, 
  Award, 
  MapPin, 
  Star, 
  ShoppingCart, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  FileText,
  Package,
  Minus,
  Plus, ArrowRight } from 'lucide-react';
import styles from './ProductDetailPage.module.css';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import Swal from 'sweetalert2';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('deskripsi');

  // Inisialisasi state tanggal dari URL atau SessionStorage (Bulletproof)
  const queryParams = new URLSearchParams(window.location.search);
  const initialDate = queryParams.get('date') || sessionStorage.getItem('divexplore_filter_date') || "";

  const [bookingDate, setBookingDate] = useState<string>(initialDate);
  const [checkInDate, setCheckInDate] = useState<string>(initialDate);
  
  // Set check-out otomatis H+1 jika check-in ada
  const getInitialCheckOut = () => {
    if (!initialDate) return "";
    const nextDay = new Date(initialDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.toISOString().split('T')[0];
  };
  const [checkOutDate, setCheckOutDate] = useState<string>(getInitialCheckOut());

  const PRODUCT_IMAGES = [
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80",
    "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=1600&q=80",
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1600&q=80",
    "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=1600&q=80"
  ];
  
  const [activeImage, setActiveImage] = useState(PRODUCT_IMAGES[0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (id) {
          const res = await api.get(`/api/products/${id}`);
          const p = res.data?.product;
          setProduct(p);
          if (p?.thumbnail_url) {
            setActiveImage(p.thumbnail_url);
          }
        }
        
        // Ambil produk terkait (dummy filter dari semua produk)
        const relRes = await api.get('/api/products');
        const allProds = relRes.data?.products || [];
        setRelatedProducts(allProds.filter((p: any) => p.id !== id).slice(0, 5));
        
      } catch (err) {
        console.error("Gagal load detail:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Pricing logic
  const basePrice = product ? Number(product.harga) : 0;

  // Review logic
  const reviewCount = product?.reviews?.length || 0;
  const averageRating = reviewCount > 0 
    ? (product.reviews.reduce((acc: number, rev: any) => acc + (rev.rating || 5), 0) / reviewCount)
    : 0;

  const calculateTotal = () => {
    let perPerson = basePrice;
    if (product?.crossSellingAsMain) {
      product.crossSellingAsMain.forEach((addonObj: any) => {
        if (selectedAddons.includes(addonObj.addonProduct.id)) {
          perPerson += Number(addonObj.addonProduct.harga);
        }
      });
    }
    return perPerson * quantity;
  };

  const getSelectedAddonsData = () => {
    const res: any[] = [];
    if (product?.crossSellingAsMain) {
      product.crossSellingAsMain.forEach((addonObj: any) => {
        if (selectedAddons.includes(addonObj.addonProduct.id)) {
          res.push({
            id: addonObj.id,                              // ID dari tabel ProductAddon (join table)
            addon_product_id: addonObj.addonProduct.id,  // ID produk addon
            name: addonObj.addonProduct.nama_produk,
            price: Number(addonObj.addonProduct.harga)
          });
        }
      });
    }
    return res;
  };

  const getDynamicFeatures = () => {
    if (!product) {
      return {
        durasi: '-',
        kapasitas: '-',
        level: '-',
        included: []
      };
    }
    const category = product?.vendor?.kategori?.toLowerCase() || '';
    
    if (category === 'homestay') {
      return {
        durasi: '1 Malam',
        kapasitas: product?.kapasitas ? `${product.kapasitas} Orang` : '2 Orang/Kamar',
        level: 'Semua Umur',
        included: [
          'Kamar bersih dan nyaman (AC/Kipas)',
          'Sarapan gratis untuk 2 orang',
          'Akses Wi-Fi gratis di seluruh area',
          'Layanan kebersihan harian'
        ]
      };
    } else if (category === 'kuliner') {
      return {
        durasi: 'Bebas',
        kapasitas: product?.kapasitas ? `${product.kapasitas} Porsi` : '1 Porsi',
        level: 'Semua Kalangan',
        included: [
          'Bahan makanan segar tangkapan lokal',
          'Bumbu rempah otentik khas daerah',
          'Pilihan area makan indoor/outdoor',
          'Termasuk pajak dan layanan'
        ]
      };
    } else if (category === 'fotografi') {
      return {
        durasi: '1-2 Jam',
        kapasitas: 'Hingga 5 Orang',
        level: 'Fleksibel',
        included: [
          'Sesi foto outdoor (Pantai/Darat)',
          'Semua file foto mentah',
          'Edit 10 foto pilihan terbaik',
          'Properti foto standar'
        ]
      };
    } else {
      // Default / Aktivitas Tur / Peralatan
      return {
        durasi: '4-6 Jam',
        kapasitas: product?.kapasitas ? `${product.kapasitas} Orang` : 'Grup/Pribadi',
        level: 'Pemula - Lanjut',
        included: [
          'Pelayanan terbaik dari vendor lokal terverifikasi',
          'Peralatan keselamatan sesuai standar',
          'Pemandu lokal berpengalaman',
          'Asuransi perjalanan dasar selama aktivitas'
        ]
      };
    }
  };

  if (!product) return <div className={styles.error}>Produk tidak ditemukan</div>;

  const category = product?.vendor?.kategori?.toLowerCase() || '';
  const isAkomodasi = category.includes('homestay');

  const dynamicData = getDynamicFeatures();

  const handleAddToCart = () => {
    if (!product) return;

    // PROTEKSI: Cek apakah sudah login
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // VALIDASI TANGGAL
    const category = product?.vendor?.kategori?.toLowerCase() || '';
    if (category.includes('homestay')) {
      if (!checkInDate || !checkOutDate) {
        Swal.fire('Perhatian', 'Harap pilih tanggal Check-in dan Check-out', 'warning');
        return;
      }
      if (new Date(checkOutDate) <= new Date(checkInDate)) {
        Swal.fire('Error', 'Tanggal Check-out harus setelah Check-in', 'error');
        return;
      }
    } else {
      if (!bookingDate) {
        Swal.fire('Perhatian', 'Harap pilih tanggal rencana kunjungan Anda', 'warning');
        return;
      }
    }

    const cartItem = {
      id: product.id,
      product_id: product.id,
      name: product.nama_produk,
      type: product.vendor?.kategori || 'AKTIVITAS',
      location: product.lokasi || 'Indonesia',
      price: basePrice,
      quantity: quantity,
      image: product.thumbnail_url || PRODUCT_IMAGES[0],
      addons: getSelectedAddonsData(),
      addon_ids: getSelectedAddonsData().map((a: any) => a.id).filter(Boolean),
      // Sertakan data tanggal ke keranjang
      booking_date: bookingDate,
      check_in: checkInDate,
      check_out: checkOutDate
    };
    
    const existingCart = JSON.parse(localStorage.getItem('divexplore_cart') || '[]');
    const existingIndex = existingCart.findIndex((item: any) => item.id === cartItem.id);
    
    if (existingIndex > -1) {
      existingCart[existingIndex] = cartItem; 
    } else {
      existingCart.push(cartItem);
    }
    
    localStorage.setItem('divexplore_cart', JSON.stringify(existingCart));
    window.dispatchEvent(new Event('cartUpdated'));

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
  };

  const handleBook = () => {
    if (!product) return;

    // VALIDASI TANGGAL (Sama seperti Add to Cart)
    const category = product?.vendor?.kategori?.toLowerCase() || '';
    if (category.includes('homestay')) {
      if (!checkInDate || !checkOutDate) {
        Swal.fire('Perhatian', 'Harap pilih tanggal Check-in dan Check-out', 'warning');
        return;
      }
    } else {
      if (!bookingDate) {
        Swal.fire('Perhatian', 'Harap pilih tanggal rencana kunjungan Anda', 'warning');
        return;
      }
    }

    const directItem = {
      id: product.id,
      product_id: product.id,
      name: product.nama_produk,
      type: product.vendor?.kategori || 'AKTIVITAS',
      location: product.lokasi || 'Indonesia',
      price: basePrice,
      quantity: quantity,
      image: product.thumbnail_url || PRODUCT_IMAGES[0],
      addons: getSelectedAddonsData(),
      addon_ids: getSelectedAddonsData().map((a: any) => a.id).filter(Boolean),
      booking_date: bookingDate,
      check_in: checkInDate,
      check_out: checkOutDate
    };
    
    localStorage.setItem('divexplore_cart_direct', JSON.stringify([directItem]));
    navigate('/checkout?type=direct');
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Header />
        <main className={styles.mainContent} style={{ justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <p>Memuat detail produk...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.container}>
        <Header />
        <main className={styles.mainContent} style={{ justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <p>Produk tidak ditemukan.</p>
          <button className={styles.btnPrimary} onClick={() => navigate('/catalog')}>Kembali ke Katalog</button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <Header />

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Beranda</span>
        <span>&gt;</span>
        <span onClick={() => navigate('/catalog')} style={{ cursor: 'pointer' }}>Katalog</span>
        <span>&gt;</span>
        <span>{product.vendor?.kategori || 'Kategori'}</span>
        <span>&gt;</span>
        <span className={styles.active}>{product.nama_produk}</span>
      </div>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Left Column: Gallery & Info */}
        <div className={styles.leftColumn}>
          <div className={styles.gallery}>
            <div className={styles.mainImageContainer}>
              <img 
                src={activeImage} 
                alt={product.nama_produk} 
                className={styles.mainImage}
              />
              <div className={styles.tagsOverlay}>
                <span className={styles.tagBlue}>{product.vendor?.kategori?.toUpperCase() || 'PRODUK'}</span>
                <span className={styles.tagOrange}>TERVERIFIKASI</span>
              </div>
              {product.hotspots && product.hotspots.length > 0 && (
                <button className={styles.view360Btn} onClick={() => navigate('/')}>
                  <Box size={16} />
                  Lihat 360°
                </button>
              )}
            </div>
            
            <div className={styles.thumbnails}>
              {[product.thumbnail_url, ...PRODUCT_IMAGES].slice(0, 4).filter(Boolean).map((img, index) => (
                <img 
                  key={index}
                  src={img} 
                  className={`${styles.thumbnail} ${activeImage === img ? styles.active : ''}`} 
                  alt={`Thumb ${index + 1}`} 
                  onClick={() => setActiveImage(img)}
                />
              ))}
            </div>
          </div>

          {/* Stock Status Badge */}
          {product.inventories && (
            <div className={`${styles.stockBadge} ${
              product.inventories.reduce((acc: number, inv: any) => acc + inv.available_qty, 0) > 10 
                ? styles.stockAvailable 
                : product.inventories.reduce((acc: number, inv: any) => acc + inv.available_qty, 0) > 0 
                ? styles.stockLimited 
                : styles.stockOut
            }`}>
              <Package size={14} />
              {(() => {
                const totalStock = product.inventories.reduce((acc: number, inv: any) => acc + inv.available_qty, 0);
                if (totalStock <= 0) return 'Maaf, Stok Habis';
                
                const category = product?.vendor?.kategori?.toLowerCase() || '';
                const name = product?.nama_produk?.toLowerCase() || '';
                
                let label = 'slot';
                if (category.includes('homestay')) {
                  if (name.includes('spa') || name.includes('sauna') || name.includes('paket')) {
                    label = 'layanan';
                  } else {
                    label = 'kamar';
                  }
                } else if (category.includes('peralatan') || category.includes('kuliner')) {
                  label = 'unit';
                }
                
                return `Tersisa ${totalStock} ${label} tersedia`;
              })()}
            </div>
          )}

            {/* BAGIAN BARU: PEMILIHAN TANGGAL (PREMIUM UI) */}
            <div className={styles.dateSelectionCard}>
              <div className={styles.dateHeader}>
                <Clock className={styles.dateIcon} size={20} />
                <span>{isAkomodasi ? 'Tentukan Waktu Menginap' : 'Pilih Tanggal Kunjungan'}</span>
              </div>
              
              <div className={styles.dateGrid}>
                {isAkomodasi ? (
                  <>
                    <div className={styles.dateField}>
                      <label>Check-in</label>
                      <input 
                        type="date" 
                        min={new Date().toISOString().split('T')[0]}
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                      />
                    </div>
                    <div className={styles.dateField}>
                      <label>Check-out</label>
                      <input 
                        type="date" 
                        min={checkInDate || new Date().toISOString().split('T')[0]}
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <div className={styles.dateField}>
                    <label>Tanggal Rencana Kunjungan</label>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <p className={styles.dateHint}>
                * Ketersediaan slot akan dikonfirmasi otomatis saat pembayaran
              </p>
            </div>

          <div className={styles.infoCards}>
            <div className={styles.infoCard}>
              <Clock className={styles.infoIcon} size={24} />
              <span className={styles.infoValue}>{dynamicData.durasi}</span>
              <span className={styles.infoLabel}>Durasi</span>
            </div>
            <div className={styles.infoCard}>
              <Users className={styles.infoIcon} size={24} />
              <span className={styles.infoValue}>{dynamicData.kapasitas}</span>
              <span className={styles.infoLabel}>Kapasitas</span>
            </div>
            <div className={styles.infoCard}>
              <Award className={styles.infoIcon} size={24} />
              <span className={styles.infoValue}>{dynamicData.level}</span>
              <span className={styles.infoLabel}>Level</span>
            </div>
            <div className={styles.infoCard}>
              <MapPin className={styles.infoIcon} size={24} />
              <span className={styles.infoValue}>{product.lokasi || 'Gili Trawangan'}</span>
              <span className={styles.infoLabel}>Lokasi</span>
            </div>
          </div>
        </div>

        {/* Right Column: Booking Card */}
        <div className={styles.rightColumn}>
          <div className={styles.bookingCard}>
            <div className={styles.bookingHeader}>
              <div className={styles.vendorInfo}>
                <span className={styles.vendorBadge}>{product.vendor?.kategori || 'VENDOR'}</span>
                <span className={styles.vendorLocation}>{product.vendor?.nama_toko}</span>
              </div>
              <h1 className={styles.productTitle}>{product.nama_produk}</h1>
              
              <div className={styles.ratingRow}>
                <div className={styles.stars}>
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      fill={i < Math.round(averageRating) ? "#f59e0b" : "none"} 
                      color={i < Math.round(averageRating) ? "#f59e0b" : "#cbd5e1"} 
                    />
                  ))}
                </div>
                <span className={styles.ratingScore}>{averageRating.toFixed(1)}</span>
                <span className={styles.reviewCount}>({reviewCount} ulasan)</span>
              </div>
              
              <div className={styles.priceContainer}>
                <span className={styles.mainPrice}>Rp {basePrice.toLocaleString('id-ID')}</span>
                <span className={styles.priceUnit}>/orang</span>
              </div>
            </div>

            <div className={styles.bookingForm}>
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

              {product.crossSellingAsMain && product.crossSellingAsMain.length > 0 && (
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Tambahan Opsional:</label>
                  <div className={styles.addons}>
                    {product.crossSellingAsMain.map((addonObj: any) => {
                      const addon = addonObj.addonProduct;
                      const isChecked = selectedAddons.includes(addon.id);
                      return (
                        <div className={styles.addonItem} key={addon.id}>
                          <div className={styles.addonLeft}>
                            <input 
                              type="checkbox" 
                              className={styles.checkbox} 
                              checked={isChecked} 
                              onChange={() => {
                                if (isChecked) setSelectedAddons(prev => prev.filter(a => a !== addon.id));
                                else setSelectedAddons(prev => [...prev, addon.id]);
                              }} 
                            />
                            <span className={styles.addonName}><Plus size={14} style={{marginRight: '6px'}} /> {addon.nama_produk}</span>
                          </div>
                          <span className={styles.addonPrice}>+Rp {Number(addon.harga).toLocaleString('id-ID')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total:</span>
                <div className={styles.totalPriceWrapper}>
                  <span className={styles.finalPrice}>Rp {calculateTotal().toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className={styles.actionButtons}>
                <button className={styles.btnPrimary} onClick={handleAddToCart}>
                  <ShoppingCart size={18} />
                  Tambah ke Keranjang
                </button>
                <button className={styles.btnSuccess} onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                  } else {
                    handleBook();
                  }
                }}>
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
          {(activeTab === 'deskripsi' || activeTab === 'ulasan') && (
            <>
              {activeTab === 'deskripsi' && (
                <div className={styles.descriptionCol}>
                  <h2 className={styles.sectionTitle}>Tentang {product.nama_produk}</h2>
                  <p className={styles.descText}>
                    {product.deskripsi || "Jelajahi keindahan tersembunyi dengan paket wisata dari Divexplore 3D. Kami bekerjasama dengan vendor lokal terpercaya untuk memberikan pengalaman yang tak terlupakan. Fasilitas terbaik telah kami siapkan khusus untuk Anda."}
                  </p>

                  <div className={styles.whatsIncluded}>
                    <div className={styles.includedTitle}>
                      <CheckCircle2 size={20} color="#10b981" />
                      Apa yang Termasuk
                    </div>
                    <div className={styles.includedList}>
                      {dynamicData.included.map((item, idx) => (
                        <div key={idx} className={styles.includedItem}>
                          <CheckCircle2 size={16} color="#10b981" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.reviewsCol} style={activeTab === 'ulasan' ? { flex: 1, maxWidth: '100%' } : {}}>
                <div className={styles.reviewsHeader}>
                  <h2 className={styles.sectionTitle}>
                    <Star size={20} color="#f59e0b" style={{display: 'inline', marginRight: '8px'}} />
                    Ulasan Terbaru
                  </h2>
                  <span className={styles.viewAllLink}>Lihat semua <ArrowRight size={14} style={{marginLeft: '4px', display: 'inline-block'}} /></span>
                </div>

                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((review: any) => (
                    <div key={review.id} className={styles.reviewCard}>
                      <div className={styles.reviewerInfo}>
                        <div className={styles.reviewerProfile}>
                          <img 
                            src={review.user?.foto_profil_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user?.nama_lengkap || 'User')}`} 
                            alt={review.user?.nama_lengkap || 'User'} 
                            className={styles.reviewerAvatar} 
                          />
                          <div>
                            <div className={styles.reviewerName}>{review.user?.nama_lengkap || 'Pengguna'}</div>
                            <div className={styles.stars}>
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={12} 
                                  fill={i < (review.rating || 5) ? "#f59e0b" : "none"} 
                                  color={i < (review.rating || 5) ? "#f59e0b" : "#cbd5e1"} 
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className={styles.reviewText}>{review.komentar}</p>
                    </div>
                  ))
                ) : (
                  <p className={styles.reviewText}>Belum ada ulasan untuk produk ini.</p>
                )}
              </div>
            </>
          )}

          {activeTab === 'lokasi' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 className={styles.sectionTitle}>Lokasi & Titik Kumpul</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                <MapPin size={18} />
                <span>{product.vendor?.alamat_lengkap || product.lokasi || 'Gili Trawangan, Lombok, Nusa Tenggara Barat'}</span>
              </div>
              <div style={{ width: '100%', height: '400px', backgroundColor: '#1e293b', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <MapPin size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>Peta interaktif (Google Maps / Leaflet) akan diintegrasikan di sini.</p>
                  <p style={{ fontSize: '13px', marginTop: '8px', opacity: 0.7 }}>Menampilkan koordinat: {product.lokasi || 'Gili Trawangan'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.relatedHeader}>
            <h2 className={styles.sectionTitle}>
              <ShoppingCart size={20} style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}} />
              Rekomendasi Lainnya
            </h2>
            <span className={styles.viewAllLink} onClick={() => navigate('/catalog')} style={{cursor:'pointer'}}>Lihat Semua <ArrowRight size={14} style={{marginLeft: '4px', display: 'inline-block'}} /></span>
          </div>
          
          <div className={styles.relatedGrid}>
            {relatedProducts.map(rel => (
              <div key={rel.id} className={styles.relatedCard}>
                <div className={styles.relatedImageContainer} onClick={() => navigate(`/product/${rel.id}`)} style={{cursor: 'pointer'}}>
                  <img src={rel.thumbnail_url || PRODUCT_IMAGES[1]} alt={rel.nama_produk} className={styles.relatedImage} />
                  <span className={styles.relatedTag} style={{ background: '#0ea5e9', color: 'white' }}>{rel.vendor?.kategori?.toUpperCase() || 'UMKM'}</span>
                </div>
                <div className={styles.relatedInfo}>
                  <h3 className={styles.relatedTitle} onClick={() => navigate(`/product/${rel.id}`)} style={{cursor: 'pointer'}}>{rel.nama_produk}</h3>
                  <div className={styles.relatedLocation}>
                    <MapPin size={10} /> {rel.vendor?.nama_toko}
                  </div>
                  <div className={styles.relatedFooter}>
                    <div className={styles.relatedPrice}>Rp {Number(rel.harga).toLocaleString('id-ID')}</div>
                    <button className={styles.addBtn} onClick={() => navigate(`/product/${rel.id}`)}>Detail</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
