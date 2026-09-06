import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useCountry } from './CountryContext';
import { supabase } from '../../supabase';

interface GoldRate {
  purity: string;
  rate: number; // USD per gram
}

interface CountryConfig {
  currency: string;
  unit: string;
  factor: number; // multiplier for the unit (e.g., 10 for 10g)
  exchangeRate: number; // rate vs USD
  locale: string;
}

const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  'IN': { currency: 'INR', unit: '1g', factor: 1, exchangeRate: 83, locale: 'en-IN' },
  'US': { currency: 'USD', unit: '1g', factor: 1, exchangeRate: 1, locale: 'en-US' },
  'GB': { currency: 'GBP', unit: '1g', factor: 1, exchangeRate: 0.79, locale: 'en-GB' },
  'AE': { currency: 'AED', unit: '1g', factor: 1, exchangeRate: 3.67, locale: 'en-AE' },
  'CA': { currency: 'CAD', unit: '1g', factor: 1, exchangeRate: 1.35, locale: 'en-CA' },
  'AU': { currency: 'AUD', unit: '1g', factor: 1, exchangeRate: 1.52, locale: 'en-AU' },
  'SG': { currency: 'SGD', unit: '1g', factor: 1, exchangeRate: 1.34, locale: 'en-SG' },
};

const DEFAULT_CONFIG: CountryConfig = { 
  currency: 'USD', 
  unit: '1g', 
  factor: 1, 
  exchangeRate: 1, 
  locale: 'en-US' 
};

interface GoldRateContextType {
  rates: GoldRate[];
  getLocalizedRate: (usdRate: number) => string;
  isLoading: boolean;
}

const GoldRateContext = createContext<GoldRateContextType | undefined>(undefined);

// Use Expo Environment Variable for API Key
const GOLD_API_KEY = process.env.EXPO_PUBLIC_GOLD_API_KEY || 'goldapi-placeholder-key';

export const GoldRateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { countryCode } = useCountry();
  const [rates, setRates] = useState<GoldRate[]>([
    { purity: '24K', rate: 75 },
    { purity: '22K', rate: 68.75 },
    { purity: '18K', rate: 56.25 },
  ]);
  const [exchangeRate, setExchangeRate] = useState<number>(83);
  const [currency, setCurrency] = useState<string>('INR');
  const [locale, setLocale] = useState<string>('en-IN');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGoldRatesFromServer = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_latest_gold_rates', {
          p_country_code: countryCode || 'IN',
        });

        if (error) {
          console.warn('GoldRateContext: Server RPC error:', error.message);
        } else if (data && data.rates && Array.isArray(data.rates)) {
          setRates(
            data.rates.map((r: any) => ({
              purity: r.purity,
              rate: r.usd_rate,
            }))
          );
          if (data.exchange_rate) setExchangeRate(data.exchange_rate);
          if (data.currency) setCurrency(data.currency);
          if (data.locale) setLocale(data.locale);
        }
      } catch (err) {
        console.warn('GoldRateContext: Failed to fetch server gold rates:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoldRatesFromServer();

    let goldRateChannel: any = null;
    if (typeof supabase.channel === 'function') {
      goldRateChannel = supabase
        .channel('gold_rates_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'gold_rates' },
          () => {
            fetchGoldRatesFromServer();
          }
        )
        .subscribe();
    }

    const interval = setInterval(fetchGoldRatesFromServer, 1800000);
    return () => {
      clearInterval(interval);
      if (goldRateChannel && typeof supabase.removeChannel === 'function') {
        supabase.removeChannel(goldRateChannel);
      }
    };
  }, [countryCode]);

  const getLocalizedRate = useCallback(
    (usdRate: number) => {
      const localizedValue = usdRate * exchangeRate;
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: currency === 'INR' ? 0 : 2,
      }).format(localizedValue) + ' (1g)';
    },
    [exchangeRate, locale, currency]
  );

  const value = useMemo(
    () => ({
      rates,
      getLocalizedRate,
      isLoading,
    }),
    [rates, getLocalizedRate, isLoading]
  );

  return (
    <GoldRateContext.Provider value={value}>
      {children}
    </GoldRateContext.Provider>
  );
};

export const useGoldRate = () => {
  const context = useContext(GoldRateContext);
  if (context === undefined) {
    throw new Error('useGoldRate must be used within a GoldRateProvider');
  }
  return context;
};
