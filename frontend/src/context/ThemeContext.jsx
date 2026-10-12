import React, { createContext, useContext } from 'react';

const ThemeContext = createContext(null);

// Theme is always dark — white mode has been removed.
// ThemeProvider is kept so existing useTheme() calls don't break.
export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={{ theme: 'dark', isDark: true }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
