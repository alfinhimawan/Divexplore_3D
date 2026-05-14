import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../../utils/api';

interface User {
  nama_lengkap: string;
  email: string;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  // Cek token saat pertama kali web dibuka
  useEffect(() => {
    const token = localStorage.getItem('divexplore_token');
    const customer = localStorage.getItem('divexplore_customer');
    if (token) {
      setIsAuthenticated(true);
      if (customer) {
        setUser(JSON.parse(customer));
      }
    }
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
    setIsAuthenticated(false);
    setUser(null);
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
