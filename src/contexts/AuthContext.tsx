import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../../supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: 'customer' | 'admin' | 'vendor' | null;
  isAdmin: boolean;
  isVendor: boolean;
  isLoading: boolean;
  isRecovering: boolean;
  setIsRecovering: (value: boolean) => void;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<'customer' | 'admin' | 'vendor' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setRole(data.role);
      } else {
        setRole('customer');
      }
    } catch (error) {
      setRole('customer');
    }
  };

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Platform.OS === 'web' ? window.location.origin : 'com.mokshajewels://reset-password',
    });
  };

  useEffect(() => {
    let mounted = true;

    // Fast Initial Load: Just check if we have a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // CRITICAL: Stop the loading screen NOW
      setIsLoading(false);

      // Fetch the detailed role in the background
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUserRole(newSession?.user?.id || '');
      } else if (event === 'SIGNED_OUT') {
        setRole(null);
      } else if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }
      
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setRole(null);
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      role, 
      isAdmin: role === 'admin', 
      isVendor: role === 'vendor',
      isLoading, 
      isRecovering,
      setIsRecovering,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
