/**
 * Theme Hook
 * 
 * Manages theme selection and persistence.
 * Background is always white - themes only affect cards, accents, text, etc.
 */

import { useState, useEffect, useCallback } from 'react';
import { THEMES, DEFAULT_THEME_KEY, type ThemeKey } from '../theme/themes';
import type { ThemeDefinition } from '../theme/themes';

const THEME_STORAGE_KEY = 'finance-tracker-theme';

/**
 * Get current theme from localStorage or default
 */
const getStoredTheme = (): ThemeKey => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && stored in THEMES) {
      return stored as ThemeKey;
    }
  } catch (error) {
    console.error('Failed to read theme from localStorage:', error);
  }
  return DEFAULT_THEME_KEY;
};

/**
 * Store theme selection in localStorage
 */
const storeTheme = (themeKey: ThemeKey): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeKey);
  } catch (error) {
    console.error('Failed to store theme in localStorage:', error);
  }
};

/**
 * Apply theme to CSS variables
 * Background is always white - themes only affect other colors
 */
const applyTheme = (theme: ThemeDefinition): void => {
  const root = document.documentElement;
  
  // Brand colors
  root.style.setProperty('--color-yellow', theme.colors.primary);
  root.style.setProperty('--color-pink', theme.colors.secondary);
  root.style.setProperty('--color-purple', theme.colors.accent);
  root.style.setProperty('--color-dark', theme.colors.dark);
  
  // Semantic colors (background is always white)
  root.style.setProperty('--color-background', '#FFFFFF'); // Always white
  root.style.setProperty('--color-surface', '#000'); // Always black
  
  // Text colors
  root.style.setProperty('--color-text-primary', theme.colors.dark);
  root.style.setProperty('--color-text-secondary', theme.colors.accent);
  
  // Primary actions
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-primary-text', '#FFFFFF'); // Always white text on primary buttons
  root.style.setProperty('--color-primary-hover', theme.colors.primary === '#FFCC00' ? '#FFD633' : theme.colors.primary);
  
  // Finance semantics
  root.style.setProperty('--color-income', theme.colors.primary);
  root.style.setProperty('--color-savings', theme.colors.primary);
  root.style.setProperty('--color-expense', theme.colors.secondary);
  root.style.setProperty('--color-loan', theme.colors.primary);
  root.style.setProperty('--color-warning', theme.colors.secondary);
  
  // Interactive states
  root.style.setProperty('--color-focus', theme.colors.primary);
  root.style.setProperty('--color-active', theme.colors.accent);
  
  // Gradients
  root.style.setProperty('--gradient-01-from', theme.gradients.gradient01.from);
  root.style.setProperty('--gradient-01-to', theme.gradients.gradient01.to);
  root.style.setProperty('--gradient-02-from', theme.gradients.gradient02.from);
  root.style.setProperty('--gradient-02-to', theme.gradients.gradient02.to);
  root.style.setProperty('--gradient-03-from', theme.gradients.gradient03.from);
  root.style.setProperty('--gradient-03-to', theme.gradients.gradient03.to);
  root.style.setProperty('--gradient-04-from', theme.gradients.gradient04.from);
  root.style.setProperty('--gradient-04-to', theme.gradients.gradient04.to);
  root.style.setProperty('--gradient-05-from', theme.gradients.gradient05.from);
  root.style.setProperty('--gradient-05-to', theme.gradients.gradient05.to);
};

/**
 * Theme hook
 */
export const useTheme = () => {
  const [currentThemeKey, setCurrentThemeKey] = useState<ThemeKey>(getStoredTheme);
  const currentTheme = THEMES[currentThemeKey];

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // Switch theme
  const setTheme = useCallback((themeKey: ThemeKey) => {
    setCurrentThemeKey(themeKey);
    storeTheme(themeKey);
    applyTheme(THEMES[themeKey]);
  }, []);

  // Reset to default theme
  const resetTheme = useCallback(() => {
    setTheme(DEFAULT_THEME_KEY);
  }, [setTheme]);

  return {
    currentTheme: currentTheme,
    currentThemeKey,
    setTheme,
    resetTheme,
    availableThemes: THEMES,
  };
};

