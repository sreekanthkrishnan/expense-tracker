/**
 * Migrate Expenses Data
 * 
 * Migrates expense records from IndexedDB to Supabase.
 * SECURITY: Never trusts user_id from IndexedDB - always uses current user.
 */

import * as expensesService from '../../services/expensesService';
import type { Expense } from '../../types';

export interface MigrationResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Migrate expense records to Supabase
 * 
 * @param expenseRecords - Expense records from IndexedDB
 * @returns Migration result with success/failure counts
 */
export const migrateExpenses = async (expenseRecords: Expense[]): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  if (!expenseRecords || expenseRecords.length === 0) {
    return result;
  }

  // Process each expense record
  for (const expense of expenseRecords) {
    try {
      // Strip any user_id if present (security)
      const { id, user_id, userId, ...expenseData } = expense as any;

      // Generate new ID to avoid conflicts
      const newExpense: Omit<Expense, 'id'> = {
        ...expenseData,
        // Ensure all required fields are present
        amount: expenseData.amount || 0,
        category: expenseData.category || 'Other',
        date: expenseData.date || new Date().toISOString().split('T')[0],
        paymentMethod: expenseData.paymentMethod || 'Cash',
      };

      // Insert into Supabase (user_id automatically set by RLS)
      await expensesService.createExpense(newExpense);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push(
        `Failed to migrate expense "${expense.category || 'Unknown'}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return result;
};
