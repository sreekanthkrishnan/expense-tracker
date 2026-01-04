import type { LoanProgress } from '../utils/loanCalculations';

interface LoanProgressBarProps {
  progress: LoanProgress;
  loanName: string;
}

const LoanProgressBar = ({ progress, loanName }: LoanProgressBarProps) => {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-600">EMI Progress</span>
        <span className="text-xs font-medium text-gray-900">
          {progress.progressPercentage.toFixed(1)}% Complete
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-2.5 rounded-full transition-all duration-500"
          style={{ 
            width: `${Math.min(100, Math.max(0, progress.progressPercentage))}%`,
            backgroundColor: 'var(--color-loan)'
          }}
          role="progressbar"
          aria-valuenow={progress.progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${loanName} EMI progress: ${progress.progressPercentage.toFixed(1)}%`}
        ></div>
      </div>
    </div>
  );
};

export default LoanProgressBar;

