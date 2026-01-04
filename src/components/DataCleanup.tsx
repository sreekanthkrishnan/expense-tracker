/**
 * Data Cleanup Component
 * 
 * Detects and removes duplicate entries from income and expenses.
 * SECURITY: All operations are user-scoped via Supabase RLS.
 */

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { detectDuplicates, sortDuplicateGroup } from '../utils/cleanup/detectDuplicates';
import { deleteDuplicateGroup } from '../utils/cleanup/deleteSupabaseDuplicates';
import { loadIncomes } from '../store/slices/incomeSlice';
import { loadExpenses } from '../store/slices/expenseSlice';
import { Icon } from './common/Icon';
import Modal from './Modal';
import type { DuplicateDetectionResult } from '../utils/cleanup/detectDuplicates';

const DataCleanup = () => {
  const dispatch = useAppDispatch();
  const { incomes } = useAppSelector((state) => state.income);
  const { expenses } = useAppSelector((state) => state.expense);

  const [scanning, setScanning] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateDetectionResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  // Scan for duplicates
  const handleScan = () => {
    setScanning(true);
    setDuplicates(null);
    setCleanupResult(null);
    setSelectedGroups(new Set());

    try {
      // Detect duplicates
      const result = detectDuplicates(incomes, expenses);
      
      // Sort each group by creation time (oldest first)
      result.income = result.income.map(sortDuplicateGroup);
      result.expenses = result.expenses.map(sortDuplicateGroup);
      
      setDuplicates(result);
      
      // Auto-select all groups for cleanup
      const allGroupKeys = [
        ...result.income.map(g => g.key),
        ...result.expenses.map(g => g.key),
      ];
      setSelectedGroups(new Set(allGroupKeys));
    } catch (error) {
      console.error('Error scanning for duplicates:', error);
    } finally {
      setScanning(false);
    }
  };

  // Toggle group selection
  const toggleGroup = (key: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedGroups(newSelected);
  };

  // Clean selected duplicates
  const handleClean = async () => {
    if (!duplicates || selectedGroups.size === 0) return;

    setCleaning(true);
    setCleanupResult(null);

    const results = {
      income: { success: 0, failed: 0, errors: [] as string[] },
      expenses: { success: 0, failed: 0, errors: [] as string[] },
    };

    try {
      // Clean income duplicates
      for (const group of duplicates.income) {
        if (selectedGroups.has(group.key)) {
          const result = await deleteDuplicateGroup(group, 0); // Keep oldest (index 0)
          results.income.success += result.success;
          results.income.failed += result.failed;
          results.income.errors.push(...result.errors);
        }
      }

      // Clean expense duplicates
      for (const group of duplicates.expenses) {
        if (selectedGroups.has(group.key)) {
          const result = await deleteDuplicateGroup(group, 0); // Keep oldest (index 0)
          results.expenses.success += result.success;
          results.expenses.failed += result.failed;
          results.expenses.errors.push(...result.errors);
        }
      }

      setCleanupResult(results);

      // Reload data
      dispatch(loadIncomes());
      dispatch(loadExpenses());

      // Reset scan after a delay
      setTimeout(() => {
        setDuplicates(null);
        setSelectedGroups(new Set());
        setShowPreview(false);
      }, 3000);
    } catch (error) {
      setCleanupResult({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setCleaning(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timestamp?: string | number) => {
    if (!timestamp) return 'No time recorded';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleString();
  };

  const formatAmount = (amount: number, currency: string = 'USD') => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency;
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const { profile } = useAppSelector((state) => state.profile);
  const currency = profile?.currency || 'USD';

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Data Cleanup</h3>
        <p className="text-sm text-gray-600">Detect and remove duplicate entries from your financial data</p>
      </div>

      {/* Scan Button */}
      <div className="mb-6">
        <button
          onClick={handleScan}
          disabled={scanning || (incomes.length === 0 && expenses.length === 0)}
          className="btn-primary"
        >
          {scanning ? (
            <span className="flex items-center">
              <Icon name="Loader" size={16} className="animate-spin mr-2" />
              Scanning...
            </span>
          ) : (
            <span className="flex items-center">
              <Icon name="Target" size={18} className="mr-2" />
              Scan for Duplicates
            </span>
          )}
        </button>
      </div>

      {/* Scan Results */}
      {duplicates && (
        <div className="mb-6">
          {duplicates.totalGroups === 0 ? (
            <div className="p-4 rounded-lg border bg-green-50 border-green-200">
              <div className="flex items-center">
                <Icon name="CheckCircle" size={20} className="mr-2 text-green-600" />
                <span className="text-sm font-medium text-green-900">No duplicates found!</span>
              </div>
              <p className="text-xs text-green-700 mt-1">Your data is clean and duplicate-free.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-background-dark)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Scan Results</span>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>• Duplicate groups found: <strong>{duplicates.totalGroups}</strong></p>
                  <p>• Total duplicate entries: <strong>{duplicates.totalEntries}</strong></p>
                  <p>• Entries that can be removed: <strong>{duplicates.entriesToRemove}</strong></p>
                </div>
              </div>

              <button
                onClick={() => setShowPreview(true)}
                className="btn-primary w-full"
              >
                Review & Clean Duplicates
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cleanup Result */}
      {cleanupResult && !cleanupResult.error && (
        <div className="p-4 rounded-lg border bg-green-50 border-green-200">
          <div className="flex items-center mb-2">
            <Icon name="CheckCircle" size={20} className="mr-2 text-green-600" />
            <span className="text-sm font-medium text-green-900">Cleanup Complete</span>
          </div>
          <div className="text-sm text-green-800 space-y-1">
            {cleanupResult.income.success > 0 && (
              <p>• Income: {cleanupResult.income.success} duplicates removed</p>
            )}
            {cleanupResult.expenses.success > 0 && (
              <p>• Expenses: {cleanupResult.expenses.success} duplicates removed</p>
            )}
            {(cleanupResult.income.failed > 0 || cleanupResult.expenses.failed > 0) && (
              <p className="text-yellow-700">
                • Some deletions failed. Please try again.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Review Duplicates"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {duplicates && (
            <>
              {/* Income Duplicates */}
              {duplicates.income.length > 0 && (
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-3">Income Duplicates</h4>
                  <div className="space-y-4">
                    {duplicates.income.map((group) => (
                      <div key={group.key} className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-background-dark)' }}>
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedGroups.has(group.key)}
                            onChange={() => toggleGroup(group.key)}
                            className="mt-1 mr-3"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {group.count} duplicate{group.count > 1 ? 's' : ''} found
                              </span>
                              <span className="text-sm text-gray-600">
                                Total: {formatAmount(group.totalAmount, currency)}
                              </span>
                            </div>
                            <div className="space-y-2 mt-3">
                              {group.entries.map((entry, idx) => {
                                const income = entry as any;
                                const isOldest = idx === 0;
                                return (
                                  <div
                                    key={entry.id}
                                    className={`p-2 rounded text-xs ${
                                      isOldest
                                        ? 'bg-green-50 border border-green-200'
                                        : 'bg-gray-50 border border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-gray-900">
                                            {formatAmount(income.amount, currency)}
                                          </span>
                                          <span className="text-gray-600">•</span>
                                          <span className="text-gray-700">{income.source}</span>
                                          <span className="text-gray-600">•</span>
                                          <span className="text-gray-700">{formatDate(income.date)}</span>
                                        </div>
                                        {income.created_at && (
                                          <div className="text-gray-500 mt-1">
                                            Created: {formatTime(income.created_at)}
                                          </div>
                                        )}
                                      </div>
                                      {isOldest && (
                                        <span className="ml-2 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                                          Keep
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expense Duplicates */}
              {duplicates.expenses.length > 0 && (
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-3">Expense Duplicates</h4>
                  <div className="space-y-4">
                    {duplicates.expenses.map((group) => (
                      <div key={group.key} className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-background-dark)' }}>
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedGroups.has(group.key)}
                            onChange={() => toggleGroup(group.key)}
                            className="mt-1 mr-3"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {group.count} duplicate{group.count > 1 ? 's' : ''} found
                              </span>
                              <span className="text-sm text-gray-600">
                                Total: {formatAmount(group.totalAmount, currency)}
                              </span>
                            </div>
                            <div className="space-y-2 mt-3">
                              {group.entries.map((entry, idx) => {
                                const expense = entry as any;
                                const isOldest = idx === 0;
                                return (
                                  <div
                                    key={entry.id}
                                    className={`p-2 rounded text-xs ${
                                      isOldest
                                        ? 'bg-green-50 border border-green-200'
                                        : 'bg-gray-50 border border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-gray-900">
                                            {formatAmount(expense.amount, currency)}
                                          </span>
                                          <span className="text-gray-600">•</span>
                                          <span className="text-gray-700">{expense.category}</span>
                                          <span className="text-gray-600">•</span>
                                          <span className="text-gray-700">{formatDate(expense.date)}</span>
                                        </div>
                                        {expense.created_at && (
                                          <div className="text-gray-500 mt-1">
                                            Created: {formatTime(expense.created_at)}
                                          </div>
                                        )}
                                      </div>
                                      {isOldest && (
                                        <span className="ml-2 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                                          Keep
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowPreview(false)}
                  className="btn-secondary flex-1"
                  disabled={cleaning}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClean}
                  className="btn-primary flex-1"
                  disabled={cleaning || selectedGroups.size === 0}
                >
                  {cleaning ? (
                    <span className="flex items-center justify-center">
                      <Icon name="Loader" size={16} className="animate-spin mr-2" />
                      Cleaning...
                    </span>
                  ) : (
                    `Remove ${selectedGroups.size} Duplicate Group${selectedGroups.size !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DataCleanup;
