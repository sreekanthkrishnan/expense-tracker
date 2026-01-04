/**
 * Get Migration Summary
 * 
 * Provides a summary of data to be migrated for user preview.
 */

import type { IndexedDBData } from './detectIndexedDBData';

export interface MigrationSummary {
  totalRecords: number;
  breakdown: {
    income: number;
    expenses: number;
    loans: number;
    savings: number;
    profile: boolean;
  };
  estimatedTime: string; // e.g., "~30 seconds"
}

/**
 * Generate migration summary from IndexedDB data
 * 
 * @param data - IndexedDB data to migrate
 * @returns Migration summary
 */
export const getMigrationSummary = (data: IndexedDBData): MigrationSummary => {
  const totalRecords =
    data.income.length +
    data.expenses.length +
    data.loans.length +
    data.savings.length +
    (data.profile ? 1 : 0);

  // Estimate time: ~1 second per 10 records, minimum 5 seconds
  const estimatedSeconds = Math.max(5, Math.ceil(totalRecords / 10));
  const estimatedTime =
    estimatedSeconds < 60
      ? `~${estimatedSeconds} seconds`
      : `~${Math.ceil(estimatedSeconds / 60)} minutes`;

  return {
    totalRecords,
    breakdown: {
      income: data.income.length,
      expenses: data.expenses.length,
      loans: data.loans.length,
      savings: data.savings.length,
      profile: data.profile !== null,
    },
    estimatedTime,
  };
};
