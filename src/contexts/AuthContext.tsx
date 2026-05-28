import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Linking from 'expo-linking';
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

  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({ id: userId, role: 'customer' });
          if (!insertError) setRole('customer');
        } else {
          setRole('customer');
        }
      } else if (data) {
        setRole(data.role);
      }
    } catch (error) {
      setRole('customer');
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const origin = Linking.createURL('reset-password');
    return await supabase.auth.resetPasswordForEmail(email, { redirectTo: origin });
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    return await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'apple') => {
    const redirectUrl = Platform.OS === 'web' 
      ? window.location.origin 
      : Linking.createURL('login-callback');
    
    return await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: Platform.OS !== 'web',
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    setRole(null);
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
  }, []);

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      const { queryParams } = Linking.parse(url);
      if (queryParams?.error) {
        const errorDesc = (queryParams.error_description as string)?.replace(/\+/g, ' ') || (queryParams.error as string);
        Alert.alert('Authentication Error', errorDesc);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    Linking.getInitialURL().then((url) => { if (url) handleDeepLink(url); });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      if (session?.user) fetchUserRole(session.user.id);
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
  }, [fetchUserRole]);

  const value = useMemo(() => ({ 
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
  }), [user, session, role, isLoading, isRecovering, signOut, resetPassword, verifyOtp, signInWithOAuth]);

  return (
    <AuthContext.Provider value={value}>
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
