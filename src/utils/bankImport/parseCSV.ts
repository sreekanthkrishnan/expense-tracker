/**
 * Parse CSV Bank Statement
 * 
 * Parses CSV files containing bank transactions.
 * Handles various CSV formats from different banks.
 */

import type { ParsedTransaction, ParseResult } from './types';

/**
 * Detect date format from string
 */
const parseDate = (dateStr: string): string | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;

  // Try common formats
  const formats = [
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
    /(\d{2})\/(\d{2})\/(\d{2})/, // MM/DD/YY
    /(\d{2})-(\d{2})-(\d{4})/, // MM-DD-YYYY
    /(\d{2})-(\d{2})-(\d{2})/, // MM-DD-YY
  ];

  for (const format of formats) {
    const match = dateStr.trim().match(format);
    if (match) {
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch {
        continue;
      }
    }
  }

  return null;
};

/**
 * Parse amount from string
 */
const parseAmount = (amountStr: string): number => {
  if (!amountStr) return 0;
  
  // Remove currency symbols, commas, spaces
  const cleaned = amountStr.toString().replace(/[$,₹€£¥\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : Math.abs(parsed);
};

/**
 * Determine transaction type from amount columns
 */
const determineType = (debit: number, credit: number): 'income' | 'expense' => {
  if (credit > 0) return 'income';
  if (debit > 0) return 'expense';
  return 'expense'; // Default
};

/**
 * Parse CSV file content
 * 
 * @param csvText - CSV file content as string
 * @returns Parse result with transactions
 */
export const parseCSV = (csvText: string): ParseResult => {
  const result: ParseResult = {
    success: true,
    transactions: [],
    errors: [],
  };

  try {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      result.errors.push('CSV file appears to be empty or has no header');
      result.success = false;
      return result;
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Find column indices
    const dateIndex = header.findIndex(h => 
      h.includes('date') || h.includes('transaction date')
    );
    const descriptionIndex = header.findIndex(h => 
      h.includes('description') || h.includes('narration') || h.includes('particulars') || 
      h.includes('details') || h.includes('memo')
    );
    const debitIndex = header.findIndex(h => 
      h.includes('debit') || h.includes('withdrawal') || h.includes('out')
    );
    const creditIndex = header.findIndex(h => 
      h.includes('credit') || h.includes('deposit') || h.includes('in')
    );
    const amountIndex = header.findIndex(h => 
      h.includes('amount') && !h.includes('debit') && !h.includes('credit')
    );
    const referenceIndex = header.findIndex(h => 
      h.includes('reference') || h.includes('transaction id') || h.includes('ref')
    );

    if (dateIndex === -1) {
      result.errors.push('Could not find date column in CSV');
      result.success = false;
      return result;
    }

    // Parse rows
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim());
      
      if (row.length < 2) continue; // Skip empty rows

      const dateStr = row[dateIndex];
      const date = parseDate(dateStr);
      
      if (!date) {
        result.errors.push(`Row ${i + 1}: Invalid date format`);
        continue;
      }

      const description = row[descriptionIndex] || row[descriptionIndex !== -1 ? descriptionIndex : 1] || 'Unknown';
      
      // Try to get debit/credit amounts
      let debit = 0;
      let credit = 0;
      let amount = 0;

      if (debitIndex !== -1) {
        debit = parseAmount(row[debitIndex]);
      }
      if (creditIndex !== -1) {
        credit = parseAmount(row[creditIndex]);
      }
      if (amountIndex !== -1 && debit === 0 && credit === 0) {
        amount = parseAmount(row[amountIndex]);
        // If single amount column, assume negative = expense, positive = income
        if (amount > 0) credit = amount;
        else debit = Math.abs(amount);
      }

      // Determine final amount and type
      const finalAmount = Math.max(debit, credit);
      const type = determineType(debit, credit);

      if (finalAmount === 0) {
        result.errors.push(`Row ${i + 1}: Zero amount, skipping`);
        continue;
      }

      const transaction: ParsedTransaction = {
        date,
        description: description.replace(/"/g, ''), // Remove quotes
        amount: finalAmount,
        type,
        source: 'bank_statement',
        reference: referenceIndex !== -1 ? row[referenceIndex] : undefined,
        rawDebit: debit > 0 ? debit : undefined,
        rawCredit: credit > 0 ? credit : undefined,
        rowIndex: i + 1,
      };

      result.transactions.push(transaction);
    }

    if (result.transactions.length === 0) {
      result.errors.push('No valid transactions found in CSV');
      result.success = false;
    }
  } catch (error) {
    result.success = false;
    result.errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
};
