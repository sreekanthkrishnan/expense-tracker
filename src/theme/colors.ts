/**
 * Brand Colors - Single Source of Truth (Theme-01 - DEFAULT)
 * 
 * All application colors are defined here.
 * Update colors in this file to change them across the entire application.
 * 
 * Theme-01 is the default theme.
 * For theme switching, use the theme system in themes.ts
 */

// Theme-01 Brand Colors (DEFAULT)
export const COLORS = {
  yellow: '#FFCC00',
  pink: '#FF018F',
  purple: '#2D0C62',
  dark: '#11012E',
} as const;

/**
 * Brand Gradients - Single Source of Truth (Theme-01 - DEFAULT)
 * 
 * All application gradients are defined here.
 * Update gradients in this file to change them across the entire application.
 * 
 * Theme-01 is the default theme.
 * For theme switching, use the theme system in themes.ts
 */
export const BRAND_GRADIENTS = {
  gradient01: {
    from: '#D6D9D8',
    to: '#C7CEE8',
  },
  gradient02: {
    from: '#C7CEE8',
    to: '#D0D34D',
  },
  gradient03: {
    from: '#C7CEE8',
    to: '#157954',
  },
  gradient04: {
    from: '#D0D34D',
    to: '#21263A',
  },
  gradient05: {
    from: '#157954',
    to: '#21263A',
  },
} as const;

// Legacy export for backward compatibility during migration
export const BRAND_COLORS = COLORS;

/**
 * Get gradient as CSS linear-gradient string
 */
export const getGradient = (gradientName: keyof typeof BRAND_GRADIENTS): string => {
  const gradient = BRAND_GRADIENTS[gradientName];
  return `linear-gradient(to right, ${gradient.from}, ${gradient.to})`;
};

/**
 * Get gradient as CSS variables for use in Tailwind
 */
export const getGradientColors = (gradientName: keyof typeof BRAND_GRADIENTS) => {
  return BRAND_GRADIENTS[gradientName];
};

// Type exports
export type ColorName = keyof typeof COLORS;
export type GradientName = keyof typeof BRAND_GRADIENTS;

