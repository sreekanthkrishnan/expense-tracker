import { useState, useEffect } from 'react';
import type { Loan } from '../types/index';
import { simulatePrepayment, generatePrepaymentInsights, type PrepaymentSimulation } from '../utils/prepaymentSimulator';
import { calculateLoanProgress } from '../utils/loanCalculations';
import { Icon } from './common/Icon';

interface PrepaymentSimulatorProps {
  loan: Loan;
  currencySymbol: string;
  onApply?: (loan: Loan, prepaymentAmount: number, mode: 'TENURE' | 'EMI') => void;
}

const PrepaymentSimulator = ({ loan, currencySymbol, onApply }: PrepaymentSimulatorProps) => {
  const progress = calculateLoanProgress(loan);
  const [isExpanded, setIsExpanded] = useState(false);
  const [prepaymentAmount, setPrepaymentAmount] = useState(0);
  const [mode, setMode] = useState<'TENURE' | 'EMI'>('TENURE');
  const [simulation, setSimulation] = useState<PrepaymentSimulation | null>(null);

  useEffect(() => {
    if (prepaymentAmount > 0 && prepaymentAmount <= loan.outstandingBalance) {
      const result = simulatePrepayment({
        loan,
        prepaymentAmount,
        mode,
      });
      setSimulation(result);
    } else {
      setSimulation(null);
    }
  }, [prepaymentAmount, mode, loan]);

  const handleApply = () => {
    if (simulation && onApply) {
      onApply(loan, prepaymentAmount, mode);
      // Reset form
      setPrepaymentAmount(0);
      setSimulation(null);
      setIsExpanded(false);
    }
  };

  const maxPrepayment = loan.outstandingBalance;
  const isValid = prepaymentAmount > 0 && prepaymentAmount <= maxPrepayment;
  const isLowImpact = prepaymentAmount > 0 && prepaymentAmount < maxPrepayment * 0.05; // Less than 5% of outstanding

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full mt-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
        aria-label="Simulate pre-payment"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Icon name="Zap" size={16} className="text-gray-900" />
            Simulate Pre-Payment
          </span>
          <Icon name="ChevronDown" size={20} className="text-gray-400" />
        </div>
      </button>
    );
  }

  return (
    <div className="mt-3 p-4 border border-gray-300 rounded-lg bg-gray-50 slide-up">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900">Pre-Payment Simulator</h4>
        <button
          onClick={() => {
            setIsExpanded(false);
            setPrepaymentAmount(0);
            setSimulation(null);
          }}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close simulator"
        >
          <Icon name="X" size={20} />
        </button>
      </div>

      {/* Pre-Payment Input */}
      <div className="space-y-4">
        <div>
          <label htmlFor="prepayment-amount" className="block text-sm font-medium text-gray-700 mb-2">
            Pre-Payment Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              {currencySymbol}
            </span>
            <input
              type="number"
              id="prepayment-amount"
              value={prepaymentAmount || ''}
              onChange={(e) => setPrepaymentAmount(parseFloat(e.target.value) || 0)}
              className="input pl-8"
              min="0"
              max={maxPrepayment}
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Maximum: {currencySymbol}
            {maxPrepayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {!isValid && prepaymentAmount > 0 && (
            <p className="text-xs text-red-600 mt-1">
              Amount must be between 0 and {currencySymbol}
              {maxPrepayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
          {isLowImpact && isValid && (
            <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
              <Icon name="AlertTriangle" size={14} />
              Small pre-payment amount. Impact may be minimal.
            </p>
          )}
        </div>

        {/* Pre-Payment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pre-Payment Type
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="prepayment-mode"
                value="TENURE"
                checked={mode === 'TENURE'}
                onChange={() => setMode('TENURE')}
                className="mr-3"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">Reduce Tenure</span>
                <p className="text-xs text-gray-600">Keep EMI same, pay off faster</p>
              </div>
            </label>
            <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="prepayment-mode"
                value="EMI"
                checked={mode === 'EMI'}
                onChange={() => setMode('EMI')}
                className="mr-3"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">Reduce EMI</span>
                <p className="text-xs text-gray-600">Keep tenure same, lower monthly payment</p>
              </div>
            </label>
          </div>
        </div>

        {/* Before vs After Comparison */}
        {simulation && isValid && (
          <div className="border border-gray-200 rounded-lg p-4 bg-white slide-up">
            <h5 className="text-sm font-semibold text-gray-900 mb-4">Impact Comparison</h5>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Before */}
              <div>
                <p className="text-xs text-gray-600 mb-2">Before</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">EMI</p>
                    <p className="text-sm font-medium text-gray-900 text-money">
                      {currencySymbol}
                      {loan.emi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Remaining Tenure</p>
                    <p className="text-sm font-medium text-gray-900">
                      {progress.emisRemaining} months
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Interest Remaining</p>
                    <p className="text-sm font-medium text-gray-900 text-money">
                      {currencySymbol}
                      {progress.totalInterestRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* After */}
              <div>
                <p className="text-xs text-gray-600 mb-2">After</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">EMI</p>
                    <p className={`text-sm font-medium text-money ${
                      mode === 'EMI' && simulation.newEMI < loan.emi ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {currencySymbol}
                      {simulation.newEMI.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Remaining Tenure</p>
                    <p className={`text-sm font-medium ${
                      mode === 'TENURE' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {simulation.newRemainingTenure} months
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Interest Saved</p>
                    <p className="text-sm font-medium text-green-600 text-money">
                      {currencySymbol}
                      {simulation.interestSaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings Summary */}
            {simulation.interestSaved > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Interest Saved</p>
                    <p className="text-base font-semibold text-green-800 text-money">
                      {currencySymbol}
                      {simulation.interestSaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  {simulation.monthsSaved > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">Months Saved</p>
                      <p className="text-base font-semibold text-green-800">
                        {simulation.monthsSaved}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* New End Date */}
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-1">New Loan End Date</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(simulation.newEndDate).toLocaleDateString()}
              </p>
            </div>

            {/* Smart Insights */}
            {simulation.interestSaved > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Icon name="Zap" size={14} />
                  Insights
                </p>
                <div className="space-y-1">
                  {generatePrepaymentInsights(simulation, prepaymentAmount, mode, currencySymbol).map((insight, idx) => (
                    <p key={idx} className="text-xs text-gray-700">{insight}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {onApply && (
              <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setPrepaymentAmount(0);
                    setSimulation(null);
                  }}
                  className="btn-secondary text-sm"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="btn-primary text-sm"
                >
                  Apply Pre-Payment
                </button>
              </div>
            )}
          </div>
        )}

        {/* Simulate Button */}
        {!simulation && (
          <button
            type="button"
            onClick={() => {
              if (isValid) {
                const result = simulatePrepayment({ loan, prepaymentAmount, mode });
                setSimulation(result);
              }
            }}
            disabled={!isValid}
            className="btn-primary w-full"
          >
            Simulate Impact
          </button>
        )}
      </div>
    </div>
  );
};

export default PrepaymentSimulator;

