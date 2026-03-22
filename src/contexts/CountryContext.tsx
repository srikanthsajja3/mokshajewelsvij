import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface CountryContextType {
  countryCode: string;
  setCountryCode: (code: string) => void;
  isLoading: boolean;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

const STORAGE_KEY = 'user_country_code';

export const CountryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [countryCode, setCountryCodeState] = useState<string>('IN'); // Default to IN
  const [isLoading, setIsLoading] = useState(true);

  const fetchCountryByIP = async () => {
    try {
      console.log("Detecting location via IP...");
      // Attempt first provider
      const response = await fetch('https://ipapi.co/json/');
      
      // Check if response is ok and is JSON
      if (response.ok) {
        const data = await response.json();
        if (data.country_code) {
          console.log("IP detection successful:", data.country_code);
          return data.country_code;
        }
      }
      
      // Fallback provider if ipapi fails or rate limits
      const fallbackResponse = await fetch('http://ip-api.com/json/');
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        if (data.countryCode) {
          console.log("Fallback IP detection successful:", data.countryCode);
          return data.countryCode;
        }
      }

    } catch (error) {
      console.error("Error fetching IP geolocation:", error);
    }
    return null;
  };

  useEffect(() => {
    const detectCountry = async () => {
      setIsLoading(true);
      
      // 1. Check SecureStore for manual override
      try {
        const savedCode = Platform.OS === 'web' 
          ? localStorage.getItem(STORAGE_KEY)
          : await SecureStore.getItemAsync(STORAGE_KEY);
          
        if (savedCode) {
          console.log("Using saved country choice:", savedCode);
          setCountryCodeState(savedCode);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn("SecureStore error:", e);
      }

      // 2. Check Browser/Device Language
      const locales = Localization.getLocales();
      const deviceCountry = locales[0]?.regionCode;
      
      if (deviceCountry) {
        console.log("Device locale country detected:", deviceCountry);
        setCountryCodeState(deviceCountry);
      }

      // 3. Try IP Geolocation
      const ipCountry = await fetchCountryByIP();
      if (ipCountry) {
        setCountryCodeState(ipCountry);
      }

      setIsLoading(false);
    };

    detectCountry();
  }, []);

  const setCountryCode = async (code: string) => {
    setCountryCodeState(code);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(STORAGE_KEY, code);
      } else {
        await SecureStore.setItemAsync(STORAGE_KEY, code);
      }
      console.log("Saved country choice:", code);
    } catch (e) {
      console.warn("Error saving country choice:", e);
    }
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
