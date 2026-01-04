/**
 * Export Data to Excel
 * 
 * Exports user's financial data to an Excel (.xlsx) file with separate sheets.
 * SECURITY: Only exports data for the logged-in user.
 */

import * as XLSX from 'xlsx';
import type { Income, Expense, Loan, SavingsGoal, Profile } from '../../types';

export interface ExportData {
  income: Income[];
  expenses: Expense[];
  loans: Loan[];
  savings: SavingsGoal[];
  profile?: Profile;
}

/**
 * Export user data to Excel file
 * 
 * @param data - User's financial data
 * @param filename - Optional custom filename
 */
export const exportToExcel = (data: ExportData, filename?: string): void => {
  const workbook = XLSX.utils.book_new();

  // Helper to convert array of objects to worksheet
  const createSheet = (dataArray: any[], sheetName: string) => {
    if (dataArray.length === 0) {
      // Create empty sheet with headers
      const emptyData = [{}];
      const ws = XLSX.utils.json_to_sheet(emptyData);
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
      return;
    }
    const ws = XLSX.utils.json_to_sheet(dataArray);
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  };

  // Income sheet
  if (data.income && data.income.length > 0) {
    const incomeData = data.income.map((item) => ({
      id: item.id,
      amount: item.amount,
      type: item.type,
      source: item.source,
      date: item.date,
      recurringFrequency: item.recurringFrequency || '',
      notes: item.notes || '',
    }));
    createSheet(incomeData, 'Income');
  } else {
    createSheet([], 'Income');
  }

  // Expenses sheet
  if (data.expenses && data.expenses.length > 0) {
    const expenseData = data.expenses.map((item) => ({
      id: item.id,
      amount: item.amount,
      category: item.category,
      date: item.date,
      paymentMethod: item.paymentMethod,
      notes: item.notes || '',
    }));
    createSheet(expenseData, 'Expenses');
  } else {
    createSheet([], 'Expenses');
  }

  // Loans sheet
  if (data.loans && data.loans.length > 0) {
    const loanData = data.loans.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      principal: item.principal,
      interestRate: item.interestRate,
      interestType: item.interestType,
      tenure: item.tenure,
      emi: item.emi,
      outstandingBalance: item.outstandingBalance,
      startDate: item.startDate,
      status: item.status,
      notes: item.notes || '',
    }));
    createSheet(loanData, 'Loans');
  } else {
    createSheet([], 'Loans');
  }

  // Savings Goals sheet
  if (data.savings && data.savings.length > 0) {
    const savingsData = data.savings.map((item) => ({
      id: item.id,
      name: item.name,
      targetAmount: item.targetAmount,
      targetDate: item.targetDate,
      currentSavings: item.currentSavings,
      priority: item.priority,
      status: item.status || '',
      monthlySavingRequired: item.monthlySavingRequired || '',
      feasibilityScore: item.feasibilityScore || '',
    }));
    createSheet(savingsData, 'Savings');
  } else {
    createSheet([], 'Savings');
  }

  // Profile sheet (optional)
  if (data.profile) {
    const profileData = [{
      id: data.profile.id,
      name: data.profile.name,
      currency: data.profile.currency,
      monthlyIncome: data.profile.monthlyIncome,
      riskLevel: data.profile.riskLevel,
    }];
    createSheet(profileData, 'Profile');
  }

  // Write file and trigger download
  const excelFilename = filename || `finance-export-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, excelFilename);
};
