import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, Session, User, AuthError } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { setUser as setSentryUser } from '../utils/sentry';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: AuthError | null }>;
  signInWithProvider: (provider: 'google' | 'github' | 'linkedin') => Promise<{ error?: AuthError | null }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error?: AuthError | null }>;
  signOut: () => Promise<{ error?: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error?: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error?: AuthError | null }>;
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
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Set Sentry user context
      if (session?.user) {
        setSentryUser({
          id: session.user.id,
          email: session.user.email || undefined,
        });
      } else {
        setSentryUser(null);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Update Sentry user context
      if (session?.user) {
        setSentryUser({
          id: session.user.id,
          email: session.user.email || undefined,
        });
      } else {
        setSentryUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Normalize Gmail addresses to match Supabase Auth behavior
      // Gmail ignores dots in email addresses, so we need to remove them for Gmail domains
      let normalizedEmail = email.toLowerCase();
      if (normalizedEmail.endsWith('@gmail.com')) {
        const [localPart, domain] = normalizedEmail.split('@');
        // Remove dots from the local part of Gmail addresses
        normalizedEmail = localPart.replace(/\./g, '') + '@' + domain;
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      
      if (!error && data.session) {
        navigate('/');
      }
      
      return { error };
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  const signInWithProvider = async (provider: 'google' | 'github' | 'linkedin') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      return { error };
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      
      return { error };
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        navigate('/login');
      }
      return { error };
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      return { error };
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      return { error };
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signInWithProvider,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};