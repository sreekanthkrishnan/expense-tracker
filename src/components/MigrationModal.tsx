/**
 * Migration Modal Component
 * 
 * Handles the migration flow from IndexedDB to Supabase.
 * SECURITY: All operations are user-scoped and require explicit user consent.
 */

import { useState, useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { getAllIndexedDBData } from '../utils/migration/detectIndexedDBData';
import { migrateIncome } from '../utils/migration/migrateIncome';
import { migrateExpenses } from '../utils/migration/migrateExpenses';
import { migrateLoans } from '../utils/migration/migrateLoans';
import { migrateSavings } from '../utils/migration/migrateSavings';
import { migrateProfile } from '../utils/migration/migrateProfile';
import { markMigrationDone } from '../utils/migration/markMigrationDone';
import { loadProfile } from '../store/slices/profileSlice';
import { loadIncomes } from '../store/slices/incomeSlice';
import { loadExpenses } from '../store/slices/expenseSlice';
import { loadLoans } from '../store/slices/loanSlice';
import { loadGoals } from '../store/slices/savingsGoalSlice';
import { Icon } from './common/Icon';
import Modal from './Modal';
import type { MigrationSummary } from '../utils/migration/getMigrationSummary';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  userId: string;
  summary: MigrationSummary;
}

type MigrationStep = 'prompt' | 'preview' | 'migrating' | 'success' | 'error';

