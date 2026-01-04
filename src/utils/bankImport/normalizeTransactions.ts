/**
 * Normalize Transactions
 * 
 * Normalizes parsed transactions and prepares them for import.
 * Handles data cleaning and validation.
 */

import type { ParsedTransaction, ImportPreviewRow } from './types';

/**
 * Clean and normalize description
 */
const normalizeDescription = (description: string): string => {
  if (!description) return 'Unknown Transaction';
  
  // Remove extra whitespace
  let cleaned = description.trim().replace(/\s+/g, ' ');
  
  // Remove common prefixes/suffixes
  cleaned = cleaned.replace(/^(UPI|NEFT|RTGS|IMPS|ATM|POS|CARD)\s*/i, '');
  cleaned = cleaned.replace(/\s*(UPI|NEFT|RTGS|IMPS|ATM|POS|CARD)$/i, '');
  
  return cleaned || 'Unknown Transaction';
};

/**
 * Normalize transaction data
 * 
 * @param transactions - Raw parsed transactions
 * @returns Normalized preview rows
 */
export const normalizeTransactions = (transactions: ParsedTransaction[]): ImportPreviewRow[] => {
  return transactions.map((transaction, index) => {
    const normalized: ImportPreviewRow = {
      ...transaction,
      id: `import-${Date.now()}-${index}`, // Temporary ID for UI
      description: normalizeDescription(transaction.description),
      include: true, // Default: include all
      category: transaction.category || 'Uncategorized',
    };

    // Ensure amount is positive
    if (normalized.amount < 0) {
      normalized.amount = Math.abs(normalized.amount);
    }

    return normalized;
  });
};

/**
 * Validate transaction before import
 */
export const validateTransaction = (transaction: ImportPreviewRow): string[] => {
  const errors: string[] = [];

  if (!transaction.date) {
    errors.push('Missing date');
  } else {
    const date = new Date(transaction.date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    }
  }

  if (!transaction.description || transaction.description.trim() === '') {
    errors.push('Missing description');
  }

  if (!transaction.amount || transaction.amount <= 0) {
    errors.push('Invalid amount');
  }

  if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
    errors.push('Invalid transaction type');
  }

  return errors;
};
