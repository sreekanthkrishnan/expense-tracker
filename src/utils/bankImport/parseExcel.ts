/**
 * Parse Excel Bank Statement
 * 
 * Parses Excel (.xlsx) files containing bank transactions.
 * Handles various Excel formats from different banks.
 */

import * as XLSX from 'xlsx';
import type { ParsedTransaction, ParseResult } from './types';

/**
 * Detect date format from value
 */
const parseDate = (value: any): string | null => {
  if (!value) return null;

  // Excel date serial number
  if (typeof value === 'number') {
    try {
      // Excel dates are days since 1900-01-01
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + value * 86400000);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {
      // Not an Excel date
    }
  }

  // String date
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  // Date object
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  return null;
};

/**
 * Parse amount from value
 */
const parseAmount = (value: any): number => {
  if (typeof value === 'number') {
    return Math.abs(value);
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,₹€£¥\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.abs(parsed);
  }
  return 0;
};

/**
 * Determine transaction type
 */
const determineType = (debit: number, credit: number): 'income' | 'expense' => {
  if (credit > 0) return 'income';
  if (debit > 0) return 'expense';
  return 'expense';
};

/**
 * Find column index by name patterns
 */
const findColumnIndex = (header: any[], patterns: string[]): number => {
  for (let i = 0; i < header.length; i++) {
    const cell = String(header[i] || '').toLowerCase();
    for (const pattern of patterns) {
      if (cell.includes(pattern)) {
        return i;
      }
    }
  }
  return -1;
};

/**
 * Parse Excel file
 * 
 * @param file - Excel file
 * @returns Parse result with transactions
 */
export const parseExcel = async (file: File): Promise<ParseResult> => {
  const result: ParseResult = {
    success: true,
    transactions: [],
    errors: [],
  };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Try to find the sheet with transaction data
    let worksheet = null;
    let sheetName = '';

    // Look for common sheet names
    const commonNames = ['Transactions', 'Statement', 'Data', 'Sheet1'];
    for (const name of commonNames) {
      if (workbook.SheetNames.includes(name)) {
        sheetName = name;
        worksheet = workbook.Sheets[name];
        break;
      }
    }

    // If not found, use first sheet
    if (!worksheet) {
      sheetName = workbook.SheetNames[0];
      worksheet = workbook.Sheets[sheetName];
    }

    if (!worksheet) {
      result.errors.push('No data found in Excel file');
      result.success = false;
      return result;
    }

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (jsonData.length < 2) {
      result.errors.push('Excel file appears to be empty or has no header');
      result.success = false;
      return result;
    }

    // Find header row (usually first row)
    const header = jsonData[0] as any[];

    // Find column indices
    const dateIndex = findColumnIndex(header, ['date', 'transaction date', 'txn date']);
    const descriptionIndex = findColumnIndex(header, [
      'description', 'narration', 'particulars', 'details', 'memo', 'remarks'
    ]);
    const debitIndex = findColumnIndex(header, ['debit', 'withdrawal', 'out', 'paid']);
    const creditIndex = findColumnIndex(header, ['credit', 'deposit', 'in', 'received']);
    const amountIndex = findColumnIndex(header, ['amount']);
    const referenceIndex = findColumnIndex(header, ['reference', 'transaction id', 'ref', 'txn id']);

    if (dateIndex === -1) {
      result.errors.push('Could not find date column in Excel file');
      result.success = false;
      return result;
    }

    // Parse rows
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      
      if (!row || row.length < 2) continue;

      const date = parseDate(row[dateIndex]);
      if (!date) {
        result.errors.push(`Row ${i + 1}: Invalid date`);
        continue;
      }

      const description = String(row[descriptionIndex] || row[descriptionIndex !== -1 ? descriptionIndex : 1] || 'Unknown').trim();
      
      // Get amounts
      let debit = 0;
      let credit = 0;

      if (debitIndex !== -1) {
        debit = parseAmount(row[debitIndex]);
      }
      if (creditIndex !== -1) {
        credit = parseAmount(row[creditIndex]);
      }
      if (amountIndex !== -1 && debit === 0 && credit === 0) {
        const amount = parseAmount(row[amountIndex]);
        if (amount > 0) credit = amount;
        else debit = Math.abs(amount);
      }

      const finalAmount = Math.max(debit, credit);
      const type = determineType(debit, credit);

      if (finalAmount === 0) {
        result.errors.push(`Row ${i + 1}: Zero amount, skipping`);
        continue;
      }

      const transaction: ParsedTransaction = {
        date,
        description,
        amount: finalAmount,
        type,
        source: 'bank_statement',
        reference: referenceIndex !== -1 ? String(row[referenceIndex] || '') : undefined,
        rawDebit: debit > 0 ? debit : undefined,
        rawCredit: credit > 0 ? credit : undefined,
        rowIndex: i + 1,
      };

      result.transactions.push(transaction);
    }

    if (result.transactions.length === 0) {
      result.errors.push('No valid transactions found in Excel file');
      result.success = false;
    }
  } catch (error) {
    result.success = false;
    result.errors.push(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
};
