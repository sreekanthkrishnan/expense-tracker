/**
 * Parse password-protected PDF bank statement
 * 
 * SECURITY: Password is only used for parsing and is never stored or logged.
 * Password parameter should be cleared from memory after use.
 * 
 * @param file - PDF file to parse
 * @param password - Password to unlock the PDF (used only for parsing)
 * @returns Parse result with transactions
 */

import type { ParseResult, ParsedTransaction } from './types';

/**
 * Parse date from string (supports multiple formats)
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
const parseAmount = (amountStr: string | number): number => {
  if (!amountStr) return 0;
  
  if (typeof amountStr === 'number') {
    return Math.abs(amountStr);
  }
  
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

interface PDFTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Extract text from PDF page
 */
const extractTextFromPage = async (page: any): Promise<string[][]> => {
  const textContent = await page.getTextContent();
  const items = textContent.items as PDFTextItem[];
  
  // Group items by approximate row (y-coordinate)
  const rows: { [key: number]: PDFTextItem[] } = {};
  const rowTolerance = 2; // Pixels
  
  for (const item of items) {
    const rowKey = Math.round(item.y / rowTolerance) * rowTolerance;
    if (!rows[rowKey]) {
      rows[rowKey] = [];
    }
    rows[rowKey].push(item);
  }
  
  // Sort rows by y-coordinate (top to bottom)
  const sortedRows = Object.keys(rows)
    .map(Number)
    .sort((a, b) => b - a) // Higher y = top of page
    .map(key => rows[key]);
  
  // Convert each row to array of strings
  return sortedRows.map(row => {
    // Sort items in row by x-coordinate (left to right)
    const sorted = row.sort((a, b) => a.x - b.x);
    return sorted.map(item => item.str.trim()).filter(str => str.length > 0);
  });
};

/**
 * Find column indices in header row
 */
const findColumnIndex = (row: string[], keywords: string[]): number => {
  for (let i = 0; i < row.length; i++) {
    const cell = row[i].toLowerCase();
    for (const keyword of keywords) {
      if (cell.includes(keyword.toLowerCase())) {
        return i;
      }
    }
  }
  return -1;
};

/**
 * Parse PDF bank statement
 */
export const parseProtectedPDF = async (
  file: File,
  password?: string
): Promise<ParseResult> => {
  const result: ParseResult = {
    success: true,
    transactions: [],
    errors: [],
  };

  try {
    // Dynamically import pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source (required for pdfjs-dist)
    // Use worker from the installed package, compatible with Vite
    // Import worker as a module for Vite to handle properly
    const workerUrl = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.default;
    
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF with optional password
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      password: password || '', // Empty string if no password
    });
    
    let pdf;
    try {
      pdf = await loadingTask.promise;
    } catch (error: any) {
      if (
        error?.name === 'PasswordException' ||
        error?.message?.includes('password') ||
        error?.code === 2
      ) {
        result.success = false;
        result.errors.push('PDF is password-protected. Please provide the password.');
        return result;
      }
      throw error;
    }
    
    if (!pdf) {
      result.success = false;
      result.errors.push('Failed to load PDF document');
      return result;
    }
    
    // Extract text from all pages
    const allRows: string[][] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const pageRows = await extractTextFromPage(page);
      allRows.push(...pageRows);
    }
    
    if (allRows.length < 2) {
      result.success = false;
      result.errors.push('PDF appears to be empty or has no readable text');
      return result;
    }
    
    // Find header row (usually first non-empty row)
    let headerRow: string[] = [];
    let headerIndex = -1;
    
    for (let i = 0; i < Math.min(5, allRows.length); i++) {
      const row = allRows[i];
      if (row.length >= 3) {
        // Check if this looks like a header (contains common column names)
        const rowText = row.join(' ').toLowerCase();
        if (
          rowText.includes('date') ||
          rowText.includes('description') ||
          rowText.includes('amount') ||
          rowText.includes('debit') ||
          rowText.includes('credit')
        ) {
          headerRow = row;
          headerIndex = i;
          break;
        }
      }
    }
    
    // If no header found, use first row
    if (headerIndex === -1 && allRows.length > 0) {
      headerRow = allRows[0];
      headerIndex = 0;
    }
    
    if (headerRow.length < 2) {
      result.success = false;
      result.errors.push('Could not find header row in PDF');
      return result;
    }
    
    // Find column indices
    const dateIndex = findColumnIndex(headerRow, ['date', 'transaction date', 'txn date']);
    const descriptionIndex = findColumnIndex(headerRow, [
      'description', 'narration', 'particulars', 'details', 'memo', 'remarks'
    ]);
    const debitIndex = findColumnIndex(headerRow, ['debit', 'withdrawal', 'out', 'paid']);
    const creditIndex = findColumnIndex(headerRow, ['credit', 'deposit', 'in', 'received']);
    const amountIndex = findColumnIndex(headerRow, ['amount']);
    const referenceIndex = findColumnIndex(headerRow, ['reference', 'ref', 'transaction id', 'txn id']);
    
    if (dateIndex === -1) {
      result.success = false;
      result.errors.push('Could not find date column in PDF');
      return result;
    }
    
    // Parse data rows (skip header)
    for (let i = headerIndex + 1; i < allRows.length; i++) {
      const row = allRows[i];
      
      if (row.length < 2) continue; // Skip empty rows
      
      // Get date
      const dateStr = row[dateIndex] || row[0] || '';
      const date = parseDate(dateStr);
      
      if (!date) {
        // Skip rows without valid date
        continue;
      }
      
      // Get description
      const description = (
        row[descriptionIndex] || 
        row[descriptionIndex !== -1 ? descriptionIndex : 1] || 
        'Unknown'
      ).trim();
      
      if (!description || description.length < 2) {
        continue; // Skip rows without description
      }
      
      // Get amounts
      let debit = 0;
      let credit = 0;
      
      if (debitIndex !== -1 && row[debitIndex]) {
        debit = parseAmount(row[debitIndex]);
      }
      if (creditIndex !== -1 && row[creditIndex]) {
        credit = parseAmount(row[creditIndex]);
      }
      if (amountIndex !== -1 && debit === 0 && credit === 0 && row[amountIndex]) {
        const amount = parseAmount(row[amountIndex]);
        if (amount > 0) credit = amount;
        else debit = Math.abs(amount);
      }
      
      const finalAmount = Math.max(debit, credit);
      const type = determineType(debit, credit);
      
      if (finalAmount === 0) {
        // Skip zero-amount transactions
        continue;
      }
      
      const transaction: ParsedTransaction = {
        date,
        description,
        amount: finalAmount,
        type,
        source: 'bank_statement',
        reference: referenceIndex !== -1 && row[referenceIndex] ? row[referenceIndex].trim() : undefined,
        rawDebit: debit > 0 ? debit : undefined,
        rawCredit: credit > 0 ? credit : undefined,
        rowIndex: i + 1,
      };
      
      result.transactions.push(transaction);
    }
    
    if (result.transactions.length === 0) {
      result.success = false;
      result.errors.push('No valid transactions found in PDF. The PDF may not be in a structured format.');
    }
  } catch (error: any) {
    result.success = false;
    
    if (error?.name === 'PasswordException' || error?.message?.includes('password')) {
      result.errors.push('Incorrect password or PDF is password-protected');
    } else {
      result.errors.push(
        `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  return result;
};
