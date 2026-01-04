import { useState, useEffect } from 'react';
import type { Loan } from '../types/index';
import { calculateLoanImpact, generateImpactSuggestions } from '../utils/emiTenureCalculator';
import { calculateLoanProgress } from '../utils/loanCalculations';
import Modal from './Modal';
import { Icon } from './common/Icon';

interface EditTenureModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan;
  currencySymbol: string;
  onSave: (loan: Loan, newEMI: number, newTenure: number) => void;
}

const EditTenureModal = ({ isOpen, onClose, loan, currencySymbol, onSave }: EditTenureModalProps) => {
  const progress = calculateLoanProgress(loan);
  const [newRemainingTenure, setNewRemainingTenure] = useState(progress.emisRemaining);
  const [impact, setImpact] = useState<ReturnType<typeof calculateLoanImpact> | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentProgress = calculateLoanProgress(loan);
      setNewRemainingTenure(currentProgress.emisRemaining);
      setImpact(null);
    }
  }, [isOpen, loan.id]);

  useEffect(() => {
    const currentProgress = calculateLoanProgress(loan);
    if (newRemainingTenure !== currentProgress.emisRemaining && newRemainingTenure > 0) {
      const calculatedImpact = calculateLoanImpact(loan, undefined, newRemainingTenure);
      setImpact(calculatedImpact);
    } else {
      setImpact(null);
    }
  }, [newRemainingTenure, loan]);

  const currentProgress = calculateLoanProgress(loan);
  const isValid = newRemainingTenure > 0 && newRemainingTenure <= loan.tenure * 2; // Allow up to 2x original tenure

  const handleSave = () => {
    if (isValid && impact) {
      onSave(loan, impact.newEMI, impact.newTenure);
      onClose();
    }
  };

  const suggestions = impact ? generateImpactSuggestions(impact, currencySymbol) : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Remaining Tenure" size="md">
      <div className="space-y-4">
        {/* Current Info */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Current Remaining Tenure</p>
          <p className="text-lg font-semibold text-gray-900">
            {currentProgress.emisRemaining} months
          </p>
        </div>

        {/* Tenure Input */}
        <div>
          <label htmlFor="new-tenure" className="block text-sm font-medium text-gray-700 mb-2">
            New Remaining Tenure (months)
          </label>
          <input
            type="number"
            id="new-tenure"
            value={newRemainingTenure || ''}
            onChange={(e) => setNewRemainingTenure(parseInt(e.target.value) || 0)}
            className="input"
            min="1"
            max={loan.tenure * 2}
            required
          />
          <div className="mt-2">
            <input
              type="range"
              min="1"
              max={Math.max(loan.tenure * 2, 60)}
              value={newRemainingTenure}
              onChange={(e) => setNewRemainingTenure(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 month</span>
              <span>{Math.max(loan.tenure * 2, 60)} months</span>
            </div>
          </div>
          {!isValid && (
            <p className="text-xs text-brand-pink mt-1">
              Please enter a valid tenure (1 to {loan.tenure * 2} months)
            </p>
          )}
        </div>

        {/* Impact Preview */}
        {impact && isValid && (
          <div className="border border-gray-200 rounded-lg p-4 space-y-4 slide-up">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Impact Preview</h4>
            
            {/* Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Current EMI</p>
                <p className="text-sm font-medium text-gray-900 text-money">
                  {currencySymbol}
                  {loan.emi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">New EMI</p>
                <p className={`text-sm font-medium text-money ${
                  impact.newEMI > loan.emi ? 'text-brand-pink' : 'text-brand-dark-purple'
                }`}>
                  {currencySymbol}
                  {impact.newEMI.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Remaining Tenure</p>
                <p className="text-sm font-medium text-gray-900">
                  {currentProgress.emisRemaining} months
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">New Tenure</p>
                <p className={`text-sm font-medium ${
                  impact.newTenure < progress.emisRemaining ? 'text-brand-dark-purple' : 'text-brand-pink'
                }`}>
                  {impact.newTenure} months
                </p>
              </div>
            </div>

            {/* Interest Impact */}
            {(impact.interestSaved > 0 || impact.interestIncreased > 0) && (
              <div className={`p-3 rounded-lg ${
                impact.interestSaved > 0 ? 'bg-brand-yellow bg-opacity-20 border border-brand-yellow border-opacity-40' : 'bg-brand-pink bg-opacity-10 border border-brand-pink border-opacity-30'
              }`}>
                {impact.interestSaved > 0 ? (
                  <p className="text-sm font-medium text-brand-dark-purple">
                    <span className="flex items-center gap-1">
                      <Icon name="DollarSign" size={14} />
                      Interest Saved: {currencySymbol}
                    </span>
                    {impact.interestSaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-brand-pink">
                    <span className="flex items-center gap-1">
                      <Icon name="AlertTriangle" size={14} />
                      Interest Increases: {currencySymbol}
                    </span>
                    {impact.interestIncreased.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <p key={idx} className="text-xs text-gray-700">{suggestion}</p>
                ))}
              </div>
            )}

            {/* New End Date */}
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-1">New Loan End Date</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(impact.newEndDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Warning for tenure extension */}
        {impact && impact.interestIncreased > 0 && (
          <div className="bg-brand-yellow bg-opacity-20 border border-brand-yellow border-opacity-40 p-3 rounded-lg">
            <p className="text-xs text-brand-dark-purple">
              <span className="flex items-center gap-1">
                <Icon name="AlertTriangle" size={14} />
                Extending tenure will increase total interest paid. Consider keeping a shorter tenure if possible.
              </span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid || !impact}
            className="btn-primary"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditTenureModal;

