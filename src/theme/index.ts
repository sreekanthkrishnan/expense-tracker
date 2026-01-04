/**
 * Centralized Theme System
 * 
 * This is the single source of truth for all colors and gradients.
 * Import from this file to use theme values throughout the application.
 * 
 * Theme-01 is the DEFAULT theme and loads automatically.
 */

export * from './colors';
export * from './semantic';
export * from './themes';

// Re-export default theme for convenience
export { DEFAULT_THEME, DEFAULT_THEME_KEY } from './themes';

