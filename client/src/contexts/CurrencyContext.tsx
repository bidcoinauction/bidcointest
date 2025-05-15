import React, { createContext, useContext, useState, useEffect } from 'react';

type CurrencyDisplay = 'native' | 'usd';

interface CurrencyContextType {
  currencyDisplay: CurrencyDisplay;
  setCurrencyDisplay: React.Dispatch<React.SetStateAction<CurrencyDisplay>>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // Try to load preference from localStorage or use default
  const [currencyDisplay, setCurrencyDisplay] = useState<CurrencyDisplay>(() => {
    const savedPreference = localStorage.getItem('currency-preference');
    return (savedPreference as CurrencyDisplay) || 'native';
  });

  // Save preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('currency-preference', currencyDisplay);
  }, [currencyDisplay]);

  return (
    <CurrencyContext.Provider value={{ currencyDisplay, setCurrencyDisplay }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrencyPreference() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrencyPreference must be used within a CurrencyProvider');
  }
  return context;
}