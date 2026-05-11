import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import {
  Box,
  ShoppingCart,
  CreditCard,
  Smartphone,
  Building2,
  MapPin,
  Calendar,
  Users,
  Star,
  Lock,
  ChevronRight,
  AlertTriangle,
  Shield,
  Zap,
  CheckCircle2
} from 'lucide-react';
import styles from './CheckoutPage.module.css';
import Header from '../../components/common/Header';

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

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'ewallet' | 'bank' | 'card' | 'onsite'>('ewallet');
  const [eWalletOption, setEWalletOption] = useState<'gopay' | 'ovo' | 'dana'>('gopay');
  const [bankOption, setBankOption] = useState<'bca' | 'mandiri' | 'bni'>('bca');

  // Customer form
  const [form, setForm] = useState({ name: user?.name ?? '', phone: '', email: user?.email ?? '', notes: '' });
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

  const handleSubmit = () => {
    if (!validate()) return;
    localStorage.setItem('divexplore_customer', JSON.stringify(form));
    navigate('/payment-status?status=pending');
  };

  // Order data from localStorage
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('divexplore_cart');
    if (saved) {
      setCartItems(JSON.parse(saved));
    }
  }, []);

  const firstItem = cartItems[0] || {
    name: 'Gili Trawangan Snorkeling Experience',
    type: 'Snorkeling',
    location: 'Gili Trawangan, Lombok',
    price: 350000,
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80',
    addons: [
      { name: 'Peralatan Snorkel', price: 75000 },
    ]
  };

  const order = {
    image: firstItem.image,
    name: firstItem.name,
    category: firstItem.type,
    location: firstItem.location,
    date: 'Sabtu, 14 Juni 2026',
    people: firstItem.quantity,
    rating: 4.9,
    addons: firstItem.addons.map((a: any) => ({ label: a.name, price: a.price * firstItem.quantity })),
    basePrice: firstItem.price * firstItem.quantity,
  };

  const addonTotal = order.addons.reduce((s: number, a: any) => s + a.price, 0);
  const subtotal = order.basePrice + addonTotal;
  const taxes = subtotal * 0.11;
  const total = subtotal + taxes;

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
              Ringkasan Pesanan
            </div>
            <div className={styles.orderItem}>
              <img src={order.image} alt={order.name} className={styles.orderImg} />
              <div className={styles.orderInfo}>
                <h3 className={styles.orderName}>{order.name}</h3>
                <div className={styles.orderMeta}>
                  <span>{order.category}</span>
                  <span className={styles.dot}>•</span>
                  <MapPin size={12} />
                  <span>{order.location}</span>
                </div>
                <div className={styles.orderDetails}>
                  <span><Calendar size={12} /> {order.date}</span>
                  <span><Users size={12} /> {order.people} Orang</span>
                </div>
                <div className={styles.ratingBadge}>
                  <Star size={12} fill="#f59e0b" color="#f59e0b" />
                  <span>{order.rating}</span>
                </div>
              </div>
            </div>

            {order.addons.length > 0 && (
              <div className={styles.addonsSection}>
                <p className={styles.addonsLabel}>Tambahan:</p>
                <div className={styles.addonTags}>
                  {order.addons.map((a: any, i: number) => (
                    <span key={i} className={styles.addonTag}>{a.label} +Rp {a.price.toLocaleString('id-ID')}</span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.subtotalRow}>
              <span>Subtotal</span>
              <span className={styles.subtotalVal}>Rp {subtotal.toLocaleString('id-ID')}</span>
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
                <span className={styles.inputIco} style={{ fontSize: '14px' }}>✉</span>
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
            <div className={styles.formGroup}>
              <label className={styles.label}>Catatan Tambahan <span className={styles.opt}>(opsional)</span></label>
              <textarea
                name="notes"
                className={styles.textarea}
                placeholder="Permintaan khusus, alergi, dll."
                value={form.notes}
                onChange={handleInput}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightCol}>
          {/* Payment Method */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <CreditCard size={18} />
              Metode Pembayaran
            </div>

            {/* E-Wallet */}
            <div
              className={`${styles.payMethod} ${paymentMethod === 'ewallet' ? styles.payActive : ''}`}
              onClick={() => setPaymentMethod('ewallet')}
            >
              <div className={styles.payRadio}>
                <div className={`${styles.radioCircle} ${paymentMethod === 'ewallet' ? styles.radioActive : ''}`} />
              </div>
              <div className={styles.payInfo}>
                <div className={styles.payLabel}><Smartphone size={16} /> E-Wallet</div>
                {paymentMethod === 'ewallet' && (
                  <div className={styles.subOptions}>
                    {(['gopay', 'ovo', 'dana'] as const).map(w => (
                      <button
                        key={w}
                        className={`${styles.walletBtn} ${eWalletOption === w ? styles.walletActive : ''}`}
                        onClick={e => { e.stopPropagation(); setEWalletOption(w); }}
                      >
                        {w === 'gopay' ? (
                          <img src="https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg" alt="GoPay" style={{ height: '18px', objectFit: 'contain' }} />
                        ) : w === 'ovo' ? (
                          <img src="https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg" alt="OVO" style={{ height: '18px', objectFit: 'contain' }} />
                        ) : (
                          <img src="https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg" alt="DANA" style={{ height: '18px', objectFit: 'contain' }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Transfer Bank */}
            <div
              className={`${styles.payMethod} ${paymentMethod === 'bank' ? styles.payActive : ''}`}
              onClick={() => setPaymentMethod('bank')}
            >
              <div className={styles.payRadio}>
                <div className={`${styles.radioCircle} ${paymentMethod === 'bank' ? styles.radioActive : ''}`} />
              </div>
              <div className={styles.payInfo}>
                <div className={styles.payLabel}><Building2 size={16} /> Transfer Bank</div>
                {paymentMethod === 'bank' && (
                  <div className={styles.subOptions}>
                    {(['bca', 'mandiri', 'bni'] as const).map(b => (
                      <button
                        key={b}
                        className={`${styles.walletBtn} ${bankOption === b ? styles.walletActive : ''}`}
                        onClick={e => { e.stopPropagation(); setBankOption(b); }}
                      >
                        {b.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Kartu */}
            <div
              className={`${styles.payMethod} ${paymentMethod === 'card' ? styles.payActive : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <div className={styles.payRadio}>
                <div className={`${styles.radioCircle} ${paymentMethod === 'card' ? styles.radioActive : ''}`} />
              </div>
              <div className={styles.payInfo}>
                <div className={styles.payLabel}><CreditCard size={16} /> Kartu Kredit / Debit</div>
                <div className={styles.paySubLabel}>Visa, Mastercard</div>
              </div>
            </div>

            {/* Bayar di Tempat */}
            <div
              className={`${styles.payMethod} ${paymentMethod === 'onsite' ? styles.payActive : ''}`}
              onClick={() => setPaymentMethod('onsite')}
            >
              <div className={styles.payRadio}>
                <div className={`${styles.radioCircle} ${paymentMethod === 'onsite' ? styles.radioActive : ''}`} />
              </div>
              <div className={styles.payInfo}>
                <div className={styles.payLabel}><MapPin size={16} /> Bayar di Tempat</div>
                <div className={styles.paySubLabel}>Bayar saat tiba di lokasi</div>
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <ChevronRight size={18} />
              Ringkasan Biaya
            </div>
            <div className={styles.costRows}>
              <div className={styles.costRow}>
                <span>{order.name} ({order.people}×)</span>
                <span>Rp {order.basePrice.toLocaleString('id-ID')}</span>
              </div>
              {order.addons.map((a: any, i: number) => (
                <div key={i} className={styles.costRow}>
                  <span>{a.label}</span>
                  <span>Rp {a.price.toLocaleString('id-ID')}</span>
                </div>
              ))}
              <div className={styles.costRow}>
                <span>Pajak & Biaya (11%)</span>
                <span>Rp {taxes.toLocaleString('id-ID')}</span>
              </div>
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

            <button className={styles.confirmBtn} onClick={handleSubmit}>
              <Lock size={16} />
              Konfirmasi & Bayar
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

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <Box size={20} className={styles.logoIcon} />
              <span>DIVEXPLORE-3D</span>
            </div>
            <p>Platform Wisata Bahari 3D #1 Indonesia</p>
          </div>
          <div className={styles.footerLinks}>
            <div>
              <h4>DESTINASI</h4>
              <a href="#">Raja Ampat</a>
              <a href="#">Bunaken</a>
            </div>
            <div>
              <h4>TENTANG</h4>
              <a href="#">Manifesto</a>
              <a href="#">Tim Kami</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2025 DIVEXPLORE-3D. All rights reserved.</span>
          <div className={styles.socialIcons}>
            <span>IG</span>
            <span>TW</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
