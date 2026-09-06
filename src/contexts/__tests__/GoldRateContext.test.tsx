import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { GoldRateProvider, useGoldRate } from '../GoldRateContext';
import { supabase } from '../../../supabase';

let mockCountryCode = 'US';
jest.mock('../CountryContext', () => ({
  useCountry: () => ({ countryCode: mockCountryCode })
}));

jest.mock('../../../supabase', () => ({
  supabase: {
    rpc: jest.fn()
  }
}));

describe('GoldRateContext', () => {
  let mockRpc: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCountryCode = 'US';
    mockRpc = supabase.rpc as jest.Mock;
  });

  it('fetches gold rate from get_latest_gold_rates RPC', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        base_usd_24k: 70,
        currency: 'USD',
        exchange_rate: 1,
        locale: 'en-US',
        rates: [
          { purity: '24K', usd_rate: 70, local_rate: 70 },
          { purity: '22K', usd_rate: 64.17, local_rate: 64.17 },
          { purity: '18K', usd_rate: 52.5, local_rate: 52.5 },
        ]
      },
      error: null
    });

    const { result } = await renderHook(() => useGoldRate(), { wrapper: GoldRateProvider });

    expect(mockRpc).toHaveBeenCalledWith('get_latest_gold_rates', { p_country_code: 'US' });
    expect(result.current.rates.find(r => r.purity === '24K')?.rate).toBe(70);
    expect(result.current.isLoading).toBe(false);
  });

  it('localizes rates correctly for USD and INR', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        base_usd_24k: 80,
        currency: 'USD',
        exchange_rate: 1,
        locale: 'en-US',
        rates: [
          { purity: '24K', usd_rate: 80, local_rate: 80 }
        ]
      },
      error: null
    });

    mockCountryCode = 'US';
    const { result: resultUS } = await renderHook(() => useGoldRate(), { wrapper: GoldRateProvider });
    const formattedUS = resultUS.current.getLocalizedRate(80);
    expect(formattedUS).toContain('$80.00');

    mockRpc.mockResolvedValueOnce({
      data: {
        base_usd_24k: 80,
        currency: 'INR',
        exchange_rate: 83,
        locale: 'en-IN',
        rates: [
          { purity: '24K', usd_rate: 80, local_rate: 6640 }
        ]
      },
      error: null
    });

    mockCountryCode = 'IN';
    const { result: resultIN } = await renderHook(() => useGoldRate(), { wrapper: GoldRateProvider });
    const formattedIN = resultIN.current.getLocalizedRate(80);
    expect(formattedIN).toContain('₹6,640');
  });
});
