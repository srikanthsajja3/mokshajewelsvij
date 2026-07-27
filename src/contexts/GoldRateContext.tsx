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
  const [baseRate, setBaseRate] = useState<number>(75); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGoldRate = async () => {
      setIsLoading(true);
      try {
        // 0. Manual Override: Check if rate is set in Supabase database
        try {
          const { data: dbRates, error: dbError } = await supabase
            .from('gold_rates')
            .select('rate_per_gram_usd')
            .eq('purity', '24K')
            .order('updated_at', { ascending: false })
            .limit(1);

          if (!dbError && dbRates && dbRates.length > 0) {
            const customRate = parseFloat(dbRates[0].rate_per_gram_usd);
            if (customRate > 0) {
              setBaseRate(customRate);
              setIsLoading(false);
              return;
            }
          }
        } catch (dbErr) {
          console.warn("Failed to check gold rates override in Supabase:", dbErr);
        }

        // Primary: GoldAPI.io with 3s Timeout
        if (GOLD_API_KEY && GOLD_API_KEY !== 'goldapi-placeholder-key') {
          const controllerIO = new AbortController();
          const timeoutId = setTimeout(() => controllerIO.abort(), 3000);
          try {
            const responseIO = await fetch('https://www.goldapi.io/api/XAU/USD', {
              headers: {
                'x-access-token': GOLD_API_KEY,
                'Content-Type': 'application/json'
              },
              signal: controllerIO.signal
            });
            clearTimeout(timeoutId);
            if (responseIO.ok) {
              const data = await responseIO.json();
              if (data.price_gram_24k) {
                setBaseRate(data.price_gram_24k);
                setIsLoading(false);
                return;
              }
            }
          } catch (e) {
            clearTimeout(timeoutId);
          }
        }

        // Secondary: freegoldapi.com with 3s Timeout
        const controllerFree = new AbortController();
        const timeoutIdFree = setTimeout(() => controllerFree.abort(), 3000);
        try {
          const response = await fetch('https://freegoldapi.com/data/latest.json', { signal: controllerFree.signal });
          clearTimeout(timeoutIdFree);
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              const latest = data[data.length - 1];
              if (latest.price) {
                setBaseRate(latest.price);
                setIsLoading(false);
                return;
              }
            }
          }
        } catch (e) {
          clearTimeout(timeoutIdFree);
        }

        // Final Fallback
        const mockBase = 74.5;
        setBaseRate(mockBase);
      } catch (error) {
        setBaseRate(74.5);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoldRate();
    // Refresh every 30 minutes to stay within free tier limits
    const interval = setInterval(fetchGoldRate, 1800000);
    return () => clearInterval(interval);
  }, []);

  const rates = useMemo((): GoldRate[] => [
    { purity: '24K', rate: baseRate },
    { purity: '22K', rate: baseRate * 0.9167 },
    { purity: '18K', rate: baseRate * 0.75 },
  ], [baseRate]);

  const getLocalizedRate = useCallback((usdRate: number) => {
    const config = COUNTRY_CONFIGS[countryCode] || DEFAULT_CONFIG;
    const localizedValue = usdRate * config.exchangeRate * config.factor;
    
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      maximumFractionDigits: config.currency === 'INR' ? 0 : 2,
    }).format(localizedValue) + ` (${config.unit})`;
  }, [countryCode]);

  const value = useMemo(() => ({ 
    rates, 
    getLocalizedRate, 
    isLoading 
  }), [rates, getLocalizedRate, isLoading]);

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
