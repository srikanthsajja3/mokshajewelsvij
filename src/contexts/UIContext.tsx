import React, { createContext, useContext, useState } from 'react';

interface UIContextType {
  loginVisible: boolean;
  setLoginVisible: (visible: boolean) => void;
  drawerVisible: boolean;
  setDrawerVisible: (visible: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loginVisible, setLoginVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <UIContext.Provider value={{ loginVisible, setLoginVisible, drawerVisible, setDrawerVisible }}>
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
