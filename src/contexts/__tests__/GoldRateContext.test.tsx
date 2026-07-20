import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { GoldRateProvider, useGoldRate } from '../GoldRateContext';
import { supabase } from '../../../supabase';

// Mock dependencies
let mockCountryCode = 'US';
jest.mock('../CountryContext', () => ({
  useCountry: () => ({ countryCode: mockCountryCode })
}));

jest.mock('../../../supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('GoldRateContext', () => {
  let mockFetch: jest.Mock;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;
  let mockLimit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCountryCode = 'US';
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    mockLimit = jest.fn().mockImplementation(() => ({
      then: (cb: any) => cb({ data: [], error: null })
    }));
    mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
    mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

    mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it('fetches gold rate from freegoldapi.com if no api key or supabase override is found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ price: 70 }]
    });

    const { result } = await renderHook(() => useGoldRate(), { wrapper: GoldRateProvider });

    expect(result.current.rates.find(r => r.purity === '24K')?.rate).toBe(70);
    expect(result.current.isLoading).toBe(false);
  });

  it('uses Supabase custom override rates if configured', async () => {
    mockLimit.mockImplementation(() => ({
      then: (cb: any) => cb({ data: [{ rate_per_gram_usd: '85.50' }], error: null })
    }));

    const { result } = await renderHook(() => useGoldRate(), { wrapper: GoldRateProvider });

    expect(result.current.rates.find(r => r.purity === '24K')?.rate).toBe(85.50);
  });

  it('localizes rates correctly for USD and INR', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ price: 80 }]
    });

    // Test USA localization
    mockCountryCode = 'US';
    const { result: resultUS } = await renderHook(() => useGoldRate(), { wrapper: GoldRateProvider });
    const formattedUS = resultUS.current.getLocalizedRate(80);
    expect(formattedUS).toContain('$80.00');

    // Reset mocks for next hook render
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ price: 80 }]
    });

    // Test India localization
    mockCountryCode = 'IN';
    const { result: resultIN } = await renderHook(() => useGoldRate(), { wrapper: GoldRateProvider });
    const formattedIN = resultIN.current.getLocalizedRate(80);
    expect(formattedIN).toContain('₹6,640'); // 80 * 83
  });
});
