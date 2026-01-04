/**
 * Import Service
 * 
 * Handles importing data into Supabase with proper user isolation.
 * SECURITY: Always uses current user's ID, never trusts imported user_id.
 */

import { supabase } from '../lib/supabaseClient';
import type { Income, Expense, Loan, SavingsGoal, Profile } from '../types';
import * as incomeService from './incomeService';
import * as expensesService from './expensesService';
import * as loanService from './loanService';
import * as savingsService from './savingsService';
import * as profileService from './profileService';

export interface ImportData {
  income?: Income[];
  expenses?: Expense[];
  loans?: Loan[];
  savings?: SavingsGoal[];
  profile?: Profile;
}

export interface ImportMode {
  type: 'merge' | 'replace';
}

export interface ImportProgress {
  total: number;
  completed: number;
  current: string;
}

export interface ImportReport {
  success: boolean;
  imported: {
    income: number;
    expenses: number;
    loans: number;
    savings: number;
    profile: boolean;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Delete all user data (for replace mode)
 * SECURITY: RLS ensures only current user's data is deleted
 */
const deleteAllUserData = async (): Promise<void> => {
  // Delete all user's data (RLS automatically filters by user_id)
  // Using .neq() with a condition that's always true to delete all matching rows
  const { error: expensesError } = await supabase.from('expenses').delete().neq('id', '');
  const { error: incomesError } = await supabase.from('incomes').delete().neq('id', '');
  const { error: loansError } = await supabase.from('loans').delete().neq('id', '');
  const { error: savingsError } = await supabase.from('savings').delete().neq('id', '');

  // Log errors but don't throw - partial deletion is acceptable
  if (expensesError) console.warn('Error deleting expenses:', expensesError);
  if (incomesError) console.warn('Error deleting incomes:', incomesError);
  if (loansError) console.warn('Error deleting loans:', loansError);
  if (savingsError) console.warn('Error deleting savings:', savingsError);
};

/**
 * Import data into Supabase
 * 
 * @param data - Data to import
 * @param mode - Import mode (merge or replace)
 * @param userId - Current user's ID (required for profile)
 * @param onProgress - Optional progress callback
 * @returns Import report
 */
export const importData = async (
  data: ImportData,
  mode: ImportMode,
  userId: string,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportReport> => {
  const report: ImportReport = {
    success: true,
    imported: {
      income: 0,
      expenses: 0,
      loans: 0,
      savings: 0,
      profile: false,
    },
    errors: [],
    warnings: [],
  };

  try {
    // If replace mode, delete all existing data first
    if (mode.type === 'replace') {
      if (onProgress) {
        onProgress({ total: 100, completed: 0, current: 'Deleting existing data...' });
      }
      await deleteAllUserData();
    }

    let totalSteps = 0;
    let completedSteps = 0;

    // Count total steps
    if (data.income) totalSteps += data.income.length;
    if (data.expenses) totalSteps += data.expenses.length;
    if (data.loans) totalSteps += data.loans.length;
    if (data.savings) totalSteps += data.savings.length;
    if (data.profile) totalSteps += 1;

    // Import Income
    if (data.income && data.income.length > 0) {
      for (const income of data.income) {
        try {
          const { id, ...incomeData } = income;
          // Generate new ID to avoid conflicts
          const newIncome = { ...incomeData, id: `income-${Date.now()}-${Math.random()}` };
          await incomeService.createIncome(newIncome);
          report.imported.income++;
          completedSteps++;
          if (onProgress) {
            onProgress({
              total: totalSteps,
              completed: completedSteps,
              current: `Importing income: ${income.source}`,
            });
          }
        } catch (error) {
          report.errors.push(`Failed to import income "${income.source}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Import Expenses
    if (data.expenses && data.expenses.length > 0) {
      for (const expense of data.expenses) {
        try {
          const { id, ...expenseData } = expense;
          const newExpense = { ...expenseData, id: `expense-${Date.now()}-${Math.random()}` };
          await expensesService.createExpense(newExpense);
          report.imported.expenses++;
          completedSteps++;
          if (onProgress) {
            onProgress({
              total: totalSteps,
              completed: completedSteps,
              current: `Importing expense: ${expense.category}`,
            });
          }
        } catch (error) {
          report.errors.push(`Failed to import expense "${expense.category}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Import Loans
    if (data.loans && data.loans.length > 0) {
      for (const loan of data.loans) {
        try {
          const { id, ...loanData } = loan;
          const newLoan = { ...loanData, id: `loan-${Date.now()}-${Math.random()}` };
          await loanService.createLoan(newLoan);
          report.imported.loans++;
          completedSteps++;
          if (onProgress) {
            onProgress({
              total: totalSteps,
              completed: completedSteps,
              current: `Importing loan: ${loan.name}`,
            });
          }
        } catch (error) {
          report.errors.push(`Failed to import loan "${loan.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Import Savings Goals
    if (data.savings && data.savings.length > 0) {
      for (const savings of data.savings) {
        try {
          const { id, ...savingsData } = savings;
          const newSavings = { ...savingsData, id: `savings-${Date.now()}-${Math.random()}` };
          await savingsService.createSavingsGoal(newSavings);
          report.imported.savings++;
          completedSteps++;
          if (onProgress) {
            onProgress({
              total: totalSteps,
              completed: completedSteps,
              current: `Importing savings goal: ${savings.name}`,
            });
          }
        } catch (error) {
          report.errors.push(`Failed to import savings goal "${savings.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Import Profile
    if (data.profile) {
      try {
        const profile: Profile = {
          ...data.profile,
          id: userId, // Always use current user's ID
        };
        await profileService.upsertProfile(profile);
        report.imported.profile = true;
        completedSteps++;
        if (onProgress) {
          onProgress({
            total: totalSteps,
            completed: completedSteps,
            current: 'Importing profile...',
          });
        }
      } catch (error) {
        report.errors.push(`Failed to import profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    report.success = report.errors.length === 0;
  } catch (error) {
    report.success = false;
    report.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return report;
};
