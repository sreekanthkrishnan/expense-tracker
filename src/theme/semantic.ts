/**
 * Semantic Color Tokens - Meaning-Based Color System (Theme-01 - DEFAULT)
 * 
 * Use these semantic names instead of direct color values.
 * This makes the code more maintainable and allows for easy theme switching.
 */

import { COLORS } from './colors';

export const SEMANTIC = {
  // Backgrounds
  background: COLORS.purple,
  surface: '#FFFFFF',
  
  // Text Colors
  textPrimary: COLORS.dark,
  textOnDark: '#FFFFFF',
  textSecondary: COLORS.purple,
  textMuted: '#6B7280',
  
  // Primary Actions
  primaryAction: COLORS.yellow,
  primaryActionHover: '#FFD633',
  
  // Finance Semantics
  income: COLORS.yellow,
  savings: COLORS.yellow,
  expense: COLORS.pink,
  loan: COLORS.yellow,
  warning: COLORS.pink,
  
  // Interactive States
  focus: COLORS.yellow,
  active: COLORS.purple,
  
  // Borders & Dividers
  border: '#E5E7EB',
  divider: '#D1D5DB',
} as const;

// Legacy export for backward compatibility
export const SEMANTIC_COLORS = {
  primary: SEMANTIC.primaryAction,
  primaryText: SEMANTIC.textOnDark,
  primaryHover: SEMANTIC.primaryActionHover,
  warning: SEMANTIC.warning,
  warningText: SEMANTIC.textOnDark,
  warningHover: COLORS.pink,
  background: SEMANTIC.background,
  backgroundDark: COLORS.dark,
  surface: SEMANTIC.surface,
  income: SEMANTIC.income,
  expense: SEMANTIC.expense,
  loan: SEMANTIC.loan,
  savings: SEMANTIC.savings,
  focus: SEMANTIC.focus,
  active: SEMANTIC.active,
  border: SEMANTIC.border,
  divider: SEMANTIC.divider,
} as const;

