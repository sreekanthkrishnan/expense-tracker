/**
 * Detect Statement Duplicates
 * 
 * Compares parsed bank statement transactions against existing records
 * to identify potential duplicates.
 */

import type { Income, Expense } from '../../types';
import type { ImportPreviewRow } from './types';

/**
 * Calculate similarity between two strings (simple Levenshtein-like)
 */
const stringSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Simple word overlap
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w));
  const similarity = (commonWords.length * 2) / (words1.length + words2.length);
  
  return similarity;
};

/**
 * Check if transaction is duplicate of existing record
 */
const checkIfDuplicate = (
  transaction: ImportPreviewRow,
  existing: Income | Expense,
  threshold: number = 0.7
): boolean => {
  // Exact match on amount and date
  const amountMatch = Math.abs(transaction.amount - existing.amount) < 0.01;
  const dateMatch = transaction.date === existing.date;

  if (!amountMatch || !dateMatch) {
    return false;
  }

  // Check description similarity
  const description = transaction.description;
  let existingDescription = '';
  
  if ('source' in existing) {
    // Income
    existingDescription = existing.source || '';
  } else {
    // Expense
    existingDescription = existing.category || '';
  }

  const similarity = stringSimilarity(description, existingDescription);
  
  return similarity >= threshold;
};

/**
 * Detect duplicates in parsed transactions
 * 
 * @param transactions - Parsed transactions to check
 * @param existingIncomes - Existing income records
 * @param existingExpenses - Existing expense records
 * @returns Transactions with duplicate flags
 */
export const detectStatementDuplicates = (
  transactions: ImportPreviewRow[],
  existingIncomes: Income[],
  existingExpenses: Expense[]
): ImportPreviewRow[] => {
  return transactions.map((transaction) => {
    let foundDuplicate = false;
    let duplicateOf: string | undefined;

    if (transaction.type === 'income') {
      // Check against existing incomes
      for (const income of existingIncomes) {
        if (checkIfDuplicate(transaction, income)) {
          foundDuplicate = true;
          duplicateOf = income.id;
          break;
        }
      }
    } else {
      // Check against existing expenses
      for (const expense of existingExpenses) {
        if (checkIfDuplicate(transaction, expense)) {
          foundDuplicate = true;
          duplicateOf = expense.id;
          break;
        }
      }
    }

    return {
      ...transaction,
      isDuplicate: foundDuplicate,
      duplicateOf,
    };
  });
};
