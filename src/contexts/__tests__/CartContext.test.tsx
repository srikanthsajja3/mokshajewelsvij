import React from 'react';
import { render, act, renderHook } from '@testing-library/react-native';
import { CartProvider, useCart } from '../CartContext';

// Mock dependencies
jest.mock('../AuthContext', () => ({
  useAuth: () => ({ user: null }) // Test unauthenticated state first
}));

jest.mock('../../../supabase', () => ({
  supabase: {
    from: jest.fn(),
  }
}));

const mockProduct = {
  id: '123',
  name: 'Test Ring',
  category: 'Gold',
  image: 'img.jpg',
  productCode: 'TEST-123',
  grossWeight: 5,
  goldWeight: 4,
  purity: '22K',
  metalColor: 'Yellow',
  price: 500,
  priceBreakup: { metal: 400, vaMaking: 50, stoneBeads: 10, tax: 40 },
  rating: 5,
  popularity: 100,
  createdAt: new Date().toISOString()
};

describe('CartContext', () => {
  it('initializes with an empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider }) as any;
    expect(result.current.cart).toEqual([]);
    expect(result.current.cartCount).toBe(0);
    expect(result.current.cartTotal).toBe(0);
  });

  it('adds a product to the cart', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider }) as any;

    await act(async () => {
      await result.current.addToCart(mockProduct);
    });

    expect(result.current.cart.length).toBe(1);
    expect(result.current.cart[0].id).toBe(mockProduct.id);
    expect(result.current.cart[0].quantity).toBe(1);
    expect(result.current.cartCount).toBe(1);
    expect(result.current.cartTotal).toBe(500);
  });

  it('increments quantity when adding an existing product', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider }) as any;

    await act(async () => {
      await result.current.addToCart(mockProduct);
      await result.current.addToCart(mockProduct);
    });

    expect(result.current.cart.length).toBe(1);
    expect(result.current.cart[0].quantity).toBe(2);
    expect(result.current.cartCount).toBe(2);
    expect(result.current.cartTotal).toBe(1000);
  });

  it('updates quantity of a product', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider }) as any;

    await act(async () => {
      await result.current.addToCart(mockProduct);
      await result.current.updateQuantity(mockProduct.id, 5);
    });

    expect(result.current.cart[0].quantity).toBe(5);
    expect(result.current.cartCount).toBe(5);
    expect(result.current.cartTotal).toBe(2500);
  });

  it('removes a product from the cart', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider }) as any;

    await act(async () => {
      await result.current.addToCart(mockProduct);
      await result.current.removeFromCart(mockProduct.id);
    });

    expect(result.current.cart.length).toBe(0);
    expect(result.current.cartCount).toBe(0);
    expect(result.current.cartTotal).toBe(0);
  });

  it('clears the cart', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider }) as any;

    await act(async () => {
      await result.current.addToCart(mockProduct);
      await result.current.clearCart();
    });

    expect(result.current.cart.length).toBe(0);
  });
});
