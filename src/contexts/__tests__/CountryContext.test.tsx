import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { CountryProvider, useCountry } from '../CountryContext';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';

// Mock dependencies
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [])
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn()
}));

describe('CountryContext', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  it('initializes with default IN when nothing is saved and IP fetch fails', async () => {
    (Localization.getLocales as jest.Mock).mockReturnValue([]);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    mockFetch.mockRejectedValue(new Error('Fetch failed'));

    const { result } = await renderHook(() => useCountry(), { wrapper: CountryProvider });
    
    expect(result.current.countryCode).toBe('IN');
  });

  it('initializes with saved country code from SecureStore', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('US');

    const { result } = await renderHook(() => useCountry(), { wrapper: CountryProvider });
    
    expect(result.current.countryCode).toBe('US');
    expect(SecureStore.getItemAsync).toHaveBeenCalled();
  });

  it('falls back to locale region code if available', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (Localization.getLocales as jest.Mock).mockReturnValue([{ regionCode: 'GB' }]);
    mockFetch.mockRejectedValue(new Error('Fetch failed'));

    const { result } = await renderHook(() => useCountry(), { wrapper: CountryProvider });
    
    expect(result.current.countryCode).toBe('GB');
  });

  it('falls back to IP geolocation country code', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (Localization.getLocales as jest.Mock).mockReturnValue([]);
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ country_code: 'CA' })
    });

    const { result } = await renderHook(() => useCountry(), { wrapper: CountryProvider });
    
    expect(result.current.countryCode).toBe('CA');
  });

  it('updates country code and saves to SecureStore', async () => {
    const { result } = await renderHook(() => useCountry(), { wrapper: CountryProvider });

    await act(async () => {
      await result.current.setCountryCode('AE');
    });

    expect(result.current.countryCode).toBe('AE');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('user_country_code', 'AE');
  });
});
