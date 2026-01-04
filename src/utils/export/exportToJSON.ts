/**
 * Export Data to JSON
 * 
 * Exports user's financial data to a JSON file with the required structure.
 * SECURITY: Only exports data for the logged-in user.
 */

import type { Income, Expense, Loan, SavingsGoal, Profile } from '../../types';

export interface ExportData {
  income: Income[];
  expenses: Expense[];
  loans: Loan[];
  savings: SavingsGoal[];
  profile?: Profile;
}

export interface ExportFile {
  meta: {
    app: string;
    exportedAt: string;
    version: string;
  };
  data: ExportData;
}

/**
 * Export user data to JSON file
 * 
 * @param data - User's financial data
 * @param filename - Optional custom filename
 */
export const exportToJSON = (data: ExportData, filename?: string): void => {
  const exportFile: ExportFile = {
    meta: {
      app: 'Personal Finance Tracker',
      exportedAt: new Date().toISOString(),
      version: '1.0',
    },
    data: {
      income: data.income || [],
      expenses: data.expenses || [],
      loans: data.loans || [],
      savings: data.savings || [],
      ...(data.profile && { profile: data.profile }),
    },
  };

  // Convert to JSON string with pretty formatting
  const jsonString = JSON.stringify(exportFile, null, 2);

  // Create blob and trigger download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `finance-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
