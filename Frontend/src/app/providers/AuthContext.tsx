import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../../utils/api';

interface User {
  nama_lengkap: string;
  email: string;
  nomor_telepon?: string;
  foto_profil_url?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inisialisasi state LANGSUNG dari localStorage agar tidak ada jeda saat refresh
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('divexplore_token');
  });
  
  const [user, setUser] = useState<User | null>(() => {
    const customer = localStorage.getItem('divexplore_customer');
    return customer ? JSON.parse(customer) : null;
  });

  // Verifikasi Sesi ke Backend saat pertama kali aplikasi dibuka (Ghost Hunter Logic)
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('divexplore_token');
      if (token) {
        try {
          // Panggil API profil untuk cek apakah user masih ada di DB
          const res = await api.get('/api/auth/me');
          const userData = res.user || res.data?.user;
          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
            // Update cache profil di localStorage agar selalu fresh
            localStorage.setItem('divexplore_customer', JSON.stringify(userData));
          }
        } catch (err: any) {
          console.warn("[AuthContext] Sesi tidak valid atau User sudah dihapus dari DB.");
          // Jika gagal (401), langsung bersihkan semuanya
          logout();
        }
      }
    };
    
    verifySession();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      // Tembak API Login Backend yang asli
      const response = await api.post('/api/auth/login', { email, password: pass });
      
      const token = response.data.token;
      const userData = response.data.user;

      // Simpan Karcis (Token) ke brankas browser
      localStorage.setItem('divexplore_token', token);
      localStorage.setItem('divexplore_customer', JSON.stringify(userData)); // Simpan data user lengkap
      
      setIsAuthenticated(true);
      setUser(userData);
      return true;
    } catch (error: any) {
      console.error("Login gagal:", error.message);
      return false;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      const response = await api.post('/api/auth/google', { id_token: credential });
      
      const token = response.data.token;
      const userData = response.data.user;

      localStorage.setItem('divexplore_token', token);
      localStorage.setItem('divexplore_customer', JSON.stringify(userData));
      
      setIsAuthenticated(true);
      setUser(userData);
      return true;
    } catch (error: any) {
      console.error("Google Login gagal:", error.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('divexplore_token');
    localStorage.removeItem('divexplore_customer');
    setIsAuthenticated(false);
    setUser(null);
    // Redirect ke home agar bersih
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
