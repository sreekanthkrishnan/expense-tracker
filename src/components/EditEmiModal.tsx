import { useState, useEffect } from 'react';
import type { Loan } from '../types/index';
import { calculateLoanImpact, calculateMinimumEMI, generateImpactSuggestions } from '../utils/emiTenureCalculator';
import Modal from './Modal';
import { Icon } from './common/Icon';

interface EditEmiModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan;
  currencySymbol: string;
  onSave: (loan: Loan, newEMI: number, newTenure: number) => void;
}

const EditEmiModal = ({ isOpen, onClose, loan, currencySymbol, onSave }: EditEmiModalProps) => {
  const [newEMI, setNewEMI] = useState(loan.emi);
  const [impact, setImpact] = useState<ReturnType<typeof calculateLoanImpact> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewEMI(loan.emi);
      setImpact(null);
    }
  }, [isOpen, loan.emi]);

  useEffect(() => {
    if (newEMI !== loan.emi && newEMI > 0) {
      const calculatedImpact = calculateLoanImpact(loan, newEMI);
      setImpact(calculatedImpact);
    } else {
      setImpact(null);
    }
  }, [newEMI, loan]);

  const minEMI = calculateMinimumEMI(loan);
  const isValid = newEMI >= minEMI;

  const handleSave = () => {
    if (isValid && impact) {
      onSave(loan, impact.newEMI, impact.newTenure);
      onClose();
    }
  };

  const suggestions = impact ? generateImpactSuggestions(impact, currencySymbol) : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit EMI Amount" size="md">
      <div className="space-y-4">
        {/* Current EMI */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Current EMI</p>
          <p className="text-lg font-semibold text-gray-900 text-money">
            {currencySymbol}
            {loan.emi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* New EMI Input */}
        <div>
          <label htmlFor="new-emi" className="block text-sm font-medium text-gray-700 mb-2">
            New EMI Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              {currencySymbol}
            </span>
            <input
              type="number"
              id="new-emi"
              value={newEMI || ''}
              onChange={(e) => setNewEMI(parseFloat(e.target.value) || 0)}
              className="input pl-8"
              min={minEMI}
              step="0.01"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Minimum: {currencySymbol}
            {minEMI.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {!isValid && newEMI > 0 && (
            <p className="text-xs text-brand-pink mt-1">
              EMI is too low. Must be at least {currencySymbol}
              {minEMI.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  impact.newEMI > loan.emi ? 'text-brand-dark-purple' : 'text-brand-pink'
                }`}>
                  {currencySymbol}
                  {impact.newEMI.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Remaining Tenure</p>
                <p className="text-sm font-medium text-gray-900">
                  {loan.tenure} months
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">New Tenure</p>
                <p className={`text-sm font-medium ${
                  impact.newTenure < loan.tenure ? 'text-brand-dark-purple' : 'text-brand-pink'
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

export default EditEmiModal;

