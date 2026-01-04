import { COLORS, BRAND_GRADIENTS } from './src/theme/colors';
import { SEMANTIC } from './src/theme/semantic';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors (direct access) - Theme-01
        yellow: COLORS.yellow,
        pink: COLORS.pink,
        purple: COLORS.purple,
        dark: COLORS.dark,
        // Semantic colors (preferred usage)
        semantic: {
          background: SEMANTIC.background,
          surface: SEMANTIC.surface,
          'text-primary': SEMANTIC.textPrimary,
          'text-on-dark': SEMANTIC.textOnDark,
          'text-secondary': SEMANTIC.textSecondary,
          'text-muted': SEMANTIC.textMuted,
          'primary-action': SEMANTIC.primaryAction,
          'primary-action-hover': SEMANTIC.primaryActionHover,
          income: SEMANTIC.income,
          savings: SEMANTIC.savings,
          expense: SEMANTIC.expense,
          loan: SEMANTIC.loan,
          warning: SEMANTIC.warning,
          focus: SEMANTIC.focus,
          active: SEMANTIC.active,
          border: SEMANTIC.border,
          divider: SEMANTIC.divider,
        },
      },
      backgroundImage: {
        // Gradients can be added here if needed in the future
      },
    },
  },
  plugins: [],
}

