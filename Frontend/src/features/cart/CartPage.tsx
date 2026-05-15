import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../app/providers/AuthContext';
import { 
  Trash2, 
  Minus, 
  Plus,
  ShoppingCart,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Clock,
  ChevronRight,
  Package,
  Waves,
  Lock,
  UserCircle
} from 'lucide-react';
import styles from './CartPage.module.css';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  type: string;
  location: string;
  price: number;
  quantity: number;
  image: string;
  addons: { id?: string; name: string; price: number }[];
  addon_ids?: string[];
  visitDate?: string;
  checkIn?: string;
  checkOut?: string;
}

export default function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('divexplore_cart');
    if (saved) return JSON.parse(saved);
    return [];
  });

  useEffect(() => {
    localStorage.setItem('divexplore_cart', JSON.stringify(cartItems));
    window.dispatchEvent(new Event('cartUpdated'));
  }, [cartItems]);

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(items => 
      items.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const updateItemDate = (id: string, field: 'visitDate' | 'checkIn' | 'checkOut', value: string) => {
    setCartItems(items =>
      items.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const calculateNights = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const isAkomodasi = item.type.toLowerCase().includes('akomodasi');
      const multiplier = isAkomodasi ? calculateNights(item.checkIn, item.checkOut) : 1;
      const itemTotal = item.price * item.quantity * multiplier;
      const addonsTotal = item.addons.reduce((sum, addon) => sum + addon.price, 0) * item.quantity;
      return total + itemTotal + addonsTotal;
    }, 0);
  };

  const subtotal = calculateSubtotal();

  const getTodayLocalDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  };

  const handleCheckout = () => {
    const incompleteVisit = cartItems.find(item => !item.type.toLowerCase().includes('akomodasi') && !item.visitDate);
    if (incompleteVisit) {
      Swal.fire({
        icon: 'warning',
        title: 'Perhatian',
        text: `Harap pilih tanggal rencana kunjungan Anda untuk ${incompleteVisit.name}`,
        confirmButtonColor: '#0ea5e9',
        background: '#1e293b',
        color: '#fff'
      });
      return;
    }

    const incompleteDates = cartItems.find(item => {
      const isAkomodasi = item.type.toLowerCase().includes('akomodasi');
      const hasHomestayAddon = item.addons.some(a => a.name.toLowerCase().includes('homestay') || a.name.toLowerCase().includes('penginapan'));
      return (isAkomodasi || hasHomestayAddon) && (!item.checkIn || !item.checkOut);
    });

    if (incompleteDates) {
      Swal.fire({
        icon: 'warning',
        title: 'Perhatian',
        text: `Harap tentukan jadwal menginap (Check-in & Check-out) untuk ${incompleteDates.name}`,
        confirmButtonColor: '#0ea5e9',
        background: '#1e293b',
        color: '#fff'
      });
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.breadcrumb}>
        <span onClick={() => navigate('/')}>Beranda</span>
        <ChevronRight size={14} />
        <span className={styles.active}>Keranjang Belanja</span>
      </div>

      {!isAuthenticated && (
        <div className={styles.guestBanner}>
          <div className={styles.guestInfo}>
            <div className={styles.guestBadge}>
              <UserCircle size={14} /> Tamu
            </div>
            <p className={styles.guestMessage}>
              Anda masuk sebagai <b>Tamu</b>. Anda bebas memilih produk, namun silakan <b>Masuk Akun</b> untuk melanjutkan proses pembayaran dan mendapatkan riwayat pesanan.
            </p>
          </div>
          <button className={styles.guestAction} onClick={() => navigate('/login')}>
            <Lock size={14} /> Masuk Sekarang
          </button>
        </div>
      )}

      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <ShoppingCart size={14} />
            Konfirmasi Pesanan Anda
          </div>
          <h1 className={styles.heroTitle}>Keranjang Belanja</h1>
          <p className={styles.heroSubtitle}>
            Tinjau kembali pilihan petualangan Anda sebelum melanjutkan ke proses pembayaran.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}><span>{cartItems.length}</span> Item</div>
            <div className={styles.statDivider} />
            <div className={styles.heroStat}><span>100%</span> Transaksi Aman</div>
          </div>
        </div>
        <div className={styles.heroImage}>
          <img src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80" alt="Cart Hero" />
          <div className={styles.heroImageOverlay} />
        </div>
      </div>

      <div className={styles.mainWrapper}>
        <main className={styles.productArea}>
          <div className={styles.toolbar}>
            <h2 className={styles.categoryHeading}><Waves size={20} color="#0ea5e9" /> Daftar Pesanan</h2>
            <span className={styles.resultCount}>{cartItems.length} item</span>
          </div>

          <div className={styles.productGrid}>
            {cartItems.length === 0 ? (
              <div className={styles.emptyCart}>
                <ShoppingCart size={64} className={styles.emptyIcon} />
                <h2>Keranjangmu Kosong</h2>
                <p>Mungkin ada petualangan seru yang terlewatkan.</p>
                <button className={styles.exploreBtn} onClick={() => navigate('/catalog')}>Mulai Menjelajah</button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className={styles.productCard}>
                  <div className={styles.cardImageWrapper}>
                    <img src={item.image} alt={item.name} className={styles.cardImage} />
                    <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className={styles.cardBody}>
                    <div className={styles.cardTopInfo}>
                      <div className={styles.cardBadge}>{item.type}</div>
                      <h3 className={styles.cardName}>{item.name}</h3>
                    </div>

                    {item.addons.length > 0 && (
                      <div className={styles.itemAddons}>
                        {item.addons.map((addon, idx) => (
                          <div key={idx} className={styles.addonChip}>
                            <Sparkles size={11} color="#0ea5e9" /> {addon.name}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className={styles.dateSelectors}>
                      {item.type.toLowerCase().includes('akomodasi') ? (
                        <>
                          <div className={styles.dateField}>
                            <label>Check-in</label>
                            <div className={styles.inputWrapper}>
                              <Clock size={14} color="#0ea5e9" className={styles.inputIconLeft} />
                              <input 
                                type="date" 
                                className={styles.dateInput}
                                min={getTodayLocalDate()}
                                value={item.checkIn || ''} 
                                onChange={(e) => updateItemDate(item.id, 'checkIn', e.target.value)} 
                              />
                            </div>
                          </div>
                          <div className={styles.dateField}>
                            <label>Check-out</label>
                            <div className={styles.inputWrapper}>
                              <Clock size={14} color="#0ea5e9" className={styles.inputIconLeft} />
                              <input 
                                type="date" 
                                className={styles.dateInput}
                                min={item.checkIn || getTodayLocalDate()}
                                value={item.checkOut || ''} 
                                onChange={(e) => updateItemDate(item.id, 'checkOut', e.target.value)} 
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className={styles.dateField}>
                          <label>Rencana Kunjungan</label>
                          <div className={styles.inputWrapper}>
                            <Clock size={14} color="#0ea5e9" className={styles.inputIconLeft} />
                            <input 
                              type="date" 
                              className={styles.dateInput}
                              min={getTodayLocalDate()}
                              value={item.visitDate || ''} 
                              onChange={(e) => updateItemDate(item.id, 'visitDate', e.target.value)} 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <div className={styles.qtySelector}>
                      <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, -1)}><Minus size={16} /></button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, 1)}><Plus size={16} /></button>
                    </div>

                    <div className={styles.itemPricing}>
                      <div className={styles.priceInfo}>
                        Rp {item.price.toLocaleString('id-ID')} {item.type.toLowerCase().includes('akomodasi') && item.checkIn && item.checkOut && (
                          <span style={{ color: '#f59e0b', fontWeight: 700 }}>({calculateNights(item.checkIn, item.checkOut)} mlm)</span>
                        )}
                      </div>
                      <div className={styles.totalVal}>
                        Rp {(
                          (item.price * (item.type.toLowerCase().includes('akomodasi') ? calculateNights(item.checkIn, item.checkOut) : 1) + 
                           item.addons.reduce((s, a) => s + a.price, 0)
                          ) * item.quantity
                        ).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        <aside className={styles.sidebar}>
          <div className={styles.toolbar}>
            <h2 className={styles.categoryHeading}><ShoppingCart size={20} color="#0ea5e9" /> Ringkasan Belanja</h2>
          </div>
          <div className={styles.summaryCard}>
            {/* Price Breakdown */}
            <div className={styles.summaryRow}>
              <span>Total Harga ({cartItems.length} item)</span>
              <span>Rp {cartItems.reduce((acc, item) => acc + (item.price * item.quantity * (item.type.toLowerCase().includes('akomodasi') ? calculateNights(item.checkIn, item.checkOut) : 1)), 0).toLocaleString('id-ID')}</span>
            </div>
            
            <div className={styles.summaryRow}>
              <span>Layanan Tambahan</span>
              <span>Rp {cartItems.reduce((acc, item) => acc + (item.addons.reduce((s, a) => s + a.price, 0) * item.quantity), 0).toLocaleString('id-ID')}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Diskon / Promo</span>
              <span className={styles.discountValue}>- Rp 0</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Pajak & Biaya Layanan</span>
              <span className={styles.taxIncluded}>Termasuk</span>
            </div>

            <div className={styles.divider} />

            {/* Promo Code Section */}
            <div className={styles.promoSection}>
              <div className={styles.promoInputGroup}>
                <input type="text" placeholder="Masukkan kode promo" className={styles.promoInput} />
                <button className={styles.promoBtn}>Pakai</button>
              </div>
            </div>

            {/* Final Total */}
            <div className={styles.totalRow}>
              <div className={styles.totalLabelGroup}>
                <span className={styles.totalMainLabel}>Total Pembayaran</span>
              </div>
              <div className={styles.finalTotal}>Rp {subtotal.toLocaleString('id-ID')}</div>
            </div>

            <button className={styles.checkoutBtn} onClick={handleCheckout} disabled={cartItems.length === 0}>
              <CreditCard size={18} /> Lanjut ke Pembayaran
            </button>

            <div className={styles.secureInfo}>
              <ShieldCheck size={16} color="#10b981" /> Transaksi Aman & Terenkripsi
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', padding: '0 16px' }}>
            <Package size={14} color="#0ea5e9" /> Voucher dapat digunakan di checkout
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  );
}
