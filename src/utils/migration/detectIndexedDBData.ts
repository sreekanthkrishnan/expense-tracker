/**
 * Detect IndexedDB Data
 * 
 * Checks if IndexedDB contains any user data that needs migration.
 * SECURITY: Only detects data, never migrates without user consent.
 */

import { dbGetAll } from '../indexedDB';
import type { Income, Expense, Loan, SavingsGoal, Profile } from '../../types';

export interface IndexedDBData {
  income: Income[];
  expenses: Expense[];
  loans: Loan[];
  savings: SavingsGoal[];
  profile: Profile | null;
}

export interface DataSummary {
  hasData: boolean;
  counts: {
    income: number;
    expenses: number;
    loans: number;
    savings: number;
    hasProfile: boolean;
  };
}

/**
 * Check if IndexedDB has any data
 * 
 * @returns Promise with data summary
 */
export const detectIndexedDBData = async (): Promise<DataSummary> => {
  try {
    const [income, expenses, loans, savings, profile] = await Promise.all([
      dbGetAll<Income>('income').catch(() => []),
      dbGetAll<Expense>('expenses').catch(() => []),
      dbGetAll<Loan>('loans').catch(() => []),
      dbGetAll<SavingsGoal>('savingsGoals').catch(() => []),
      dbGetAll<Profile>('profile').catch(() => []),
    ]);

    const profileData = profile.length > 0 ? profile[0] : null;

    const counts = {
      income: income.length,
      expenses: expenses.length,
      loans: loans.length,
      savings: savings.length,
      hasProfile: profileData !== null,
    };

    const hasData =
      counts.income > 0 ||
      counts.expenses > 0 ||
      counts.loans > 0 ||
      counts.savings > 0 ||
      counts.hasProfile;

    return {
      hasData,
      counts,
    };
  } catch (error) {
    console.error('Error detecting IndexedDB data:', error);
    return {
      hasData: false,
      counts: {
        income: 0,
        expenses: 0,
        loans: 0,
        savings: 0,
        hasProfile: false,
      },
    };
  }
};

/**
 * Get all IndexedDB data for migration
 * 
 * @returns Promise with all IndexedDB data
 */
export const getAllIndexedDBData = async (): Promise<IndexedDBData> => {
  try {
    const [income, expenses, loans, savings, profile] = await Promise.all([
      dbGetAll<Income>('income').catch(() => []),
      dbGetAll<Expense>('expenses').catch(() => []),
      dbGetAll<Loan>('loans').catch(() => []),
      dbGetAll<SavingsGoal>('savingsGoals').catch(() => []),
      dbGetAll<Profile>('profile').catch(() => []),
    ]);

    return {
      income: income || [],
      expenses: expenses || [],
      loans: loans || [],
      savings: savings || [],
      profile: profile.length > 0 ? profile[0] : null,
    };
  } catch (error) {
    console.error('Error getting IndexedDB data:', error);
    return {
      income: [],
      expenses: [],
      loans: [],
      savings: [],
      profile: null,
    };
  }
};
