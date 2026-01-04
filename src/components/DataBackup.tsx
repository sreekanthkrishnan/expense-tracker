/**
 * Data Backup Component
 * 
 * Provides export and import functionality for user data.
 * SECURITY: All operations are user-scoped via Supabase RLS.
 */

import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { exportToJSON } from '../utils/export/exportToJSON';
import { exportToExcel } from '../utils/export/exportToExcel';
import { importFromJSON } from '../utils/import/importFromJSON';
import { importFromExcel } from '../utils/import/importFromExcel';
import { importData } from '../services/importService';
import { loadProfile } from '../store/slices/profileSlice';
import { loadIncomes } from '../store/slices/incomeSlice';
import { loadExpenses } from '../store/slices/expenseSlice';
import { loadLoans } from '../store/slices/loanSlice';
import { loadGoals } from '../store/slices/savingsGoalSlice';
import { detectIndexedDBData, getAllIndexedDBData } from '../utils/migration/detectIndexedDBData';
import { getMigrationSummary } from '../utils/migration/getMigrationSummary';
import { isMigrationDone } from '../utils/migration/markMigrationDone';
import { Icon } from './common/Icon';
import Modal from './Modal';
import MigrationModal from './MigrationModal';
import type { ImportResult } from '../utils/import/importFromJSON';
import type { ImportProgress } from '../services/importService';

