import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../utils/authService';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  console.log('AuthProvider rendering...');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider useEffect running...');
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

  const login = async (password, stayLoggedIn = false) => {
    const success = await authService.authenticate(password, stayLoggedIn);
    if (success) {
      const session = authService.getSession();
      setIsAuthenticated(true);
      setUser(session);
    }
    return success;
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};