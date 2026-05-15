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
  CheckCircle2,
  Tag,
  Calendar,
  ShoppingCart,
  MapPin,
  Users,
  Mail,
  ChevronRight,
  Shield,
  Zap
} from 'lucide-react';
import styles from './CheckoutPage.module.css';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import Swal from 'sweetalert2';



export default function CheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);



  // Customer form
  const [form, setForm] = useState({ 
    name: user?.nama_lengkap ?? '', 
    phone: user?.nomor_telepon ?? '', 
    email: user?.email ?? '',
    promo: ''
  });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Filter khusus nomor HP: hanya boleh angka
    let cleanValue = value;
    if (name === 'phone') {
      cleanValue = value.replace(/\D/g, '');
    }

    setForm(f => ({ ...f, [name]: cleanValue }));
    setErrors(er => ({ ...er, [name]: '' }));
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

  const handleConfirm = async () => {
    // PENGAMAN KRUSIAL: Tolak jika sedang proses (Cegah Error 429)
    if (isProcessing) return;
    
    if (!validate()) return;
    
    // Pastikan ada produk di keranjang
    if (!cartItems.length) {
      alert("Keranjang Anda kosong!");
      return;
    }

    // Update data customer di localStorage TANPA menghapus data profil asli (seperti foto)
    const existingCustomer = JSON.parse(localStorage.getItem('divexplore_customer') || '{}');
    const updatedCustomer = { ...existingCustomer, ...form, nomor_telepon: form.phone };
    localStorage.setItem('divexplore_customer', JSON.stringify(updatedCustomer));

    // BERSIHKAN cache pembayaran lama agar tidak tertukar (BNI/BCA)
    localStorage.removeItem('divexplore_last_payment');

    try {
      setIsProcessing(true);

      // Siapkan payload sesuai spesifikasi Backend POST /api/orders
      const payload = {
        items: cartItems.map((item: any) => ({
          product_id: item.product_id,
          qty: item.quantity,
          addon_ids: (item.addon_ids && item.addon_ids.length > 0) ? item.addon_ids : undefined,
          // Kirim metadata tanggal (booking_date, check_in, check_out)
          booking_date: item.visitDate || item.booking_date,
          check_in: item.checkIn || item.check_in,
          check_out: item.checkOut || item.check_out
        })),
        kode_promo: form.promo,
        user_info: {
          nama: form.name,
          nomor_telepon: form.phone,
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
      Swal.fire({
        icon: 'error',
        title: 'Gagal memproses pesanan',
        text: error.response?.data?.message || error.message,
        confirmButtonColor: '#ef4444',
        background: '#1e293b',
        color: '#f8fafc'
      });
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

  const calculateNights = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  // Hitung total dari SEMUA item di keranjang (bukan hanya firstItem)
  const calculateCartTotal = () => {
    return cartItems.reduce((total: number, item: any) => {
      const isAkomodasi = item.type.toLowerCase().includes('akomodasi') || item.type.toLowerCase().includes('homestay');
      const nights = isAkomodasi ? calculateNights(item.check_in, item.check_out) : 1;
      
      const itemSubtotal = item.price * item.quantity * nights;
      const addonsSubtotal = (item.addons || []).reduce(
        (sum: number, a: any) => sum + (a.price * item.quantity), 0
      );
      return total + itemSubtotal + addonsSubtotal;
    }, 0);
  };

  const total = calculateCartTotal();

  return (
    <div className={styles.container}>


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
                    <span><Users size={12} /> {item.quantity} {item.type.toLowerCase().includes('akomodasi') ? 'Kamar' : 'Orang'}</span>
                    {(item.checkIn || item.check_in) ? (
                      <span className={styles.dateInfo}>
                        <Calendar size={12} /> 
                        {new Date(item.checkIn || item.check_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(item.checkOut || item.check_out).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    ) : (item.visitDate || item.booking_date) ? (
                      <span className={styles.dateInfo}>
                        <Calendar size={12} /> 
                        {new Date(item.visitDate || item.booking_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    ) : null}
                  </div>
                  <div className={styles.vendorNotice}>
                    Disediakan oleh: <strong>{item.vendor_name || 'Vendor Terverifikasi'}</strong>
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
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
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
              <div className={styles.summaryRow}>
                <span>Total Harga ({cartItems.length} item)</span>
                <span>Rp {cartItems.reduce((acc, item) => acc + (item.price * item.quantity * (item.type.toLowerCase().includes('akomodasi') ? calculateNights(item.check_in, item.check_out) : 1)), 0).toLocaleString('id-ID')}</span>
              </div>
              
              <div className={styles.summaryRow}>
                <span>Layanan Tambahan</span>
                <span>Rp {cartItems.reduce((acc, item) => acc + (item.addons?.reduce((s: number, a: any) => s + a.price, 0) * item.quantity || 0), 0).toLocaleString('id-ID')}</span>
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

              <div className={styles.promoGroup}>
                <label className={styles.labelSmall}>Punya Kode Promo?</label>
                <div className={styles.promoInputWrapper}>
                  <Tag size={14} className={styles.promoIcon} />
                  <input 
                    name="promo"
                    className={styles.promoInput} 
                    placeholder="Masukkan kode"
                    value={form.promo}
                    onChange={handleInput}
                  />
                  <button className={styles.promoBtn}>Pakai</button>
                </div>
              </div>
            </div>

            <div className={styles.totalRow}>
              <div className={styles.totalLabelGroup}>
                <span className={styles.totalMainLabel}>Total Pembayaran</span>
              </div>
              <div className={styles.finalTotal}>Rp {total.toLocaleString('id-ID')}</div>
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
              onClick={handleConfirm}
              disabled={isProcessing || cartItems.length === 0}
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
