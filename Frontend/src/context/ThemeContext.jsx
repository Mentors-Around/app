import React, { createContext, useState, useEffect, useContext } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('trueed:theme') || 'classic';
  });

  const [mode, setModeState] = useState(() => {
    return localStorage.getItem('trueed:mode') || 'system';
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('trueed:theme', newTheme);
  };

  const setMode = (newMode) => {
    setModeState(newMode);
    localStorage.setItem('trueed:mode', newMode);
  };

  useEffect(() => {
    const root = document.documentElement;

    // Apply Theme
    root.setAttribute('data-theme', theme);
    // Remove other theme classes
    const themesList = ['theme-classic', 'theme-emerald', 'theme-amethyst', 'theme-sunset'];
    themesList.forEach((t) => root.classList.remove(t));
    root.classList.add(`theme-${theme}`);

    // Apply Mode (Light/Dark/System)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyMode = () => {
      const isDark =
        mode === 'dark' || (mode === 'system' && mediaQuery.matches);
      
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyMode();

    if (mode === 'system') {
      mediaQuery.addEventListener('change', applyMode);
      return () => mediaQuery.removeEventListener('change', applyMode);
    }
  }, [theme, mode]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mode, setMode }}>
      {children}
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
