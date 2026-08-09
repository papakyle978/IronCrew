import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeId, ThemeConfig, WeightUnit } from '../types';
import { THEMES } from '../data/initialData';

interface ThemeContextType {
  theme: ThemeConfig;
  setThemeId: (id: ThemeId) => void;
  weightUnit: WeightUnit;
  setWeightUnit: (unit: WeightUnit) => void;
  formatWeight: (weightInLbs: number) => string;
  displayWeight: (weightInLbs: number) => number;
  inputToLbs: (inputWeight: number) => number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('liftoff_theme') as ThemeId;
    return saved && THEMES[saved] ? saved : 'iron-gym';
  });

  const [weightUnit, setWeightUnitState] = useState<WeightUnit>(() => {
    const saved = localStorage.getItem('liftoff_unit') as WeightUnit;
    return saved === 'kg' ? 'kg' : 'lbs';
  });

  const theme = THEMES[themeId] || THEMES['iron-gym'];

  useEffect(() => {
    localStorage.setItem('liftoff_theme', themeId);
    // update body class for full canvas bg
    if (theme.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeId, theme]);

  const setThemeId = (id: ThemeId) => {
    if (THEMES[id]) {
      setThemeIdState(id);
    }
  };

  const setWeightUnit = (unit: WeightUnit) => {
    setWeightUnitState(unit);
    localStorage.setItem('liftoff_unit', unit);
  };

  const displayWeight = (weightInLbs: number): number => {
    if (weightUnit === 'kg') {
      return Math.round(weightInLbs * 0.45359237);
    }
    return Math.round(weightInLbs);
  };

  const inputToLbs = (inputWeight: number): number => {
    if (weightUnit === 'kg') {
      return Math.round(inputWeight / 0.45359237);
    }
    return Math.round(inputWeight);
  };

  const formatWeight = (weightInLbs: number): string => {
    const val = displayWeight(weightInLbs);
    return `${val} ${weightUnit}`;
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setThemeId,
        weightUnit,
        setWeightUnit,
        formatWeight,
        displayWeight,
        inputToLbs,
      }}
    >
      <div className={`${theme.bgClass} ${theme.textPrimaryClass} min-h-screen transition-colors duration-200`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
