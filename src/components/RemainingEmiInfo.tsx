import type { LoanProgress } from '../utils/loanCalculations';
import { Icon } from './common/Icon';

interface RemainingEmiInfoProps {
  progress: LoanProgress;
  currencySymbol: string;
}

const RemainingEmiInfo = ({ progress, currencySymbol }: RemainingEmiInfoProps) => {
  if (progress.emisRemaining === 0) {
    return (
      <div className="bg-brand-yellow bg-opacity-20 border border-brand-yellow rounded-lg p-3 mb-3">
        <p className="text-sm font-semibold text-brand-dark-purple flex items-center gap-2">
          <Icon name="CheckCircle" size={16} className="text-green-600" />
          Loan Completed
        </p>
      </div>
    );
  }

  return (
    <div className="bg-brand-purple bg-opacity-10 border border-brand-purple rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs text-gray-600 mb-0.5">EMIs Remaining</p>
          <p className="text-lg sm:text-xl font-bold text-brand-purple">
            {progress.emisRemaining} of {progress.emisPaid + progress.emisRemaining} EMIs
          </p>
        </div>
      </div>
      <div className="pt-2 border-t border-brand-purple border-opacity-30">
        <p className="text-xs text-gray-600 mb-0.5">Outstanding Principal</p>
        <p className="text-base font-semibold text-gray-900 text-money">
          {currencySymbol}
          {progress.remainingPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
};

export default RemainingEmiInfo;

