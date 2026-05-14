import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import { 
  Box, 
  Trash2, 
  Minus, 
  Plus,
  ArrowLeft,
  ShoppingCart,
  ShieldCheck,
  CreditCard,
  MapPin,
  Sparkles
} from 'lucide-react';
import styles from './CartPage.module.css';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';

interface CartItem {
  id: string;
  name: string;
  type: string;
  location: string;
  price: number;
  quantity: number;
  image: string;
  addons: { name: string; price: number }[];
}

export default function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Read from localStorage or use default
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('divexplore_cart');
    if (saved) return JSON.parse(saved);
    return [];
  });

  useEffect(() => {
    localStorage.setItem('divexplore_cart', JSON.stringify(cartItems));
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

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const addonsTotal = item.addons.reduce((sum, addon) => sum + addon.price, 0) * item.quantity;
      return total + itemTotal + addonsTotal;
    }, 0);
  };

  const calculateTaxes = (subtotal: number) => {
    return subtotal * 0.11; // 11% PPN
  };

  const subtotal = calculateSubtotal();
  const total = subtotal;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            Kembali
          </button>
          <h1 className={styles.pageTitle}>Keranjang Belanja</h1>
        </div>

        <div className={styles.cartLayout}>
          <div className={styles.cartItemsHeader}>
            <span>{cartItems.length} Item di keranjang</span>
          </div>
          <div className={styles.summaryHeaderPlaceholder}></div>

          {/* Cart Items List */}
          <div className={styles.cartItemsSection}>
            
            {cartItems.length === 0 ? (
              <div className={styles.emptyCart}>
                <div className={styles.emptyIcon}>
                  <ShoppingCart size={40} />
                </div>
                <h2>Keranjang Anda masih kosong</h2>
                <p>Jelajahi petualangan bawah laut yang menakjubkan hari ini!</p>
                <button className={styles.exploreBtn} onClick={() => navigate('/catalog')}>
                  Mulai Menjelajah
                </button>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {cartItems.map((item) => (
                  <div key={item.id} className={styles.cartItem}>
                    <img src={item.image} alt={item.name} className={styles.itemImage} />
                    
                    <div className={styles.itemDetails}>
                      <div className={styles.itemHeader}>
                        <div className={styles.itemBadgeRow}>
                          <span className={styles.itemType}>{item.type}</span>
                          <span className={styles.itemLocation}>
                            <MapPin size={12} /> {item.location}
                          </span>
                        </div>
                        <button className={styles.removeBtn} onClick={() => removeItem(item.id)} title="Hapus Item">
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <h3 className={styles.itemName}>{item.name}</h3>
                      
                      {item.addons.length > 0 && (
                        <div className={styles.itemAddons}>
                          <p className={styles.addonsLabel}>Add-ons Pilihan:</p>
                          <ul>
                            {item.addons.map((addon, idx) => (
                              <li key={idx}>
                                <Sparkles size={12} color="#0ea5e9" />
                                {addon.name} (Rp {addon.price.toLocaleString('id-ID')})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className={styles.itemFooter}>
                        <div className={styles.qtySelector}>
                          <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, -1)}>
                            <Minus size={14} />
                          </button>
                          <span className={styles.qtyValue}>{item.quantity}</span>
                          <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, 1)}>
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className={styles.itemPricing}>
                          <div className={styles.itemPrice}>
                            Rp {item.price.toLocaleString('id-ID')} <span>/ orang</span>
                          </div>
                          <div className={styles.itemTotal}>
                            Rp {((item.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className={styles.summarySection}>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>
                <ShoppingCart size={24} color="#0ea5e9" />
                Ringkasan Pesanan
              </h2>
              
              <div className={styles.summaryRow}>
                <span>Subtotal ({cartItems.length} item)</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              
              <div className={styles.divider}></div>
              
              <div className={styles.totalRow}>
                <div className={styles.totalLabelGroup}>
                  <span>Total Biaya</span>
                  <span className={styles.taxNote}>*Harga sudah termasuk pajak</span>
                </div>
                <span className={styles.finalTotal}>Rp {total.toLocaleString('id-ID')}</span>
              </div>
              
              <button 
                className={styles.checkoutBtn} 
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
              >
                <CreditCard size={18} />
                Pesan Sekarang
              </button>
              
              <div className={styles.secureCheckout}>
                <ShieldCheck size={16} color="#10b981" />
                <span>Transaksi Aman & Terenkripsi</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
