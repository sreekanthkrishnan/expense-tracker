/**
 * Detect Duplicate Records
 * 
 * Identifies duplicate entries across income and expenses.
 * Returns groups of duplicates for user review.
 */

import { groupByDuplicateKey } from './groupByDuplicateKey';
import type { Income, Expense } from '../../types';

export interface DuplicateGroup {
  key: string;
  entries: Array<Income | Expense>;
  type: 'income' | 'expense';
  count: number;
  totalAmount: number;
}

export interface DuplicateDetectionResult {
  income: DuplicateGroup[];
  expenses: DuplicateGroup[];
  totalGroups: number;
  totalEntries: number;
  entriesToRemove: number;
}

/**
 * Detect duplicates in income records
 */
const detectIncomeDuplicates = (incomes: Income[]): DuplicateGroup[] => {
  const groups = groupByDuplicateKey(incomes, 'income');
  const duplicates: DuplicateGroup[] = [];

  for (const [key, entries] of groups.entries()) {
    if (entries.length > 1) {
      const totalAmount = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
      duplicates.push({
        key,
        entries: entries as Income[],
        type: 'income',
        count: entries.length,
        totalAmount,
      });
    }
  }

  return duplicates;
};

/**
 * Detect duplicates in expense records
 */
const detectExpenseDuplicates = (expenses: Expense[]): DuplicateGroup[] => {
  const groups = groupByDuplicateKey(expenses, 'expense');
  const duplicates: DuplicateGroup[] = [];

  for (const [key, entries] of groups.entries()) {
    if (entries.length > 1) {
      const totalAmount = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
      duplicates.push({
        key,
        entries: entries as Expense[],
        type: 'expense',
        count: entries.length,
        totalAmount,
      });
    }
  }

  return duplicates;
};

/**
 * Detect all duplicates across income and expenses
 * 
 * @param incomes - Array of income records
 * @param expenses - Array of expense records
 * @returns Duplicate detection result with groups
 */
export const detectDuplicates = (
  incomes: Income[],
  expenses: Expense[]
): DuplicateDetectionResult => {
  const incomeDuplicates = detectIncomeDuplicates(incomes);
  const expenseDuplicates = detectExpenseDuplicates(expenses);

  const totalGroups = incomeDuplicates.length + expenseDuplicates.length;
  const totalEntries = incomeDuplicates.reduce((sum, g) => sum + g.count, 0) +
                       expenseDuplicates.reduce((sum, g) => sum + g.count, 0);
  const entriesToRemove = totalEntries - totalGroups; // Keep one from each group

  return {
    income: incomeDuplicates,
    expenses: expenseDuplicates,
    totalGroups,
    totalEntries,
    entriesToRemove,
  };
};

/**
 * Sort entries in a duplicate group by creation time (oldest first)
 * For entries without time, keep original order
 */
export const sortDuplicateGroup = (group: DuplicateGroup): DuplicateGroup => {
  const sortedEntries = [...group.entries].sort((a, b) => {
    const timeA = (a as any).created_at 
      ? new Date((a as any).created_at).getTime()
      : (a as any).createdAt || 0;
    const timeB = (b as any).created_at
      ? new Date((b as any).created_at).getTime()
      : (b as any).createdAt || 0;
    
    // If both have no time, keep original order
    if (timeA === 0 && timeB === 0) return 0;
    // If one has no time, put it first (older)
    if (timeA === 0) return -1;
    if (timeB === 0) return 1;
    // Sort by time (oldest first)
    return timeA - timeB;
  });

  return {
    ...group,
    entries: sortedEntries,
  };
};
