/**
 * Bank Statement Import Component
 * 
 * Allows users to upload and import bank statements (CSV/Excel).
 * SECURITY: All operations are user-scoped via Supabase RLS.
 */

import { useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { parseCSV } from '../utils/bankImport/parseCSV';
import { parseExcel } from '../utils/bankImport/parseExcel';
import { detectProtectedPDF } from '../utils/bankImport/detectProtectedPDF';
import { parseProtectedPDF } from '../utils/bankImport/parseProtectedPDF';
import { normalizeTransactions } from '../utils/bankImport/normalizeTransactions';
import { detectStatementDuplicates } from '../utils/bankImport/detectStatementDuplicates';
import { validateTransaction } from '../utils/bankImport/normalizeTransactions';
import * as incomeService from '../services/incomeService';
import * as expensesService from '../services/expensesService';
import { loadIncomes } from '../store/slices/incomeSlice';
import { loadExpenses } from '../store/slices/expenseSlice';
import { Icon } from './common/Icon';
import Modal from './Modal';
import PasswordPrompt from './PasswordPrompt';
import type { ImportPreviewRow, ImportResult } from '../utils/bankImport/types';

const BankStatementImport = () => {
  const dispatch = useAppDispatch();
  const { incomes } = useAppSelector((state) => state.income);
  const { expenses } = useAppSelector((state) => state.expense);
  const { profile } = useAppSelector((state) => state.profile);
  const { categories } = useAppSelector((state) => state.expense);

  const [isOpen, setIsOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password prompt state
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordRetryCount, setPasswordRetryCount] = useState(0);
  const MAX_PASSWORD_RETRIES = 3;

  const currency = profile?.currency || 'USD';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency;

  // Parse file with optional password (for PDFs)
  const parseFileWithPassword = async (file: File, password?: string) => {
    setParsing(true);
    setPreviewRows([]);
    setShowPreview(false);
    setImportResult(null);
    setPasswordError('');

    try {
      let parseResult;

      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const text = await file.text();
        parseResult = parseCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Parse Excel
        parseResult = await parseExcel(file);
      } else if (file.name.endsWith('.pdf')) {
        // Parse PDF (with optional password)
        parseResult = await parseProtectedPDF(file, password);
        
        // Check if password is required or incorrect
        if (!parseResult.success && parseResult.errors.some((e: string) => e.includes('password'))) {
          // Password required or incorrect
          if (password) {
            // Wrong password - increment retry count
            setPasswordRetryCount(prev => prev + 1);
            if (passwordRetryCount + 1 >= MAX_PASSWORD_RETRIES) {
              setPasswordError('Maximum retry attempts reached. Please check your password and try again.');
              setParsing(false);
              return;
            } else {
              setPasswordError('Incorrect password. Please try again.');
              setShowPasswordPrompt(true);
              setParsing(false);
              return;
            }
          } else {
            // Password required
            setPendingFile(file);
            setShowPasswordPrompt(true);
            setParsing(false);
            return;
          }
        }
      } else {
        setImportResult({
          success: false,
          imported: { income: 0, expenses: 0 },
          skipped: { duplicates: 0, excluded: 0 },
          errors: ['Unsupported file format. Please use CSV, Excel (.xlsx), or PDF files.'],
        });
        setParsing(false);
        return;
      }

      if (!parseResult.success || parseResult.transactions.length === 0) {
        setImportResult({
          success: false,
          imported: { income: 0, expenses: 0 },
          skipped: { duplicates: 0, excluded: 0 },
          errors: parseResult.errors.length > 0 
            ? parseResult.errors 
            : ['No valid transactions found in file'],
        });
        setParsing(false);
        return;
      }

      // Normalize transactions
      const normalized = normalizeTransactions(parseResult.transactions);

      // Detect duplicates
      const withDuplicates = detectStatementDuplicates(normalized, incomes, expenses);

      // Set default categories for expenses
      const withCategories = withDuplicates.map(row => {
        if (row.type === 'expense' && !row.category) {
          return { ...row, category: 'Uncategorized' };
        }
        return row;
      });

      setPreviewRows(withCategories);
      setShowPreview(true);
      setPasswordRetryCount(0); // Reset on success
    } catch (error) {
      setImportResult({
        success: false,
        imported: { income: 0, expenses: 0 },
        skipped: { duplicates: 0, excluded: 0 },
        errors: [`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`],
      });
    } finally {
      setParsing(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset password state
    setPasswordError('');
    setPasswordRetryCount(0);
    setPendingFile(null);
    setShowPasswordPrompt(false);

    // Check if PDF is password-protected
    if (file.name.endsWith('.pdf')) {
      setParsing(true);
      try {
        const isProtected = await detectProtectedPDF(file);
        if (isProtected) {
          // PDF is password-protected - show prompt
          setPendingFile(file);
          setShowPasswordPrompt(true);
          setParsing(false);
          return;
        }
      } catch (error) {
        // If detection fails, try parsing without password
        console.warn('Could not detect PDF protection, attempting to parse:', error);
      } finally {
        setParsing(false);
      }
    }

    // Parse file (non-protected PDF or other formats)
    await parseFileWithPassword(file);
  };

  // Handle password confirmation
  const handlePasswordConfirm = async (password: string) => {
    if (!pendingFile) {
      setShowPasswordPrompt(false);
      return;
    }

    // SECURITY: Password is only used for parsing, never stored
    await parseFileWithPassword(pendingFile, password);
    
    // Clear password from state (security best practice)
    setShowPasswordPrompt(false);
    setPendingFile(null);
  };

  // Handle password prompt cancel
  const handlePasswordCancel = () => {
    setShowPasswordPrompt(false);
    setPendingFile(null);
    setPasswordError('');
    setPasswordRetryCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Update category for a row
  const updateCategory = (id: string, category: string) => {
    setPreviewRows(rows =>
      rows.map(row => (row.id === id ? { ...row, category } : row))
    );
  };

  // Toggle include/exclude for a row
  const toggleInclude = (id: string) => {
    setPreviewRows(rows =>
      rows.map(row => (row.id === id ? { ...row, include: !row.include } : row))
    );
  };

  // Toggle all rows
  const toggleAll = (include: boolean) => {
    setPreviewRows(rows =>
      rows.map(row => ({ ...row, include }))
    );
  };

  // Handle import confirmation
  const handleImport = async () => {
    const rowsToImport = previewRows.filter(row => {
      if (!row.include) return false;
      if (skipDuplicates && row.isDuplicate) return false;
      
      // Validate
      const errors = validateTransaction(row);
      return errors.length === 0;
    });

    if (rowsToImport.length === 0) {
      setImportResult({
        success: false,
        imported: { income: 0, expenses: 0 },
        skipped: { duplicates: 0, excluded: 0 },
        errors: ['No valid transactions to import'],
      });
      return;
    }

    setImporting(true);
    setImportResult(null);

    const result: ImportResult = {
      success: true,
      imported: { income: 0, expenses: 0 },
      skipped: { duplicates: 0, excluded: 0 },
      errors: [],
    };

    try {
      for (const row of rowsToImport) {
        try {
          if (row.type === 'income') {
            await incomeService.createIncome({
              amount: row.amount,
              type: 'one-time',
              source: row.description,
              date: row.date,
              notes: row.reference ? `Ref: ${row.reference}` : undefined,
            });
            result.imported.income++;
          } else {
            await expensesService.createExpense({
              amount: row.amount,
              category: row.category || 'Uncategorized',
              date: row.date,
              paymentMethod: 'Bank Transfer',
              notes: row.reference ? `Ref: ${row.reference}` : undefined,
            });
            result.imported.expenses++;
          }
        } catch (error) {
          result.errors.push(
            `Failed to import ${row.description}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Count skipped
      result.skipped.duplicates = previewRows.filter(r => r.isDuplicate && skipDuplicates).length;
      result.skipped.excluded = previewRows.filter(r => !r.include).length;

      result.success = result.errors.length === 0;

      // Reload data
      dispatch(loadIncomes());
      dispatch(loadExpenses());

      // Reset after delay
      setTimeout(() => {
        setPreviewRows([]);
        setShowPreview(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);
    } catch (error) {
      result.success = false;
      result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
      setImportResult(result);
    }
  };

  const selectedCount = previewRows.filter(r => r.include).length;
  const duplicateCount = previewRows.filter(r => r.isDuplicate).length;
  const incomeCount = previewRows.filter(r => r.include && r.type === 'income').length;
  const expenseCount = previewRows.filter(r => r.include && r.type === 'expense').length;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-secondary flex items-center"
      >
        <Icon name="Upload" size={18} className="mr-2" />
        Import Bank Statement
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setPreviewRows([]);
          setShowPreview(false);
          setImportResult(null);
          setShowPasswordPrompt(false);
          setPendingFile(null);
          setPasswordError('');
          setPasswordRetryCount(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        title="Import Bank Statement"
      >
        <div className="space-y-4">
          {/* File Upload */}
          {!showPreview && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Bank Statement File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                onChange={handleFileSelect}
                className="input w-full"
                disabled={parsing}
              />
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: CSV, Excel (.xlsx, .xls), PDF (including password-protected)
              </p>
            </div>
          )}

          {/* Parsing Status */}
          {parsing && (
            <div className="text-center py-8">
              <Icon name="Loader" size={48} className="animate-spin mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
              <p className="text-gray-900 font-medium">Parsing file...</p>
              <p className="text-sm text-gray-600 mt-1">Please wait while we extract transactions</p>
            </div>
          )}

          {/* Preview Table */}
          {showPreview && previewRows.length > 0 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-background-dark)' }}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Found</p>
                    <p className="font-semibold text-gray-900">{previewRows.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Selected</p>
                    <p className="font-semibold text-gray-900">{selectedCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Duplicates</p>
                    <p className="font-semibold text-yellow-700">{duplicateCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">To Import</p>
                    <p className="font-semibold text-green-700">
                      {incomeCount} income, {expenseCount} expenses
                    </p>
                  </div>
                </div>
              </div>

              {/* Duplicate Warning */}
              {duplicateCount > 0 && (
                <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
                  <div className="flex items-start">
                    <Icon name="AlertTriangle" size={20} className="mr-2 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-900 mb-1">
                        {duplicateCount} potential duplicate{duplicateCount !== 1 ? 's' : ''} detected
                      </p>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={skipDuplicates}
                          onChange={(e) => setSkipDuplicates(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-xs text-yellow-800">
                          Skip duplicates automatically
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Table Controls */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleAll(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Select All
                </button>
                <button
                  onClick={() => toggleAll(false)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Deselect All
                </button>
              </div>

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          <input
                            type="checkbox"
                            checked={selectedCount === previewRows.length && previewRows.length > 0}
                            onChange={(e) => toggleAll(e.target.checked)}
                            className="mr-1"
                          />
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewRows.map((row) => (
                        <tr
                          key={row.id}
                          className={`${
                            row.isDuplicate ? 'bg-yellow-50' : ''
                          } ${!row.include ? 'opacity-50' : ''}`}
                        >
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={row.include}
                              onChange={() => toggleInclude(row.id)}
                              className="mr-1"
                            />
                            {row.isDuplicate && (
                              <Icon name="AlertTriangle" size={14} className="text-yellow-600 inline ml-1" />
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                            {new Date(row.date).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate" title={row.description}>
                            {row.description}
                          </td>
                          <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium ${
                            row.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {row.type === 'income' ? '+' : '-'}
                            {currencySymbol}
                            {row.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600 capitalize">
                            {row.type}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {row.type === 'expense' ? (
                              <select
                                value={row.category || 'Uncategorized'}
                                onChange={(e) => updateCategory(row.id, e.target.value)}
                                className="text-xs border rounded px-2 py-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {categories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-xs text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewRows([]);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="btn-secondary flex-1"
                  disabled={importing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  className="btn-primary flex-1"
                  disabled={importing || selectedCount === 0}
                >
                  {importing ? (
                    <span className="flex items-center justify-center">
                      <Icon name="Loader" size={16} className="animate-spin mr-2" />
                      Importing...
                    </span>
                  ) : (
                    `Import ${selectedCount} Transaction${selectedCount !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className={`p-4 rounded-lg border ${
              importResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center mb-2">
                <Icon
                  name={importResult.success ? 'CheckCircle' : 'AlertTriangle'}
                  size={20}
                  className={`mr-2 ${importResult.success ? 'text-green-600' : 'text-red-600'}`}
                />
                <span className={`font-medium ${importResult.success ? 'text-green-900' : 'text-red-900'}`}>
                  {importResult.success ? 'Import Completed' : 'Import Failed'}
                </span>
              </div>
              <div className="text-sm space-y-1">
                {importResult.imported.income > 0 && (
                  <p className={importResult.success ? 'text-green-800' : 'text-red-800'}>
                    • Income: {importResult.imported.income} imported
                  </p>
                )}
                {importResult.imported.expenses > 0 && (
                  <p className={importResult.success ? 'text-green-800' : 'text-red-800'}>
                    • Expenses: {importResult.imported.expenses} imported
                  </p>
                )}
                {importResult.skipped.duplicates > 0 && (
                  <p className="text-yellow-800">
                    • Skipped: {importResult.skipped.duplicates} duplicates
                  </p>
                )}
                {importResult.skipped.excluded > 0 && (
                  <p className="text-gray-700">
                    • Excluded: {importResult.skipped.excluded} transactions
                  </p>
                )}
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium mb-1">Errors:</p>
                    {importResult.errors.map((error, idx) => (
                      <p key={idx} className="text-red-700 text-xs">• {error}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Password Prompt Modal */}
      <PasswordPrompt
        isOpen={showPasswordPrompt}
        onConfirm={handlePasswordConfirm}
        onCancel={handlePasswordCancel}
        error={passwordError}
        maxRetries={MAX_PASSWORD_RETRIES}
        retryCount={passwordRetryCount}
      />
    </>
  );
};

export default BankStatementImport;
