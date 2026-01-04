/**
 * Bank Statement Import Types
 * 
 * Type definitions for bank statement parsing and import.
 */

export interface ParsedTransaction {
  date: string; // ISO date string
  description: string;
  amount: number; // Always positive
  type: 'income' | 'expense';
  category?: string;
  reference?: string;
  source: 'bank_statement';
  // Internal fields for processing
  rawDebit?: number;
  rawCredit?: number;
  rowIndex?: number; // Original row in file
}

export interface ImportPreviewRow extends ParsedTransaction {
  id: string; // Temporary ID for UI
  include: boolean; // User selection
  isDuplicate?: boolean; // Detected duplicate
  duplicateOf?: string; // ID of existing duplicate
}

export interface ParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  errors: string[];
}

export interface ImportResult {
  success: boolean;
  imported: {
    income: number;
    expenses: number;
  };
  skipped: {
    duplicates: number;
    excluded: number;
  };
  errors: string[];
}
