import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useCountry } from './CountryContext';

interface GoldRate {
  purity: string;
  rate: number; // USD per gram
}

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

  // Memoize rates so the reference doesn't change unless baseRate changes
  const rates = useMemo((): GoldRate[] => [
    { purity: '24K', rate: baseRate },
    { purity: '22K', rate: baseRate * 0.9167 },
    { purity: '18K', rate: baseRate * 0.75 },
  ], [baseRate]);

  const getLocalizedRate = (usdRate: number) => {
    if (countryCode === 'IN') {
      const inrRatePer10g = usdRate * 80 * 10;
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(inrRatePer10g) + " (10g)";
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(usdRate) + " (g)";
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
