/**
 * Migrate Income Data
 * 
 * Migrates income records from IndexedDB to Supabase.
 * SECURITY: Never trusts user_id from IndexedDB - always uses current user.
 */

import * as incomeService from '../../services/incomeService';
import type { Income } from '../../types';

export interface MigrationResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Migrate income records to Supabase
 * 
 * @param incomeRecords - Income records from IndexedDB
 * @returns Migration result with success/failure counts
 */
export const migrateIncome = async (incomeRecords: Income[]): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  if (!incomeRecords || incomeRecords.length === 0) {
    return result;
  }

  // Process each income record
  for (const income of incomeRecords) {
    try {
      // Strip any user_id if present (security)
      const { id, user_id, userId, ...incomeData } = income as any;

      // Generate new ID to avoid conflicts
      const newIncome: Omit<Income, 'id'> = {
        ...incomeData,
        // Ensure all required fields are present
        amount: incomeData.amount || 0,
        type: incomeData.type || 'one-time',
        source: incomeData.source || 'Unknown',
        date: incomeData.date || new Date().toISOString().split('T')[0],
      };

      // Insert into Supabase (user_id automatically set by RLS)
      await incomeService.createIncome(newIncome);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push(
        `Failed to migrate income "${income.source || 'Unknown'}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return result;
};
