/**
 * Import Data from Excel
 * 
 * Parses Excel file and converts to application data format.
 * SECURITY: Never trusts user_id from file - always uses current user.
 */

import * as XLSX from 'xlsx';
import { validateImportData } from './validateImportData';
import type { ImportData } from './validateImportData';
import type { Income, Expense, Loan, SavingsGoal, Profile } from '../../types';

export interface ImportResult {
  success: boolean;
  data?: ImportData;
  errors: string[];
  warnings: string[];
  summary?: {
    income?: number;
    expenses?: number;
    loans?: number;
    savings?: number;
    profile?: boolean;
  };
}

/**
 * Import data from Excel file
 * 
 * @param file - Excel file to import
 * @returns Promise with import result
 */
export const importFromExcel = async (file: File): Promise<ImportResult> => {
  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const importData: ImportData = {};
    const errors: string[] = [];
    const warnings: string[] = [];

    // Helper to read sheet data
    const readSheet = (sheetName: string): any[] => {
      if (!workbook.SheetNames.includes(sheetName)) {
        return [];
      }
      const worksheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(worksheet);
    };

    // Read Income sheet
    const incomeRows = readSheet('Income');
    if (incomeRows.length > 0) {
      importData.income = incomeRows.map((row: any) => {
        // Remove user_id if present
        const { user_id, userId, ...rest } = row;
        return {
          id: rest.id || `income-${Date.now()}-${Math.random()}`,
          amount: parseFloat(rest.amount) || 0,
          type: rest.type || 'one-time',
          source: rest.source || '',
          date: rest.date || new Date().toISOString().split('T')[0],
          recurringFrequency: rest.recurringFrequency || rest.recurring_frequency || undefined,
          notes: rest.notes || undefined,
        } as Income;
      });
    }

    // Read Expenses sheet
    const expenseRows = readSheet('Expenses');
    if (expenseRows.length > 0) {
      importData.expenses = expenseRows.map((row: any) => {
        const { user_id, userId, ...rest } = row;
        return {
          id: rest.id || `expense-${Date.now()}-${Math.random()}`,
          amount: parseFloat(rest.amount) || 0,
          category: rest.category || '',
          date: rest.date || new Date().toISOString().split('T')[0],
          paymentMethod: rest.paymentMethod || rest.payment_method || 'Cash',
          notes: rest.notes || undefined,
        } as Expense;
      });
    }

    // Read Loans sheet
    const loanRows = readSheet('Loans');
    if (loanRows.length > 0) {
      importData.loans = loanRows.map((row: any) => {
        const { user_id, userId, ...rest } = row;
        return {
          id: rest.id || `loan-${Date.now()}-${Math.random()}`,
          name: rest.name || '',
          type: rest.type || 'taken',
          principal: parseFloat(rest.principal) || 0,
          interestRate: parseFloat(rest.interestRate) || parseFloat(rest.interest_rate) || 0,
          interestType: rest.interestType || rest.interest_type || 'reducing',
          tenure: parseInt(rest.tenure) || 0,
          emi: parseFloat(rest.emi) || 0,
          outstandingBalance: parseFloat(rest.outstandingBalance) || parseFloat(rest.outstanding_balance) || 0,
          startDate: rest.startDate || rest.start_date || new Date().toISOString().split('T')[0],
          status: rest.status || 'Active',
          notes: rest.notes || undefined,
        } as Loan;
      });
    }

    // Read Savings sheet
    const savingsRows = readSheet('Savings');
    if (savingsRows.length > 0) {
      importData.savings = savingsRows.map((row: any) => {
        const { user_id, userId, ...rest } = row;
        return {
          id: rest.id || `savings-${Date.now()}-${Math.random()}`,
          name: rest.name || '',
          targetAmount: parseFloat(rest.targetAmount) || parseFloat(rest.target_amount) || 0,
          targetDate: rest.targetDate || rest.target_date || new Date().toISOString().split('T')[0],
          currentSavings: parseFloat(rest.currentSavings) || parseFloat(rest.current_savings) || 0,
          priority: rest.priority || 'Medium',
          status: rest.status || undefined,
          monthlySavingRequired: rest.monthlySavingRequired || rest.monthly_saving_required ? parseFloat(rest.monthlySavingRequired || rest.monthly_saving_required) : undefined,
          feasibilityScore: rest.feasibilityScore || rest.feasibility_score ? parseFloat(rest.feasibilityScore || rest.feasibility_score) : undefined,
        } as SavingsGoal;
      });
    }

    // Read Profile sheet (optional)
    const profileRows = readSheet('Profile');
    if (profileRows.length > 0) {
      const profileRow = profileRows[0];
      const { user_id, userId, ...rest } = profileRow;
      importData.profile = {
        id: '', // Will be set to current user's ID
        name: rest.name || '',
        currency: rest.currency || 'USD',
        monthlyIncome: parseFloat(rest.monthlyIncome) || parseFloat(rest.monthly_income) || 0,
        riskLevel: rest.riskLevel || rest.risk_level || 'Medium',
      } as Profile;
    }

    // Validate imported data
    const validation = validateImportData(importData);

    if (!validation.valid) {
      return {
        success: false,
        data: importData,
        errors: [...errors, ...validation.errors],
        warnings: [...warnings, ...validation.warnings],
        summary: validation.summary,
      };
    }

    return {
      success: true,
      data: importData,
      errors: [],
      warnings: validation.warnings,
      summary: validation.summary,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to import Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
    };
  }
};
