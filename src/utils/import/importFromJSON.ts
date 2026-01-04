/**
 * Import Data from JSON
 * 
 * Parses and validates JSON import file.
 * SECURITY: Never trusts user_id from file - always uses current user.
 */

import { validateImportData } from './validateImportData';
import type { ImportData } from './validateImportData';

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
 * Import data from JSON file
 * 
 * @param file - JSON file to import
 * @returns Promise with import result
 */
export const importFromJSON = async (file: File): Promise<ImportResult> => {
  try {
    // Read file as text
    const text = await file.text();

    // Parse JSON
    let parsedData: any;
    try {
      parsedData = JSON.parse(text);
    } catch (parseError) {
      return {
        success: false,
        errors: ['Invalid JSON format. Please check the file and try again.'],
        warnings: [],
      };
    }

    // Validate data structure
    const validation = validateImportData(parsedData);

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
        summary: validation.summary,
      };
    }

    // Extract data (handle both formats)
    let importData: ImportData = {};
    if (parsedData.meta && parsedData.data) {
      importData = parsedData.data;
    } else {
      importData = parsedData;
    }

    // Remove any user_id fields if present (security)
    const sanitizeData = (data: any[]): any[] => {
      return data.map((item) => {
        const { user_id, userId, ...rest } = item;
        return rest;
      });
    };

    if (importData.income) {
      importData.income = sanitizeData(importData.income) as any;
    }
    if (importData.expenses) {
      importData.expenses = sanitizeData(importData.expenses) as any;
    }
    if (importData.loans) {
      importData.loans = sanitizeData(importData.loans) as any;
    }
    if (importData.savings) {
      importData.savings = sanitizeData(importData.savings) as any;
    }

    // Remove user_id from profile if present
    if (importData.profile) {
      const { user_id, userId, ...profileRest } = importData.profile as any;
      importData.profile = profileRest;
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
      errors: [`Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
    };
  }
};
