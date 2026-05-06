import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, pass: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simple validation simulation
    if (email && pass) {
      setIsAuthenticated(true);
      setUser({
        name: 'Wisatawan Satu',
        email: email,
        avatar: 'https://i.pravatar.cc/150?img=11'
      });
      return true;
    }
    return false;
  };

  const loginWithGoogle = async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsAuthenticated(true);
    setUser({
      name: 'Wisatawan Google',
      email: 'wisatawan@google.com',
      avatar: 'https://i.pravatar.cc/150?img=11'
    });
    return true;
  };

  const logout = () => {
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
