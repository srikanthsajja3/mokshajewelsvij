import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlist: string[]; // List of product IDs
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchWishlist = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setWishlist(data.map((item: any) => item.product_id));
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [user?.id, fetchWishlist]);

  const addToWishlist = useCallback(async (productId: string) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('wishlist')
        .insert({ user_id: user.id, product_id: productId });

      if (error) throw error;
      setWishlist((prev) => [...prev, productId]);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  }, [user?.id]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
      setWishlist((prev) => prev.filter((id) => id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  }, [user?.id]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlist.includes(productId);
  }, [wishlist]);

  const value = useMemo(() => ({ 
    wishlist, 
    addToWishlist, 
    removeFromWishlist, 
    isInWishlist, 
    isLoading 
  }), [wishlist, isLoading, isInWishlist, addToWishlist, removeFromWishlist]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
