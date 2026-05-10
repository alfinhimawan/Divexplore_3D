import { useState } from 'react';
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
  CreditCard
} from 'lucide-react';
import styles from './CartPage.module.css';

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
  const { isAuthenticated, user, logout } = useAuth();
  
  // Mock cart items
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Snorkeling Gili Premium',
      type: 'SNORKELING',
      location: 'Lombok',
      price: 350000,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      addons: [
        { name: 'Makan Siang', price: 75000 },
        { name: 'Sewa Alat Selam', price: 100000 }
      ]
    },
    {
      id: '2',
      name: 'Gili Sea Garden Resort',
      type: 'HOTEL',
      location: 'Gili Trawangan, Lombok',
      price: 450000,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80',
      addons: []
    }
  ]);

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
  const taxes = calculateTaxes(subtotal);
  const total = subtotal + taxes;

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
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
          <Box className={styles.logoIcon} size={24} />
          <span>DIVEXPLORE-3D</span>
        </div>
        <nav className={styles.navLinks}>
          <span className={styles.navLink} onClick={() => navigate('/')}>Destinasi</span>
          <span className={styles.navLink}>Vendor</span>
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
          {/* Cart Items List */}
          <div className={styles.cartItemsSection}>
            <div className={styles.cartItemsHeader}>
              <span>{cartItems.length} Item di keranjang</span>
            </div>
            
            {cartItems.length === 0 ? (
              <div className={styles.emptyCart}>
                <ShoppingCart size={48} className={styles.emptyIcon} />
                <p>Keranjang Anda masih kosong</p>
                <button className={styles.btnPrimary} onClick={() => navigate('/')}>Mulai Menjelajah</button>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {cartItems.map((item) => (
                  <div key={item.id} className={styles.cartItem}>
                    <img src={item.image} alt={item.name} className={styles.itemImage} />
                    
                    <div className={styles.itemDetails}>
                      <div className={styles.itemHeader}>
                        <span className={styles.itemType}>{item.type}</span>
                        <span className={styles.itemLocation}>{item.location}</span>
                      </div>
                      <h3 className={styles.itemName}>{item.name}</h3>
                      
                      {item.addons.length > 0 && (
                        <div className={styles.itemAddons}>
                          <p className={styles.addonsLabel}>Tambahan:</p>
                          <ul>
                            {item.addons.map((addon, idx) => (
                              <li key={idx}>+ {addon.name} (Rp {addon.price.toLocaleString('id-ID')})</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className={styles.itemActions}>
                        <div className={styles.qtySelector}>
                          <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, -1)}>
                            <Minus size={14} />
                          </button>
                          <span className={styles.qtyValue}>{item.quantity}</span>
                          <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, 1)}>
                            <Plus size={14} />
                          </button>
                        </div>
                        
                        <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>
                          <Trash2 size={16} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className={styles.itemPricing}>
                      <div className={styles.itemPrice}>
                        Rp {item.price.toLocaleString('id-ID')} <span>/ item</span>
                      </div>
                      <div className={styles.itemTotal}>
                        Rp {((item.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity).toLocaleString('id-ID')}
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
              <h2 className={styles.summaryTitle}>Ringkasan Pesanan</h2>
              
              <div className={styles.summaryRow}>
                <span>Subtotal ({cartItems.length} item)</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Pajak & Biaya (11%)</span>
                <span>Rp {taxes.toLocaleString('id-ID')}</span>
              </div>
              
              <div className={styles.divider}></div>
              
              <div className={styles.totalRow}>
                <span>Total Biaya</span>
                <span className={styles.finalTotal}>Rp {total.toLocaleString('id-ID')}</span>
              </div>
              
              <button 
                className={styles.checkoutBtn} 
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
              >
                <CreditCard size={18} />
                Lanjutkan ke Pembayaran
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
      <footer className={styles.globalFooter}>
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
