import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../app/providers/AuthContext';

// Tambahkan definisi tipe TypeScript untuk Midtrans Snap
declare global {
  interface Window {
    snap: any;
  }
}
import {
  ShoppingCart, Mail, CreditCard,
  MapPin,
  Users,
  ChevronRight,
  AlertTriangle,
  Shield,
  Zap,
  CheckCircle2
} from 'lucide-react';
import styles from './CheckoutPage.module.css';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';

const TOTAL_SECONDS = 15 * 60; // 15 minutes

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  // Countdown timer
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  useEffect(() => {
    if (secondsLeft <= 0) {
      navigate('/payment-status?status=expired');
      return;
    }
    const t = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft, navigate]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');
  const progressPct = ((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100;

  // Customer form
  const [form, setForm] = useState({ 
    name: user?.nama_lengkap ?? '', 
    phone: (user as any)?.no_hp ?? '', 
    email: user?.email ?? '', 
  });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(er => ({ ...er, [e.target.name]: '' }));
  }, []);

  const validate = () => {
    const newErr: Record<string, string> = {};
    if (!form.name.trim()) newErr.name = 'Nama wajib diisi';
    if (!form.phone.trim()) newErr.phone = 'No. HP wajib diisi';
    if (!form.email.trim() || !form.email.includes('@')) newErr.email = 'Email tidak valid';
    if (!agreed) newErr.agreed = 'Harap setujui syarat & ketentuan';
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!validate()) return;
    
    // Pastikan ada produk di keranjang
    if (!cartItems.length) {
      alert("Keranjang Anda kosong!");
      return;
    }

    localStorage.setItem('divexplore_customer', JSON.stringify(form));

    try {
      setIsProcessing(true);

      // Siapkan payload sesuai spesifikasi Backend POST /api/orders
      const payload = {
        items: cartItems.map((item: any) => ({
          product_id: item.product_id,
          qty: item.quantity,
          addon_ids: (item.addon_ids && item.addon_ids.length > 0) ? item.addon_ids : undefined,
          // Kirim metadata tanggal (booking_date, check_in, check_out)
          booking_date: item.booking_date,
          check_in: item.check_in,
          check_out: item.check_out
        })),
        user_info: {
          nama: form.name,
          no_hp: form.phone,
          email: form.email
        }
      };

      // 1. Tembak API Backend untuk membuat pesanan
      const response = await api.post('/api/orders', payload);
      
      const snapToken = response.data?.snap_token;
      const orderData = response.data?.order;
      
      if (!snapToken) throw new Error("Gagal mendapatkan token pembayaran dari Midtrans.");

      // 2. Simpan data penting ke localStorage agar bisa diakses di halaman pembayaran
      localStorage.setItem('divexplore_last_snap_token', snapToken);
      if (orderData) {
        localStorage.setItem('divexplore_last_order_data', JSON.stringify(orderData));
      }

      // 3. Bersihkan keranjang
      localStorage.removeItem('divexplore_cart');
      localStorage.removeItem('divexplore_cart_direct');
      window.dispatchEvent(new Event('cartUpdated'));

      // 4. Redirect ke halaman Pembayaran (Langkah 3)
      // Kita beri flag auto_pay=true agar halaman tujuan tahu harus buka pop-up otomatis
      navigate('/payment-status?status=pending&auto_pay=true');

    } catch (error: any) {
      alert("Gagal memproses pesanan: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Order data from localStorage
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isDirect = params.get('type') === 'direct';
    const key = isDirect ? 'divexplore_cart_direct' : 'divexplore_cart';

    const saved = localStorage.getItem(key);
    if (saved) {
      setCartItems(JSON.parse(saved));
    }
  }, []);

  // Hitung total dari SEMUA item di keranjang (bukan hanya firstItem)
  const calculateCartTotal = () => {
    return cartItems.reduce((total: number, item: any) => {
      const itemSubtotal = item.price * item.quantity;
      const addonsSubtotal = (item.addons || []).reduce(
        (sum: number, a: any) => sum + (a.price * item.quantity), 0
      );
      return total + itemSubtotal + addonsSubtotal;
    }, 0);
  };

  const total = calculateCartTotal();

  return (
    <div className={styles.container}>
      {/* Timer Bar */}
      <div className={styles.timerBar}>
        <div className={styles.timerLeft}>
          <AlertTriangle size={14} className={styles.timerIcon} />
          Selesaikan pembayaran dalam
        </div>
        <div className={`${styles.timerCount} ${secondsLeft < 120 ? styles.timerUrgent : ''}`}>
          {minutes}:{seconds}
        </div>
        <div className={styles.timerRight}>
          Pesanan akan dibatalkan jika waktu habis
        </div>
        <div className={styles.timerProgress} style={{ width: `${progressPct}%` }} />
      </div>

      {/* Header */}
      <Header />

      {/* Steps */}
      <div className={styles.stepsBar}>
        <div className={styles.step}>
          <div className={`${styles.stepCircle} ${styles.stepDone}`}>
            <CheckCircle2 size={16} />
          </div>
          <span className={styles.stepLabel}>Keranjang</span>
        </div>
        <div className={`${styles.stepLine} ${styles.stepLineDone}`} />
        <div className={styles.step}>
          <div className={`${styles.stepCircle} ${styles.stepActive}`}>2</div>
          <span className={`${styles.stepLabel} ${styles.stepLabelActive}`}>Checkout</span>
        </div>
        <div className={styles.stepLine} />
        <div className={styles.step}>
          <div className={styles.stepCircle}>3</div>
          <span className={styles.stepLabel}>Pembayaran</span>
        </div>
      </div>

      {/* Main Layout */}
      <main className={styles.mainContent}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          {/* Order Summary */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <ShoppingCart size={18} />
              Ringkasan Pesanan ({cartItems.length} item)
            </div>

            {cartItems.map((item: any, idx: number) => (
              <div key={idx} className={styles.orderItem} style={{ borderBottom: idx < cartItems.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', paddingBottom: '1.25rem', marginBottom: idx < cartItems.length - 1 ? '1.25rem' : 0 }}>
                <img
                  src={item.image}
                  alt={item.name}
                  className={styles.orderImg}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80'; }}
                />
                <div className={styles.orderInfo}>
                  <h3 className={styles.orderName}>{item.name}</h3>
                  <div className={styles.orderMeta}>
                    <span>{item.type}</span>
                    <span className={styles.dot}>•</span>
                    <MapPin size={12} />
                    <span>{item.location}</span>
                  </div>
                  <div className={styles.orderDetails}>
                    <span><Users size={12} /> {item.quantity} Orang</span>
                    {item.check_in ? (
                      <span className={styles.dateInfo}>
                        <CreditCard size={12} style={{ transform: 'rotate(-90deg)' }} /> 
                        {new Date(item.check_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(item.check_out).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    ) : item.booking_date ? (
                      <span className={styles.dateInfo}>
                        <CreditCard size={12} style={{ transform: 'rotate(-90deg)' }} /> 
                        {new Date(item.booking_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    ) : null}
                  </div>
                  {(item.addons || []).length > 0 && (
                    <div className={styles.addonTags} style={{ marginTop: '0.5rem' }}>
                      {item.addons.map((a: any, ai: number) => (
                        <span key={ai} className={styles.addonTag}>
                          + {a.name} (Rp {a.price.toLocaleString('id-ID')})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className={styles.subtotalRow}>
              <span>Subtotal</span>
              <span className={styles.subtotalVal}>Rp {total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Customer Info */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <Users size={18} />
              Informasi Pemesan
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nama Pemesan <span className={styles.req}>*</span></label>
                <div className={styles.inputIcon}>
                  <Users size={14} className={styles.inputIco} />
                  <input
                    name="name"
                    className={`${styles.input} ${errors.name ? styles.inputErr : ''}`}
                    placeholder="Masukkan nama lengkap"
                    value={form.name}
                    onChange={handleInput}
                  />
                </div>
                {errors.name && <p className={styles.errMsg}>{errors.name}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>No. HP <span className={styles.req}>*</span></label>
                <div className={styles.phoneWrapper}>
                  <span className={styles.phonePrefix}>+62</span>
                  <input
                    name="phone"
                    className={`${styles.inputPhone} ${errors.phone ? styles.inputErr : ''}`}
                    placeholder="81234567890"
                    value={form.phone}
                    onChange={handleInput}
                  />
                </div>
                {errors.phone && <p className={styles.errMsg}>{errors.phone}</p>}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email Konfirmasi <span className={styles.req}>*</span></label>
              <div className={styles.inputIcon}>
                <span className={styles.inputIco} style={{ fontSize: '14px' }}><Mail size={14} /></span>
                <input
                  name="email"
                  type="email"
                  className={`${styles.input} ${errors.email ? styles.inputErr : ''}`}
                  placeholder="email@contoh.com"
                  value={form.email}
                  onChange={handleInput}
                />
              </div>
              {errors.email && <p className={styles.errMsg}>{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightCol}>
          {/* Cost Summary */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <ChevronRight size={18} />
              Ringkasan Biaya
            </div>
            <div className={styles.costRows}>
              {cartItems.map((item: any, idx: number) => {
                const itemBase = item.price * item.quantity;
                return (
                  <div key={`group-${idx}`} className={styles.costGroup}>
                    <div className={styles.costRow}>
                      <span className={styles.itemName}>{item.name} ({item.quantity}×)</span>
                      <span className={styles.itemPrice}>Rp {itemBase.toLocaleString('id-ID')}</span>
                    </div>
                    {(item.addons || []).map((a: any, ai: number) => (
                      <div key={`addon-${idx}-${ai}`} className={styles.costRowAddon}>
                        <span className={styles.addonName}>{a.name} ({item.quantity}×)</span>
                        <span className={styles.addonPrice}>Rp {(a.price * item.quantity).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className={styles.totalRow}>
              <span>TOTAL</span>
              <span className={styles.totalVal}>Rp {total.toLocaleString('id-ID')}</span>
            </div>

            <label className={styles.agreeRow}>
              <input
                type="checkbox"
                className={styles.agreeCheck}
                checked={agreed}
                onChange={e => { setAgreed(e.target.checked); setErrors(er => ({ ...er, agreed: '' })); }}
              />
              <span>
                Saya setuju dengan <a href="#" className={styles.agreeLink}>syarat & ketentuan pemesanan</a>
              </span>
            </label>
            {errors.agreed && <p className={styles.errMsg}>{errors.agreed}</p>}

            <button 
              className={styles.confirmBtn} 
              onClick={handleSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? 'Memproses Midtrans...' : 'Konfirmasi & Bayar'}
            </button>
            <button 
              className={styles.cancelBtn} 
              onClick={() => navigate('/catalog')}
              disabled={isProcessing}
            >
              Batal & Kembali ke Katalog
            </button>
            <p className={styles.mitraNote}>Anda akan diarahkan ke halaman pembayaran aman Midtrans</p>

            <div className={styles.securityBadges}>
              <span className={styles.badge}><Shield size={12} /> SSL Secured</span>
              <span className={styles.badge}><Zap size={12} /> Midtrans</span>
              <span className={styles.badge}><CheckCircle2 size={12} /> 100% Safe</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
