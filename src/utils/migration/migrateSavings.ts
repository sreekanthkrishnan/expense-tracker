/**
 * Migrate Savings Goals Data
 * 
 * Migrates savings goal records from IndexedDB to Supabase.
 * SECURITY: Never trusts user_id from IndexedDB - always uses current user.
 */

import * as savingsService from '../../services/savingsService';
import type { SavingsGoal } from '../../types';

export interface MigrationResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Migrate savings goal records to Supabase
 * 
 * @param savingsRecords - Savings goal records from IndexedDB
 * @returns Migration result with success/failure counts
 */
export const migrateSavings = async (savingsRecords: SavingsGoal[]): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  if (!savingsRecords || savingsRecords.length === 0) {
    return result;
  }

  // Process each savings goal record
  for (const savings of savingsRecords) {
    try {
      // Strip any user_id if present (security)
      const { id, user_id, userId, ...savingsData } = savings as any;

      // Generate new ID to avoid conflicts
      const newSavings: Omit<SavingsGoal, 'id'> = {
        ...savingsData,
        // Ensure all required fields are present
        name: savingsData.name || 'Unnamed Goal',
        targetAmount: savingsData.targetAmount || 0,
        targetDate: savingsData.targetDate || new Date().toISOString().split('T')[0],
        currentSavings: savingsData.currentSavings || 0,
        priority: savingsData.priority || 'Medium',
      };

      // Insert into Supabase (user_id automatically set by RLS)
      await savingsService.createSavingsGoal(newSavings);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push(
        `Failed to migrate savings goal "${savings.name || 'Unknown'}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return result;
};
