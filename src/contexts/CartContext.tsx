import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import { Product } from '../data/products';
import { useAuth } from './AuthContext';
import { supabase } from '../../supabase';

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: number;
  cartCount: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'moksha_jewels_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to map DB response to CartItem
  const mapDbToCartItem = useCallback((item: any): CartItem => {
    const product = item.product;
    return {
      id: product.id,
      name: product.name,
      category: product.category_name || 'Uncategorized',
      image: product.image_url,
      productCode: product.product_code,
      grossWeight: parseFloat(product.gross_weight || 0),
      goldWeight: parseFloat(product.gold_weight || 0),
      purity: product.purity,
      metalColor: product.metal_color,
      price: parseFloat(product.base_price_usd || 0),
      priceBreakup: {
        metal: parseFloat(product.metal_price_usd || 0),
        vaMaking: parseFloat(product.va_making_usd || 0),
        stoneBeads: parseFloat(product.stone_beads_usd || 0),
        tax: parseFloat(product.tax_usd || 0),
      },
      rating: parseFloat(product.rating || 0),
      popularity: parseInt(product.popularity || 0),
      createdAt: product.created_at,
      quantity: item.quantity,
    };
  }, []);

  // Load cart (either from DB or Local Storage)
  const loadCart = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user?.id) {
        console.log('Fetching cart from Supabase for user:', user.id);
        const { data, error } = await supabase
          .from('cart_items')
          .select('*, product:products(*)')
          .eq('user_id', user.id);

        if (error) throw error;
        if (data) {
          setCart(data.map(mapDbToCartItem));
        }
      } else {
        if (Platform.OS === 'web') {
          const savedCart = localStorage.getItem(CART_STORAGE_KEY);
          if (savedCart) setCart(JSON.parse(savedCart));
          else setCart([]);
        }
      }
    } catch (error) {
      console.warn('Error loading cart:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [user?.id, mapDbToCartItem]);

  // Initial load
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Sync local to DB
  useEffect(() => {
    const syncLocalCartToDb = async () => {
      if (user?.id && isInitialized && Platform.OS === 'web') {
        try {
          const localCartJson = localStorage.getItem(CART_STORAGE_KEY);
          if (localCartJson) {
            const localCart: CartItem[] = JSON.parse(localCartJson);
            if (localCart.length > 0) {
              for (const item of localCart) {
                await supabase.from('cart_items').upsert({
                  user_id: user.id,
                  product_id: item.id,
                  quantity: item.quantity
                }, { onConflict: 'user_id,product_id' });
              }
              localStorage.removeItem(CART_STORAGE_KEY);
              loadCart();
            }
          }
        } catch (error) {
          console.warn('Sync local cart error:', error);
        }
      }
    };
    syncLocalCartToDb();
  }, [user?.id, isInitialized, loadCart]);

  // Local persistence
  useEffect(() => {
    if (!isInitialized || user?.id) return;
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (e) {}
    }
  }, [cart, isInitialized, user?.id]);

  const addToCart = useCallback(async (product: Product) => {
    if (user?.id) {
      try {
        const existingItem = cart.find(item => item.id === product.id);
        const newQuantity = existingItem ? existingItem.quantity + 1 : 1;
        const { error } = await supabase
          .from('cart_items')
          .upsert({ user_id: user.id, product_id: product.id, quantity: newQuantity }, { onConflict: 'user_id,product_id' });
        if (!error) loadCart();
      } catch (error) {
        console.warn('Add to cart error:', error);
      }
    } else {
      setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        return [...prev, { ...product, quantity: 1 }];
      });
    }
  }, [user?.id, cart, loadCart]);

  const removeFromCart = useCallback(async (productId: string) => {
    if (user?.id) {
      try {
        const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', productId);
        if (!error) loadCart();
      } catch (error) {
        console.warn('Remove from cart error:', error);
      }
    } else {
      setCart(prev => prev.filter(item => item.id !== productId));
    }
  }, [user?.id, loadCart]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity <= 0) { await removeFromCart(productId); return; }
    if (user?.id) {
      try {
        const { error } = await supabase.from('cart_items').update({ quantity }).eq('user_id', user.id).eq('product_id', productId);
        if (!error) loadCart();
      } catch (error) {
        console.warn('Update quantity error:', error);
      }
    } else {
      setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
    }
  }, [user?.id, removeFromCart, loadCart]);

  const clearCart = useCallback(async () => {
    if (user?.id) {
      try {
        const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id);
        if (!error) setCart([]);
      } catch (error) {
        console.warn('Clear cart error:', error);
      }
    } else {
      setCart([]);
    }
  }, [user?.id]);

  const cartTotal = useMemo(() => cart.reduce((total, item) => total + (item.price * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((count, item) => count + item.quantity, 0), [cart]);

  const value = useMemo(() => ({
    cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, isLoading
  }), [cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, isLoading]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within a CartProvider');
  return context;
};
