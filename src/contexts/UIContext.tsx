import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated } from 'react-native';

interface UIContextType {
  loginVisible: boolean;
  setLoginVisible: (visible: boolean) => void;
  drawerVisible: boolean;
  setDrawerVisible: (visible: boolean) => void;
  scrollY: Animated.Value;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loginVisible, setLoginVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <UIContext.Provider value={{ 
      loginVisible, 
      setLoginVisible, 
      drawerVisible, 
      setDrawerVisible, 
      scrollY,
      searchQuery,
      setSearchQuery 
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
