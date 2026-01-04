/**
 * Validate Import Data
 * 
 * Validates imported data structure and fields before processing.
 * SECURITY: Ensures data structure is safe and valid.
 */

import type { Income, Expense, Loan, SavingsGoal, Profile } from '../../types';

export interface ImportData {
  income?: Income[];
  expenses?: Expense[];
  loans?: Loan[];
  savings?: SavingsGoal[];
  profile?: Profile;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    income?: number;
    expenses?: number;
    loans?: number;
    savings?: number;
    profile?: boolean;
  };
}

/**
 * Validate imported data structure
 * 
 * @param data - Imported data object
 * @returns Validation result with errors and summary
 */
export const validateImportData = (data: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const summary: ValidationResult['summary'] = {};

  // Check if data is an object
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: ['Invalid data format: Expected an object'],
      warnings: [],
      summary: {},
    };
  }

  // Handle both direct data and nested data.meta structure
  let importData: ImportData = {};
  
  if (data.meta && data.data) {
    // New format with meta
    importData = data.data;
  } else if (data.income || data.expenses || data.loans || data.savings) {
    // Direct data format
    importData = data;
  } else {
    return {
      valid: false,
      errors: ['Invalid data structure: Expected income, expenses, loans, or savings arrays'],
      warnings: [],
      summary: {},
    };
  }

  // Validate Income array
  if (importData.income !== undefined) {
    if (!Array.isArray(importData.income)) {
      errors.push('Income must be an array');
    } else {
      summary.income = importData.income.length;
      importData.income.forEach((item, index) => {
        if (!item.id || typeof item.id !== 'string') {
          errors.push(`Income[${index}]: Missing or invalid id`);
        }
        if (typeof item.amount !== 'number' || item.amount < 0) {
          errors.push(`Income[${index}]: Invalid amount`);
        }
        if (!item.type || !['recurring', 'one-time'].includes(item.type)) {
          errors.push(`Income[${index}]: Invalid type (must be 'recurring' or 'one-time')`);
        }
        if (!item.source || typeof item.source !== 'string') {
          errors.push(`Income[${index}]: Missing source`);
        }
        if (!item.date || typeof item.date !== 'string') {
          errors.push(`Income[${index}]: Missing or invalid date`);
        }
      });
    }
  }

  // Validate Expenses array
  if (importData.expenses !== undefined) {
    if (!Array.isArray(importData.expenses)) {
      errors.push('Expenses must be an array');
    } else {
      summary.expenses = importData.expenses.length;
      importData.expenses.forEach((item, index) => {
        if (!item.id || typeof item.id !== 'string') {
          errors.push(`Expense[${index}]: Missing or invalid id`);
        }
        if (typeof item.amount !== 'number' || item.amount < 0) {
          errors.push(`Expense[${index}]: Invalid amount`);
        }
        if (!item.category || typeof item.category !== 'string') {
          errors.push(`Expense[${index}]: Missing category`);
        }
        if (!item.date || typeof item.date !== 'string') {
          errors.push(`Expense[${index}]: Missing or invalid date`);
        }
        if (!item.paymentMethod || typeof item.paymentMethod !== 'string') {
          errors.push(`Expense[${index}]: Missing paymentMethod`);
        }
      });
    }
  }

  // Validate Loans array
  if (importData.loans !== undefined) {
    if (!Array.isArray(importData.loans)) {
      errors.push('Loans must be an array');
    } else {
      summary.loans = importData.loans.length;
      importData.loans.forEach((item, index) => {
        if (!item.id || typeof item.id !== 'string') {
          errors.push(`Loan[${index}]: Missing or invalid id`);
        }
        if (!item.name || typeof item.name !== 'string') {
          errors.push(`Loan[${index}]: Missing name`);
        }
        if (!item.type || !['taken', 'given'].includes(item.type)) {
          errors.push(`Loan[${index}]: Invalid type (must be 'taken' or 'given')`);
        }
        if (typeof item.principal !== 'number' || item.principal < 0) {
          errors.push(`Loan[${index}]: Invalid principal`);
        }
        if (typeof item.interestRate !== 'number' || item.interestRate < 0) {
          errors.push(`Loan[${index}]: Invalid interestRate`);
        }
        if (!item.interestType || !['flat', 'reducing'].includes(item.interestType)) {
          errors.push(`Loan[${index}]: Invalid interestType`);
        }
        if (typeof item.tenure !== 'number' || item.tenure < 1) {
          errors.push(`Loan[${index}]: Invalid tenure`);
        }
        if (typeof item.emi !== 'number' || item.emi < 0) {
          errors.push(`Loan[${index}]: Invalid emi`);
        }
        if (typeof item.outstandingBalance !== 'number' || item.outstandingBalance < 0) {
          errors.push(`Loan[${index}]: Invalid outstandingBalance`);
        }
        if (!item.startDate || typeof item.startDate !== 'string') {
          errors.push(`Loan[${index}]: Missing or invalid startDate`);
        }
        if (!item.status || !['Active', 'Closed'].includes(item.status)) {
          errors.push(`Loan[${index}]: Invalid status`);
        }
      });
    }
  }

  // Validate Savings Goals array
  if (importData.savings !== undefined) {
    if (!Array.isArray(importData.savings)) {
      errors.push('Savings must be an array');
    } else {
      summary.savings = importData.savings.length;
      importData.savings.forEach((item, index) => {
        if (!item.id || typeof item.id !== 'string') {
          errors.push(`Savings[${index}]: Missing or invalid id`);
        }
        if (!item.name || typeof item.name !== 'string') {
          errors.push(`Savings[${index}]: Missing name`);
        }
        if (typeof item.targetAmount !== 'number' || item.targetAmount < 0) {
          errors.push(`Savings[${index}]: Invalid targetAmount`);
        }
        if (!item.targetDate || typeof item.targetDate !== 'string') {
          errors.push(`Savings[${index}]: Missing or invalid targetDate`);
        }
        if (typeof item.currentSavings !== 'number' || item.currentSavings < 0) {
          errors.push(`Savings[${index}]: Invalid currentSavings`);
        }
        if (!item.priority || !['Low', 'Medium', 'High'].includes(item.priority)) {
          errors.push(`Savings[${index}]: Invalid priority`);
        }
      });
    }
  }

  // Validate Profile (optional)
  if (importData.profile) {
    if (typeof importData.profile !== 'object') {
      errors.push('Profile must be an object');
    } else {
      summary.profile = true;
      if (!importData.profile.id || typeof importData.profile.id !== 'string') {
        warnings.push('Profile: id will be replaced with current user id');
      }
      if (!importData.profile.currency || typeof importData.profile.currency !== 'string') {
        warnings.push('Profile: Missing currency, will use default');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary,
  };
};
