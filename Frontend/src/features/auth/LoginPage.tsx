import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
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

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setHasError(true);
      return;
    }
    setIsLoading(true);
    const success = await loginWithGoogle(credentialResponse.credential);
    setIsLoading(false);
    
    if (success) {
      navigate('/');
    } else {
      setHasError(true);
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

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  console.error('Login Failed');
                  setHasError(true);
                }}
                useOneTap
                theme="outline"
                text="signin_with"
                shape="rectangular"
              />
            </div>

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
