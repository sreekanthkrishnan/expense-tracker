/**
 * Theme Definitions
 * 
 * All available themes are defined here.
 * Theme-01 is the default theme.
 */

import { COLORS, BRAND_GRADIENTS } from './colors';

export interface ThemeDefinition {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    dark: string;
    neutral?: string;
  };
  gradients: {
    gradient01: { from: string; to: string };
    gradient02: { from: string; to: string };
    gradient03: { from: string; to: string };
    gradient04: { from: string; to: string };
    gradient05: { from: string; to: string };
  };
}

/**
 * Theme-01 (DEFAULT) - Original Brand Theme
 * 
 * This theme uses the colors defined in colors.ts as the source of truth.
 */
export const THEME_01: ThemeDefinition = {
  name: 'Theme-01',
  colors: {
    primary: COLORS.yellow,
    secondary: COLORS.pink,
    accent: COLORS.purple,
    dark: COLORS.dark,
  },
  gradients: {
    gradient01: BRAND_GRADIENTS.gradient01,
    gradient02: BRAND_GRADIENTS.gradient02,
    gradient03: BRAND_GRADIENTS.gradient03,
    gradient04: BRAND_GRADIENTS.gradient04,
    gradient05: BRAND_GRADIENTS.gradient05,
  },
};

/**
 * Theme-02 - Dopely-Inspired Theme
 */
export const THEME_02: ThemeDefinition = {
  name: 'Theme-02',
  colors: {
    primary: '#48ccff',    // Cyan
    secondary: '#FF7F00',  // Orange
    accent: '#183A60',     // Navy
    dark: '#11012E',       // Dark
    neutral: '#D4DBF5',    // Lavender
  },
  gradients: {
    gradient01: { from: '#D6D9D8', to: '#C7CEE8' },
    gradient02: { from: '#C7CEE8', to: '#D0D34D' },
    gradient03: { from: '#C7CEE8', to: '#157954' },
    gradient04: { from: '#D0D34D', to: '#21263A' },
    gradient05: { from: '#157954', to: '#21263A' },
  },
};

/**
 * Theme-03 (Banking) - Banking-Inspired Theme
 */

export const THEME_03: ThemeDefinition = {
  name: 'Theme-03 (Banking)',

  colors: {
    primary: '#0F2A44',    // Deep Banking Blue
    secondary: '#1FA971',  // Emerald Green (positive money)
    accent: '#F5A524',     // Amber (alerts / attention)
    dark: '#0A1626',       // Very dark navy
    neutral: '#E6EDF5',    // Soft banking grey
  },

  gradients: {
    gradient01: { from: '#E6EDF5', to: '#C9D6E8' }, // Card surface
    gradient02: { from: '#1FA971', to: '#0F8B5F' }, // Income / savings
    gradient03: { from: '#0F2A44', to: '#1C3F66' }, // Headers / sections
    gradient04: { from: '#F5A524', to: '#D97706' }, // Warning / alerts
    gradient05: { from: '#0A1626', to: '#0F2A44' }, // Loan / risk
  },
};

/**
 * Theme-04 (Dark Fintech)
 */
export const THEME_04: ThemeDefinition = {
  name: 'Theme-04 (Dark Fintech)',

  colors: {
    primary: '#7C8CFF',    // Soft Indigo
    secondary: '#4ADE80',  // Mint Green
    accent: '#FACC15',     // Gold highlight
    dark: '#020617',       // Deep black-blue
    neutral: '#1E293B',    // Dark slate
  },

  gradients: {
    gradient01: { from: '#1E293B', to: '#020617' }, // Card surface
    gradient02: { from: '#4ADE80', to: '#16A34A' }, // Income
    gradient03: { from: '#7C8CFF', to: '#4338CA' }, // Header / brand
    gradient04: { from: '#FACC15', to: '#EAB308' }, // Warning
    gradient05: { from: '#020617', to: '#1E293B' }, // Loan / risk
  },
};


/**
 * Theme-05 (Calm Minimal)
 */
export const THEME_05: ThemeDefinition = {
  name: 'Theme-05 (Calm Minimal)',

  colors: {
    primary: '#2F5D50',    // Muted teal
    secondary: '#7FB77E',  // Soft green
    accent: '#E36414',     // Muted orange
    dark: '#1F2933',       // Charcoal
    neutral: '#EEF2F3',    // Light grey
  },

  gradients: {
    gradient01: { from: '#EEF2F3', to: '#DCE5E8' },
    gradient02: { from: '#7FB77E', to: '#4CAF50' },
    gradient03: { from: '#2F5D50', to: '#1E3D36' },
    gradient04: { from: '#E36414', to: '#C05621' },
    gradient05: { from: '#1F2933', to: '#2F3E46' },
  },
};
/**
 * Theme-06 (Luxury Finance)
 */
export const THEME_06: ThemeDefinition = {
  name: 'Theme-06 (Luxury Finance)',

  colors: {
    primary: '#1C1C1C',    // Jet black
    secondary: '#B89B5E',  // Champagne gold
    accent: '#6B7280',     // Cool grey
    dark: '#0F0F0F',       // True dark
    neutral: '#F5F3EE',    // Ivory
  },

  gradients: {
    gradient01: { from: '#F5F3EE', to: '#E7E5DF' },
    gradient02: { from: '#B89B5E', to: '#9C7C38' },
    gradient03: { from: '#1C1C1C', to: '#0F0F0F' },
    gradient04: { from: '#6B7280', to: '#374151' },
    gradient05: { from: '#0F0F0F', to: '#1C1C1C' },
  },
};
/**
 * Theme-07 (Bold Startup)
 */
export const THEME_07: ThemeDefinition = {
  name: 'Theme-07 (Bold Startup)',

  colors: {
    primary: '#6366F1',    // Electric Indigo
    secondary: '#22C55E',  // Bright Green
    accent: '#EF4444',     // Red highlight
    dark: '#111827',       // Slate black
    neutral: '#E5E7EB',    // Light grey
  },

  gradients: {
    gradient01: { from: '#E5E7EB', to: '#CBD5E1' },
    gradient02: { from: '#22C55E', to: '#16A34A' },
    gradient03: { from: '#6366F1', to: '#4338CA' },
    gradient04: { from: '#EF4444', to: '#B91C1C' },
    gradient05: { from: '#111827', to: '#1F2937' },
  },
};



/**
 * All available themes
 */
export const THEMES = {
  'theme-01': THEME_01,
  'theme-02': THEME_02,
  'theme-03': THEME_03,
  'theme-04': THEME_04,
  'theme-05': THEME_05,
  'theme-06': THEME_06,
  'theme-07': THEME_07,
} as const;


/**
 * Default theme (Theme-01)
 */
export const DEFAULT_THEME = THEME_01;
export const DEFAULT_THEME_KEY = 'theme-01';

export type ThemeKey = keyof typeof THEMES;

