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

export const GoldRateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { countryCode } = useCountry();
  const [baseRate, setBaseRate] = useState<number>(75); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGoldRate = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockBase = 72 + Math.random() * 5; 
        setBaseRate(mockBase);
      } catch (error) {
        console.error("Error fetching gold rate:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoldRate();
    const interval = setInterval(fetchGoldRate, 300000);
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
