import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../app/providers/AuthContext';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setHasError(true);
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    
    const success = await login(email, password);
    setIsLoading(false);
    
    if (success) {
      navigate('/');
    } else {
      setHasError(true);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const success = await loginWithGoogle();
    setIsLoading(false);
    
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Side: Hero Image */}
      <div className={styles.leftSide}>
        <img 
          src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
          alt="Scuba diver surrounded by fish" 
          className={styles.heroImage}
        />
        <div className={styles.overlay}></div>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>Jelajahi Kedalaman Lautan Indonesia</h1>
          <p className={styles.heroDesc}>
            Platform pariwisata maritim terdepan. Temukan keajaiban bawah laut, terumbu karang, dan petualangan diving yang tak terlupakan.
          </p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className={styles.rightSide}>
        <div className={styles.formContainer}>
          <div className={styles.card}>
            <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Kembali">
              <ChevronLeft size={20} />
            </button>

            <div className={styles.header}>
              <h2 className={styles.greeting}>Halo! Wisatawan</h2>
              <h3 className={styles.title}>Selamat Datang Kembali</h3>
              <p className={styles.subtitle}>Masuk untuk melanjutkan petualangan maritim Anda.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Alamat Email</label>
                <div className={styles.inputWrapper}>
                  <input 
                    type="email" 
                    className={`${styles.input} ${hasError ? styles.error : ''}`} 
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (hasError) setHasError(false);
                    }}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Kata Sandi</label>
                <div className={styles.inputWrapper}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className={`${styles.input} ${hasError ? styles.error : ''}`} 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (hasError) setHasError(false);
                    }}
                  />
                  {showPassword ? (
                    <EyeOff 
                      size={18} 
                      className={styles.eyeIcon} 
                      onClick={() => setShowPassword(false)} 
                    />
                  ) : (
                    <Eye 
                      size={18} 
                      className={styles.eyeIcon} 
                      onClick={() => setShowPassword(true)} 
                    />
                  )}
                </div>
                <a href="#" className={styles.forgotPassword}>Lupa Kata Sandi?</a>
              </div>

              {hasError && (
                <div className={styles.errorBox}>
                  <AlertCircle size={16} />
                  <span>Email atau kata sandi salah. Silakan coba lagi.</span>
                </div>
              )}

              <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                {isLoading ? <Loader2 size={18} className={styles.spin} style={{margin: '0 auto', display: 'block'}} /> : 'Masuk'}
              </button>
              
              {hasError && (
                <p className={styles.lockWarning}>Akun akan terkunci setelah 5 percobaan gagal</p>
              )}
            </form>

            <div className={styles.divider}>
              <span>atau masuk dengan</span>
            </div>

            <button type="button" className={styles.googleBtn} onClick={handleGoogleLogin} disabled={isLoading}>
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Masuk dengan Google
            </button>

            <p className={styles.registerText}>
              Belum punya akun? <span className={styles.registerLink}>Daftar sekarang</span>
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <a href="#" className={styles.footerLink}>Syarat & Ketentuan</a>
          <a href="#" className={styles.footerLink}>Kebijakan Privasi</a>
          <a href="#" className={styles.footerLink}>Bantuan</a>
        </div>
      </div>
    </div>
  );
}
