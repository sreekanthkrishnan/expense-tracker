/**
 * Group Records by Duplicate Key
 * 
 * Creates a unique key for each record to identify duplicates.
 * Handles both old records (without time) and new records (with time).
 */

import type { Income, Expense } from '../../types';

type RecordWithTime = Income | Expense & { created_at?: string; createdAt?: number };

/**
 * Round timestamp to nearest 5 minutes
 * Used to group entries created within 5 minutes as potential duplicates
 */
const roundTo5Minutes = (timestamp: number): number => {
  const minutes = Math.floor(timestamp / (1000 * 60));
  const roundedMinutes = Math.floor(minutes / 5) * 5;
  return roundedMinutes * 60 * 1000;
};

/**
 * Generate duplicate key for a record
 * 
 * For records WITH time: amount + date + rounded(created_at, 5min)
 * For records WITHOUT time: amount + date + category/source + type
 */
export const generateDuplicateKey = (record: RecordWithTime, type: 'income' | 'expense'): string => {
  const amount = (record.amount || 0).toString();
  const date = record.date || '';

  // Check if record has timestamp (new format)
  const hasTime = 
    (record as any).created_at || 
    (record as any).createdAt ||
    (record as any).createdAt !== undefined;

  if (hasTime) {
    // New format: Use rounded timestamp
    const timestamp = 
      (record as any).created_at 
        ? new Date((record as any).created_at).getTime()
        : (record as any).createdAt || Date.now();
    
    const roundedTime = roundTo5Minutes(timestamp);
    return `${type}:${amount}:${date}:${roundedTime}`;
  } else {
    // Old format: Use category/source
    if (type === 'expense') {
      const expense = record as Expense;
      const category = expense.category || '';
      return `${type}:${amount}:${date}:${category}`;
    } else {
      const income = record as Income;
      const source = income.source || '';
      return `${type}:${amount}:${date}:${source}`;
    }
  }
};

/**
 * Group records by duplicate key
 * 
 * @param records - Array of records to group
 * @param type - Type of records ('income' or 'expense')
 * @returns Map of duplicate keys to arrays of records
 */
export const groupByDuplicateKey = <T extends RecordWithTime>(
  records: T[],
  type: 'income' | 'expense'
): Map<string, T[]> => {
  const groups = new Map<string, T[]>();

  for (const record of records) {
    const key = generateDuplicateKey(record, type);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(record);
  }

  return groups;
};
