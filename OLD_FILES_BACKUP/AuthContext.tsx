import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, SessionData } from '../utils/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: SessionData | null;
  login: (password: string, stayLoggedIn?: boolean) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const session = authService.getSession();
      if (session) {
        setIsAuthenticated(true);
        setUser(session);
      }
      setLoading(false);
    };

    initAuth();

    // Listen for session expiration
    const handleSessionExpired = () => {
      logout();
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // Update activity every minute
      const interval = setInterval(() => {
        const session = authService.getSession();
        if (!session) {
          logout();
        } else {
          authService.updateActivity();
        }
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const login = async (password: string, stayLoggedIn: boolean = false): Promise<boolean> => {
    try {
      const success = await authService.authenticate(password, stayLoggedIn);
      
      if (success) {
        const session = authService.getSession();
        if (session) {
          setUser(session);
          setIsAuthenticated(true);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.clearSession();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};