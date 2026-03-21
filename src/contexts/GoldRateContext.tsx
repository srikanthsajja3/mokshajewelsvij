import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useCountry } from './CountryContext';

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
  'IN': { currency: 'INR', unit: '10g', factor: 10, exchangeRate: 83, locale: 'en-IN' },
  'US': { currency: 'USD', unit: 'g', factor: 1, exchangeRate: 1, locale: 'en-US' },
  'GB': { currency: 'GBP', unit: 'g', factor: 1, exchangeRate: 0.79, locale: 'en-GB' },
  'AE': { currency: 'AED', unit: 'g', factor: 1, exchangeRate: 3.67, locale: 'en-AE' },
  'CA': { currency: 'CAD', unit: 'g', factor: 1, exchangeRate: 1.35, locale: 'en-CA' },
  'AU': { currency: 'AUD', unit: 'g', factor: 1, exchangeRate: 1.52, locale: 'en-AU' },
  'SG': { currency: 'SGD', unit: 'g', factor: 1, exchangeRate: 1.34, locale: 'en-SG' },
};

const DEFAULT_CONFIG: CountryConfig = { 
  currency: 'USD', 
  unit: 'g', 
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
        // Attempt to fetch real gold rate from GoldAPI.io
        // XAU is the symbol for Gold
        const response = await fetch('https://www.goldapi.io/api/XAU/USD', {
          headers: {
            'x-access-token': GOLD_API_KEY,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.price_gram_24k) {
            setBaseRate(data.price_gram_24k);
            setIsLoading(false);
            return;
          }
        }
        
        // Fallback to mock data if API fails
        console.warn("Gold API failed or key missing, using fallback rates.");
        const mockBase = 72 + Math.random() * 5; 
        setBaseRate(mockBase);
      } catch (error) {
        console.error("Error fetching gold rate:", error);
        // Fallback
        const mockBase = 72 + Math.random() * 5; 
        setBaseRate(mockBase);
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

  const getLocalizedRate = (usdRate: number) => {
    const config = COUNTRY_CONFIGS[countryCode] || DEFAULT_CONFIG;
    const localizedValue = usdRate * config.exchangeRate * config.factor;
    
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      maximumFractionDigits: config.currency === 'INR' ? 0 : 2,
    }).format(localizedValue) + ` (${config.unit})`;
  };

  return (
    <GoldRateContext.Provider value={{ rates, getLocalizedRate, isLoading }}>
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
