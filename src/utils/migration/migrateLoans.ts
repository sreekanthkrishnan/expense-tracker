/**
 * Migrate Loans Data
 * 
 * Migrates loan records from IndexedDB to Supabase.
 * SECURITY: Never trusts user_id from IndexedDB - always uses current user.
 */

import * as loanService from '../../services/loanService';
import type { Loan } from '../../types';

export interface MigrationResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Migrate loan records to Supabase
 * 
 * @param loanRecords - Loan records from IndexedDB
 * @returns Migration result with success/failure counts
 */
export const migrateLoans = async (loanRecords: Loan[]): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  if (!loanRecords || loanRecords.length === 0) {
    return result;
  }

  // Process each loan record
  for (const loan of loanRecords) {
    try {
      // Strip any user_id if present (security)
      const { id, user_id, userId, ...loanData } = loan as any;

      // Generate new ID to avoid conflicts
      const newLoan: Omit<Loan, 'id'> = {
        ...loanData,
        // Ensure all required fields are present
        name: loanData.name || 'Unnamed Loan',
        type: loanData.type || 'taken',
        principal: loanData.principal || 0,
        interestRate: loanData.interestRate || 0,
        interestType: loanData.interestType || 'reducing',
        tenure: loanData.tenure || 0,
        emi: loanData.emi || 0,
        outstandingBalance: loanData.outstandingBalance || loanData.principal || 0,
        startDate: loanData.startDate || new Date().toISOString().split('T')[0],
        status: loanData.status || 'Active',
      };

      // Insert into Supabase (user_id automatically set by RLS)
      await loanService.createLoan(newLoan);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push(
        `Failed to migrate loan "${loan.name || 'Unknown'}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return result;
};
