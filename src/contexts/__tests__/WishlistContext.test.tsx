import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { WishlistProvider, useWishlist } from '../WishlistContext';
import { supabase } from '../../../supabase';

// Mock dependencies
const mockUser = { id: 'user-123' };
let mockAuthUser: any = null;

jest.mock('../AuthContext', () => ({
  useAuth: () => ({ user: mockAuthUser })
}));

jest.mock('../../../supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('WishlistContext', () => {
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockInsert: jest.Mock;
  let mockDelete: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = null;

    mockEq = jest.fn().mockImplementation(() => ({
      eq: mockEq,
      then: (cb: any) => cb({ data: [], error: null })
    }));

    mockSelect = jest.fn().mockImplementation(() => ({
      eq: mockEq,
    }));

    mockInsert = jest.fn().mockResolvedValue({ error: null });
    mockDelete = jest.fn().mockImplementation(() => ({
      eq: mockEq,
    }));

    mockFrom = supabase.from as jest.Mock;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'wishlist') {
        return {
          select: mockSelect,
          insert: mockInsert,
          delete: mockDelete,
          eq: mockEq
        };
      }
      return {};
    });
  });

  it('initializes with empty wishlist', async () => {
    const { result } = await renderHook(() => useWishlist(), { wrapper: WishlistProvider });
    expect(result.current.wishlist).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('fetches wishlist when user is logged in', async () => {
    mockAuthUser = mockUser;
    const mockData = [{ product_id: 'prod-1' }, { product_id: 'prod-2' }];
    
    mockEq.mockImplementation(() => ({
      eq: mockEq,
      then: (cb: any) => cb({ data: mockData, error: null })
    }));

    const { result } = await renderHook(() => useWishlist(), { wrapper: WishlistProvider });
    
    expect(result.current.wishlist).toEqual(['prod-1', 'prod-2']);
    expect(result.current.isInWishlist('prod-1')).toBe(true);
    expect(result.current.isInWishlist('prod-3')).toBe(false);
  });

  it('adds item to wishlist', async () => {
    mockAuthUser = mockUser;
    const { result } = await renderHook(() => useWishlist(), { wrapper: WishlistProvider });

    await act(async () => {
      await result.current.addToWishlist('prod-abc');
    });

    expect(mockInsert).toHaveBeenCalledWith({ user_id: 'user-123', product_id: 'prod-abc' });
    expect(result.current.wishlist).toContain('prod-abc');
  });

  it('removes item from wishlist', async () => {
    mockAuthUser = mockUser;
    
    // Start with preloaded item
    mockEq.mockImplementation(() => ({
      eq: mockEq,
      then: (cb: any) => cb({ data: [{ product_id: 'prod-abc' }], error: null })
    }));

    const { result } = await renderHook(() => useWishlist(), { wrapper: WishlistProvider });
    expect(result.current.wishlist).toContain('prod-abc');

    mockEq.mockImplementation(() => ({
      eq: mockEq,
      then: (cb: any) => cb({ error: null })
    }));

    await act(async () => {
      await result.current.removeFromWishlist('prod-abc');
    });

    expect(result.current.wishlist).not.toContain('prod-abc');
  });
});