const MigrationModal = ({ isOpen, onClose, onSkip, userId, summary }: MigrationModalProps) => {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<MigrationStep>('prompt');
  const [progress, setProgress] = useState({ current: '', completed: 0, total: 0 });
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [keepLocalData, setKeepLocalData] = useState(true);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('prompt');
      setProgress({ current: '', completed: 0, total: 0 });
      setMigrationResult(null);
      setKeepLocalData(true);
    }
  }, [isOpen]);

  const handleMigrate = async () => {
    setStep('migrating');

    try {
      // Get all IndexedDB data
      const indexedDBData = await getAllIndexedDBData();
      const totalRecords = summary.totalRecords;
      let completed = 0;

      const results: any = {
        income: { success: 0, failed: 0, errors: [] },
        expenses: { success: 0, failed: 0, errors: [] },
        loans: { success: 0, failed: 0, errors: [] },
        savings: { success: 0, failed: 0, errors: [] },
        profile: { success: false, error: undefined },
      };

      // Migrate Income
      if (indexedDBData.income.length > 0) {
        setProgress({ current: 'Migrating income records...', completed, total: totalRecords });
        const incomeResult = await migrateIncome(indexedDBData.income);
        results.income = incomeResult;
        completed += indexedDBData.income.length;
      }

      // Migrate Expenses
      if (indexedDBData.expenses.length > 0) {
        setProgress({ current: 'Migrating expense records...', completed, total: totalRecords });
        const expenseResult = await migrateExpenses(indexedDBData.expenses);
        results.expenses = expenseResult;
        completed += indexedDBData.expenses.length;
      }

      // Migrate Loans
      if (indexedDBData.loans.length > 0) {
        setProgress({ current: 'Migrating loan records...', completed, total: totalRecords });
        const loanResult = await migrateLoans(indexedDBData.loans);
        results.loans = loanResult;
        completed += indexedDBData.loans.length;
      }

      // Migrate Savings
      if (indexedDBData.savings.length > 0) {
        setProgress({ current: 'Migrating savings goals...', completed, total: totalRecords });
        const savingsResult = await migrateSavings(indexedDBData.savings);
        results.savings = savingsResult;
        completed += indexedDBData.savings.length;
      }

      // Migrate Profile
      if (indexedDBData.profile) {
        setProgress({ current: 'Migrating profile...', completed, total: totalRecords });
        const profileResult = await migrateProfile(indexedDBData.profile, userId);
        results.profile = profileResult;
        completed += 1;
      }

      setProgress({ current: 'Migration complete!', completed: totalRecords, total: totalRecords });

      // Mark migration as done
      markMigrationDone(userId);

      // Reload all data from Supabase
      dispatch(loadProfile());
      dispatch(loadIncomes());
      dispatch(loadExpenses());
      dispatch(loadLoans());
      dispatch(loadGoals());

      setMigrationResult(results);
      setStep('success');
    } catch (error) {
      setStep('error');
      setMigrationResult({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  const handleSuccessClose = () => {
    setStep('prompt');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 'migrating' ? () => {} : onClose}
      title="Migrate Your Data"
    >
      {step === 'prompt' && (
        <div className="space-y-4">
          <div className="flex items-start">
            <Icon name="AlertTriangle" size={24} className="mr-3 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-gray-900 font-medium mb-2">We found data stored locally</p>
              <p className="text-sm text-gray-600">
                We found data stored locally from your previous usage. Would you like to move this data to your account
                so it's available on all devices?
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-background-dark)' }}>
            <p className="text-sm font-medium text-gray-900 mb-2">Data to migrate:</p>
            <div className="text-sm text-gray-700 space-y-1">
              {summary.breakdown.income > 0 && <p>• Income: {summary.breakdown.income} records</p>}
              {summary.breakdown.expenses > 0 && <p>• Expenses: {summary.breakdown.expenses} records</p>}
              {summary.breakdown.loans > 0 && <p>• Loans: {summary.breakdown.loans} records</p>}
              {summary.breakdown.savings > 0 && <p>• Savings Goals: {summary.breakdown.savings} records</p>}
              {summary.breakdown.profile && <p>• Profile: Included</p>}
            </div>
            <p className="text-xs text-gray-500 mt-2">Estimated time: {summary.estimatedTime}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button onClick={onSkip} className="btn-secondary flex-1">
              Skip (remind later)
            </button>
            <button onClick={() => setStep('preview')} className="btn-primary flex-1">
              Migrate Now
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div>
            <p className="text-gray-900 font-medium mb-2">Confirm Migration</p>
            <p className="text-sm text-gray-600 mb-4">
              You are about to migrate {summary.totalRecords} record(s) to your cloud account. This will make your data
              available on all devices.
            </p>
          </div>

          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-background-dark)' }}>
            <p className="text-sm font-medium text-gray-900 mb-3">Migration Summary:</p>
            <div className="text-sm text-gray-700 space-y-2">
              {summary.breakdown.income > 0 && (
                <div className="flex justify-between">
                  <span>Income records</span>
                  <span className="font-medium">{summary.breakdown.income}</span>
                </div>
              )}
              {summary.breakdown.expenses > 0 && (
                <div className="flex justify-between">
                  <span>Expense records</span>
                  <span className="font-medium">{summary.breakdown.expenses}</span>
                </div>
              )}
              {summary.breakdown.loans > 0 && (
                <div className="flex justify-between">
                  <span>Loan records</span>
                  <span className="font-medium">{summary.breakdown.loans}</span>
                </div>
              )}
              {summary.breakdown.savings > 0 && (
                <div className="flex justify-between">
                  <span>Savings goals</span>
                  <span className="font-medium">{summary.breakdown.savings}</span>
                </div>
              )}
              {summary.breakdown.profile && (
                <div className="flex justify-between">
                  <span>Profile</span>
                  <span className="font-medium">Included</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button onClick={() => setStep('prompt')} className="btn-secondary flex-1">
              Back
            </button>
            <button onClick={handleMigrate} className="btn-primary flex-1">
              Confirm & Migrate
            </button>
          </div>
        </div>
      )}

      {step === 'migrating' && (
        <div className="space-y-4">
          <div className="text-center">
            <Icon name="Loader" size={48} className="animate-spin mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
            <p className="text-gray-900 font-medium mb-2">Migrating your data...</p>
            <p className="text-sm text-gray-600">{progress.current}</p>
          </div>

          {progress.total > 0 && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>
                  {progress.completed} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(progress.completed / progress.total) * 100}%`,
                    backgroundColor: 'var(--color-primary)',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'success' && migrationResult && (
        <div className="space-y-4">
          <div className="text-center">
            <Icon name="CheckCircle" size={48} className="mx-auto mb-4 text-green-600" />
            <p className="text-gray-900 font-medium mb-2">Migration Complete! 🎉</p>
            <p className="text-sm text-gray-600">Your data has been successfully migrated to your cloud account.</p>
          </div>

          <div className="p-4 rounded-lg border bg-green-50 border-green-200">
            <p className="text-sm font-medium text-green-900 mb-2">Migration Results:</p>
            <div className="text-sm text-green-800 space-y-1">
              {migrationResult.income && (
                <p>
                  • Income: {migrationResult.income.success} migrated
                  {migrationResult.income.failed > 0 && `, ${migrationResult.income.failed} failed`}
                </p>
              )}
              {migrationResult.expenses && (
                <p>
                  • Expenses: {migrationResult.expenses.success} migrated
                  {migrationResult.expenses.failed > 0 && `, ${migrationResult.expenses.failed} failed`}
                </p>
              )}
              {migrationResult.loans && (
                <p>
                  • Loans: {migrationResult.loans.success} migrated
                  {migrationResult.loans.failed > 0 && `, ${migrationResult.loans.failed} failed`}
                </p>
              )}
              {migrationResult.savings && (
                <p>
                  • Savings: {migrationResult.savings.success} migrated
                  {migrationResult.savings.failed > 0 && `, ${migrationResult.savings.failed} failed`}
                </p>
              )}
              {migrationResult.profile && migrationResult.profile.success && <p>• Profile: Migrated</p>}
            </div>
          </div>

          {migrationResult.income?.errors?.length > 0 ||
          migrationResult.expenses?.errors?.length > 0 ||
          migrationResult.loans?.errors?.length > 0 ||
          migrationResult.savings?.errors?.length > 0 ? (
            <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
              <p className="text-sm font-medium text-yellow-900 mb-2">Warnings:</p>
              <div className="text-sm text-yellow-800 space-y-1 max-h-32 overflow-y-auto">
                {[
                  ...(migrationResult.income?.errors || []),
                  ...(migrationResult.expenses?.errors || []),
                  ...(migrationResult.loans?.errors || []),
                  ...(migrationResult.savings?.errors || []),
                ].map((error, idx) => (
                  <p key={idx}>• {error}</p>
                ))}
              </div>
            </div>
          ) : null}

          <div className="pt-4 border-t border-gray-200">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={keepLocalData}
                onChange={(e) => setKeepLocalData(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Keep local data for offline use</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Local data will remain available even if you're offline
            </p>
          </div>

          <button onClick={handleSuccessClose} className="btn-primary w-full">
            Done
          </button>
        </div>
      )}

      {step === 'error' && (
        <div className="space-y-4">
          <div className="text-center">
            <Icon name="AlertTriangle" size={48} className="mx-auto mb-4 text-red-600" />
            <p className="text-gray-900 font-medium mb-2">Migration Failed</p>
            <p className="text-sm text-gray-600">{migrationResult?.error || 'An unknown error occurred'}</p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button onClick={() => setStep('prompt')} className="btn-secondary flex-1">
              Try Again
            </button>
            <button onClick={onClose} className="btn-primary flex-1">
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default MigrationModal;
