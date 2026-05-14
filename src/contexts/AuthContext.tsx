import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
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
  verifyOtp: (email: string, token: string) => Promise<{ error: any }>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<{ data: any; error: any }>;
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
    const origin = Platform.OS === 'web' ? window.location.origin : 'mokshajewels://reset-password';
    // Ensure the origin is clean for Supabase (some dashboards expect trailing slash, some don't)
    // We'll use the origin as is, but log it for debugging
    console.log('Sending reset link with redirect to:', origin);
    
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: origin,
    });
  };

  const verifyOtp = async (email: string, token: string) => {
    console.log('AuthProvider: Verifying OTP for:', email);
    return await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    const origin = Platform.OS === 'web' 
      ? window.location.origin 
      : 'mokshajewels://login-callback';
    
    console.log(`AuthProvider: Initiating OAuth for ${provider} with redirect:`, origin);
    
    return await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: origin,
        skipBrowserRedirect: Platform.OS !== 'web',
      },
    });
  };

  useEffect(() => {
    let mounted = true;
    console.log('AuthProvider: Initializing...');

    // Handle Auth errors from URL hash (common in password reset failures)
    if (Platform.OS === 'web' && window.location.hash) {
      const hash = window.location.hash;
      console.log('AuthProvider: Detected hash:', hash);
      if (hash.includes('error=')) {
        const params = new URLSearchParams(hash.replace('#', '?'));
        const errorDesc = params.get('error_description');
        if (errorDesc) {
          const message = errorDesc.replace(/\+/g, ' ');
          console.log('AuthProvider: Auth error detected in hash:', message);
          
          if (Platform.OS === 'web') {
            window.alert('Authentication Error: ' + message);
          } else {
            Alert.alert('Authentication Error', message);
          }
          
          // Clear the hash from the URL
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    }

    // Fast Initial Load: Just check if we have a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      console.log('AuthProvider: Initial session:', session?.user?.email || 'none');
      
      setSession(session);
      setUser(session?.user ?? null);
      
      setIsLoading(false);

      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      console.log('AuthProvider: Auth State Change Event:', event);

      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUserRole(newSession?.user?.id || '');
      } else if (event === 'SIGNED_OUT') {
        setRole(null);
      } else if (event === 'PASSWORD_RECOVERY') {
        console.log('AuthProvider: Password Recovery Mode Triggered');
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
      resetPassword,
      verifyOtp,
      signInWithOAuth
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
