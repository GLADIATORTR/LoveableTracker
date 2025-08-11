import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalSettings {
  realEstateAppreciationRate: number;
  inflationRate: number;
  sellingCosts: number;
  capitalGainsTax: number;
  currentMortgageRate: number;
  // Country-specific settings
  realEstateAppreciationRateTurkey: number;
  inflationRateTurkey: number;
  sellingCostsTurkey: number;
  capitalGainsTaxTurkey: number;
  currentMortgageRateTurkey: number;
}

interface GlobalSettingsContextType {
  settings: GlobalSettings;
  updateSettings: (newSettings: Partial<GlobalSettings>) => void;
}

const defaultSettings: GlobalSettings = {
  // USA settings
  realEstateAppreciationRate: 3.5,
  inflationRate: 2.8,
  sellingCosts: 2,
  capitalGainsTax: 0,
  currentMortgageRate: 6.5,
  // Turkey settings
  realEstateAppreciationRateTurkey: 15.0,
  inflationRateTurkey: 35.0,
  sellingCostsTurkey: 8,
  capitalGainsTaxTurkey: 20,
  currentMortgageRateTurkey: 45.0,
};

const GlobalSettingsContext = createContext<GlobalSettingsContextType | undefined>(undefined);

export const GlobalSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);

  const updateSettings = (newSettings: Partial<GlobalSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <GlobalSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </GlobalSettingsContext.Provider>
  );
};

export const useGlobalSettings = () => {
  const context = useContext(GlobalSettingsContext);
  if (context === undefined) {
    throw new Error('useGlobalSettings must be used within a GlobalSettingsProvider');
  }
  return context;
};