import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase config:', { supabaseUrl, hasAnonKey: !!supabaseAnonKey });

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isLegacyAuth: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithProvider: (provider: 'google' | 'github' | 'linkedin') => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  // Legacy auth compatibility
  legacySignIn: (username: string, password: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLegacyAuth, setIsLegacyAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    const initializeAuth = async () => {
      try {
        // First check Supabase session
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setSession(session);
            setUser(session.user);
            setIsLegacyAuth(false);
          } else {
            // Check for legacy JWT token
            const token = localStorage.getItem('authToken');
            if (token) {
              await checkLegacyAuth(token);
            }
          }
        } else {
          // Check for legacy JWT token if Supabase is not configured
          const token = localStorage.getItem('authToken');
          if (token) {
            await checkLegacyAuth(token);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes if Supabase is configured
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLegacyAuth(false);
        
        if (!session) {
          // Clear any legacy tokens when Supabase session ends
          localStorage.removeItem('authToken');
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const checkLegacyAuth = async (token: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser({
          id: data.user.id,
          email: data.user.email || `${data.user.username}@legacy.local`,
          user_metadata: {
            username: data.user.username,
            isLegacy: true
          }
        } as any);
        setIsLegacyAuth(true);
        
        // Show migration prompt if needed
        if (data.needsMigration) {
          showMigrationPrompt();
        }
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Legacy auth check failed:', error);
      localStorage.removeItem('authToken');
    }
  };

  const showMigrationPrompt = () => {
    // You can implement a modal or notification here
    console.log('🔄 Account migration available. Please update your password to enable new features.');
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (!supabase) {
        // Fall back to legacy auth if Supabase is not configured
        return await legacySignIn(email, password);
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signInWithProvider = async (provider: 'google' | 'github' | 'linkedin') => {
    try {
      if (!supabase) {
        throw new Error('Social login is not configured');
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('OAuth sign in error:', error);
      throw error;
    }
  };

  const legacySignIn = async (username: string, password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store legacy token
      localStorage.setItem('authToken', data.token);
      
      // Set user data
      setUser({
        id: data.user.id,
        email: data.user.email || `${username}@legacy.local`,
        user_metadata: {
          username: data.user.username,
          isLegacy: true
        }
      } as any);
      setIsLegacyAuth(true);

      // Prompt for migration
      if (!data.user.supabase_id) {
        showMigrationPrompt();
      }

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      if (!supabase) {
        return { error: 'Sign up is not available. Please contact administrator.' };
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;

      // Also create user in legacy system for backward compatibility
      if (data.user) {
        await createLegacyUser(data.user.id, email, metadata?.username);
      }

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const createLegacyUser = async (supabaseId: string, email: string, username?: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/create-legacy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supabase_id: supabaseId,
          email,
          username: username || email.split('@')[0],
        }),
      });
    } catch (error) {
      console.error('Failed to create legacy user:', error);
    }
  };

  const signOut = async () => {
    try {
      if (isLegacyAuth) {
        // Clear legacy auth
        localStorage.removeItem('authToken');
        setUser(null);
        setIsLegacyAuth(false);
      } else if (supabase) {
        // Supabase sign out
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      
      navigate('/login');
    } catch (error: any) {
      console.error('Sign out error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      if (!supabase) {
        return { error: 'Password reset is not available. Please contact administrator.' };
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      if (!supabase) {
        return { error: 'Password update is not available. Please contact administrator.' };
      }
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // If legacy user, mark as migrated
      if (isLegacyAuth && user) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/auth/complete-migration`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
      }

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const value = {
    user,
    session,
    loading,
    isLegacyAuth,
    signIn,
    signInWithProvider,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    legacySignIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Auth callback component for OAuth redirects
export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (supabase) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
          navigate('/');
        } else {
          console.error('Supabase is not configured');
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      }
    };
    
    handleCallback();
  }, [navigate]);
  
  return <div>Completing sign in...</div>;
};