const DataBackup = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { profile } = useAppSelector((state) => state.profile);
  const { incomes } = useAppSelector((state) => state.income);
  const { expenses } = useAppSelector((state) => state.expense);
  const { loans } = useAppSelector((state) => state.loan);
  const { goals } = useAppSelector((state) => state.savingsGoal);

  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportResult | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importReport, setImportReport] = useState<any>(null);
  const [hasIndexedDBData, setHasIndexedDBData] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationSummary, setMigrationSummary] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for IndexedDB data on mount
  useEffect(() => {
    if (user) {
      const checkIndexedDBData = async () => {
        const summary = await detectIndexedDBData();
        setHasIndexedDBData(summary.hasData);
      };
      checkIndexedDBData();
    }
  }, [user]);

  // Export to JSON
  const handleExportJSON = () => {
    const exportData = {
      income: incomes,
      expenses: expenses,
      loans: loans,
      savings: goals,
      ...(profile && { profile }),
    };
    exportToJSON(exportData);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = {
      income: incomes,
      expenses: expenses,
      loans: loans,
      savings: goals,
      ...(profile && { profile }),
    };
    exportToExcel(exportData);
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportPreview(null);
    setImportReport(null);

    try {
      let result: ImportResult;
      
      if (file.name.endsWith('.json')) {
        result = await importFromJSON(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        result = await importFromExcel(file);
      } else {
        setImportPreview({
          success: false,
          errors: ['Unsupported file format. Please use JSON or Excel (.xlsx) files.'],
          warnings: [],
        });
        return;
      }

      setImportPreview(result);
    } catch (error) {
      setImportPreview({
        success: false,
        errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
      });
    }
  };

  // Handle import confirmation
  const handleImportConfirm = async () => {
    if (!importPreview?.data || !user) return;

    setShowConfirmModal(false);
    setImporting(true);
    setImportProgress({ total: 100, completed: 0, current: 'Starting import...' });

    try {
      const report = await importData(
        importPreview.data,
        { type: importMode },
        user.id,
        (progress) => setImportProgress(progress)
      );

      setImportReport(report);
      setImporting(false);

      // Reload all data
      dispatch(loadProfile());
      dispatch(loadIncomes());
      dispatch(loadExpenses());
      dispatch(loadLoans());
      dispatch(loadGoals());

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setImportFile(null);
      setImportPreview(null);
    } catch (error) {
      setImportReport({
        success: false,
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      });
      setImporting(false);
    }
  };

  // Handle replace mode confirmation
  const handleReplaceConfirm = () => {
    setShowConfirmModal(true);
  };

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Data & Backup</h3>
        <p className="text-sm text-gray-600">Export your data for backup or import data from a file</p>
      </div>

      {/* Export Section */}
      <div className="mb-8">
        <h4 className="text-base font-medium text-gray-900 mb-4">Export Data</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExportJSON}
            className="btn-secondary flex items-center justify-center"
            disabled={!incomes.length && !expenses.length && !loans.length && !goals.length}
          >
            <Icon name="Download" size={18} className="mr-2" />
            Export as JSON
          </button>
          <button
            onClick={handleExportExcel}
            className="btn-secondary flex items-center justify-center"
            disabled={!incomes.length && !expenses.length && !loans.length && !goals.length}
          >
            <Icon name="Download" size={18} className="mr-2" />
            Export as Excel
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Downloads all your income, expenses, loans, and savings goals
        </p>
      </div>

      {/* Migration Section */}
      {hasIndexedDBData && !isMigrationDone(user?.id || '') && (
        <div className="mb-8 p-4 rounded-lg border border-yellow-200 bg-yellow-50">
          <div className="flex items-start">
            <Icon name="AlertTriangle" size={20} className="mr-2 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 mb-1">Local data detected</p>
              <p className="text-xs text-yellow-700 mb-3">
                We found data stored locally. Migrate it to your cloud account to access it on all devices.
              </p>
              <button
                onClick={async () => {
                  const indexedDBData = await getAllIndexedDBData();
                  const summary = getMigrationSummary(indexedDBData);
                  setMigrationSummary(summary);
                  setShowMigrationModal(true);
                }}
                className="btn-primary text-sm"
              >
                Migrate Local Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Section */}
      <div>
        <h4 className="text-base font-medium text-gray-900 mb-4">Import Data</h4>
        
        {/* File Input */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="import-file-input"
          />
          <label
            htmlFor="import-file-input"
            className="btn-secondary inline-flex items-center justify-center cursor-pointer"
          >
            <Icon name="Upload" size={18} className="mr-2" />
            Choose File
          </label>
          {importFile && (
            <span className="ml-3 text-sm text-gray-600">{importFile.name}</span>
          )}
        </div>

        {/* Import Preview */}
        {importPreview && (
          <div className="mb-4 p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-background-dark)' }}>
            {importPreview.success ? (
              <>
                <div className="flex items-center mb-3">
                  <Icon name="CheckCircle" size={20} className="mr-2" style={{ color: 'var(--color-active)' }} />
                  <span className="font-medium text-gray-900">File validated successfully</span>
                </div>
                {importPreview.summary && (
                  <div className="text-sm text-gray-700 space-y-1">
                    {importPreview.summary.income !== undefined && (
                      <p>• Income: {importPreview.summary.income} records</p>
                    )}
                    {importPreview.summary.expenses !== undefined && (
                      <p>• Expenses: {importPreview.summary.expenses} records</p>
                    )}
                    {importPreview.summary.loans !== undefined && (
                      <p>• Loans: {importPreview.summary.loans} records</p>
                    )}
                    {importPreview.summary.savings !== undefined && (
                      <p>• Savings Goals: {importPreview.summary.savings} records</p>
                    )}
                    {importPreview.summary.profile && <p>• Profile: Included</p>}
                  </div>
                )}
                {importPreview.warnings && importPreview.warnings.length > 0 && (
                  <div className="mt-3 p-2 rounded bg-yellow-50 border border-yellow-200">
                    <p className="text-xs font-medium text-yellow-800 mb-1">Warnings:</p>
                    {importPreview.warnings.map((warning, idx) => (
                      <p key={idx} className="text-xs text-yellow-700">{warning}</p>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div>
                <div className="flex items-center mb-2">
                  <Icon name="AlertTriangle" size={20} className="mr-2 text-red-600" />
                  <span className="font-medium text-red-900">Validation failed</span>
                </div>
                <div className="text-sm text-red-700">
                  {importPreview.errors.map((error, idx) => (
                    <p key={idx}>• {error}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import Mode Selection */}
        {importPreview?.success && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Import Mode</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="import-mode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  <strong>Merge:</strong> Add new records to existing data
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="import-mode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  <strong>Replace:</strong> Delete all existing data, then import
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Import Button */}
        {importPreview?.success && (
          <button
            onClick={importMode === 'replace' ? handleReplaceConfirm : handleImportConfirm}
            className="btn-primary"
            disabled={importing}
          >
            {importing ? (
              <span className="flex items-center">
                <Icon name="Loader" size={16} className="animate-spin mr-2" />
                Importing...
              </span>
            ) : (
              'Import Data'
            )}
          </button>
        )}

        {/* Import Progress */}
        {importing && importProgress && (
          <div className="mt-4 p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-background-dark)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{importProgress.current}</span>
              <span className="text-sm text-gray-600">
                {importProgress.completed} / {importProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${(importProgress.completed / importProgress.total) * 100}%`,
                  backgroundColor: 'var(--color-primary)',
                }}
              />
            </div>
          </div>
        )}

        {/* Import Report */}
        {importReport && (
          <div className={`mt-4 p-4 rounded-lg border ${
            importReport.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center mb-2">
              <Icon
                name={importReport.success ? 'CheckCircle' : 'AlertTriangle'}
                size={20}
                className={`mr-2 ${importReport.success ? 'text-green-600' : 'text-red-600'}`}
              />
              <span className={`font-medium ${importReport.success ? 'text-green-900' : 'text-red-900'}`}>
                {importReport.success ? 'Import completed' : 'Import failed'}
              </span>
            </div>
            {importReport.imported && (
              <div className="text-sm text-gray-700 mb-2">
                <p>• Income: {importReport.imported.income} imported</p>
                <p>• Expenses: {importReport.imported.expenses} imported</p>
                <p>• Loans: {importReport.imported.loans} imported</p>
                <p>• Savings: {importReport.imported.savings} imported</p>
                {importReport.imported.profile && <p>• Profile: Updated</p>}
              </div>
            )}
            {importReport.errors && importReport.errors.length > 0 && (
              <div className="text-sm text-red-700">
                <p className="font-medium mb-1">Errors:</p>
                {importReport.errors.map((error: string, idx: number) => (
                  <p key={idx}>• {error}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Replace Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Replace"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Warning</p>
            <p className="text-sm text-yellow-700">
              This will <strong>permanently delete</strong> all your existing data (income, expenses, loans, and savings goals) 
              and replace it with the imported data. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleImportConfirm}
              className="btn-primary"
              style={{ backgroundColor: 'var(--color-warning)' }}
            >
              Confirm Replace
            </button>
          </div>
        </div>
      </Modal>

      {/* Migration Modal */}
      {user && migrationSummary && (
        <MigrationModal
          isOpen={showMigrationModal}
          onClose={() => {
            setShowMigrationModal(false);
            // Refresh IndexedDB check
            detectIndexedDBData().then((summary) => setHasIndexedDBData(summary.hasData));
          }}
          onSkip={() => {
            setShowMigrationModal(false);
          }}
          userId={user.id}
          summary={migrationSummary}
        />
      )}
    </div>
  );
};

export default DataBackup;
