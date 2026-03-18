import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Localization from 'expo-localization';

interface CountryContextType {
  countryCode: string;
  setCountryCode: (code: string) => void;
  isLoading: boolean;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export const CountryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [countryCode, setCountryCodeState] = useState<string>('IN'); // Default to IN
  const [isLoading, setIsLoading] = useState(true);

  const fetchCountryByIP = async () => {
    try {
      // Attempt first provider
      const response = await fetch('https://ipapi.co/json/');
      
      // Check if response is ok and is JSON
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await response.json();
          if (data.country_code) return data.country_code;
        }
      }
      
      // Fallback provider if ipapi fails or rate limits (returns "Too Many Requests")
      const fallbackResponse = await fetch('http://ip-api.com/json/');
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        if (data.countryCode) return data.countryCode;
      }

    } catch (error) {
      console.error("Error fetching IP geolocation:", error);
    }
    return null;
  };

  useEffect(() => {
    const detectCountry = async () => {
      setIsLoading(true);
      
      // 1. Check Browser/Device Language
      const locales = Localization.getLocales();
      const deviceCountry = locales[0]?.regionCode;
      
      if (deviceCountry) {
        setCountryCodeState(deviceCountry);
      }

      // 2. Try IP Geolocation
      const ipCountry = await fetchCountryByIP();
      if (ipCountry) {
        setCountryCodeState(ipCountry);
      }

      setIsLoading(false);
    };

    detectCountry();
  }, []);

  const setCountryCode = (code: string) => {
    setCountryCodeState(code);
  };

  return (
    <CountryContext.Provider value={{ countryCode, setCountryCode, isLoading }}>
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = () => {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
};
