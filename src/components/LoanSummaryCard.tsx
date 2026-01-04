import type { Loan } from '../types';
import { calculateLoanProgress } from '../utils/loanCalculations';

interface LoanSummaryCardProps {
  loans: Loan[];
  currencySymbol: string;
}

const LoanSummaryCard = ({ loans, currencySymbol }: LoanSummaryCardProps) => {
  const activeLoans = loans.filter((l) => l.status === 'Active' && l.type === 'taken');
  
  if (activeLoans.length === 0) {
    return null;
  }

  const totalEMI = activeLoans.reduce((sum, loan) => sum + loan.emi, 0);
  
  const totalOutstanding = activeLoans.reduce((sum, loan) => sum + loan.outstandingBalance, 0);
  
  const totalRemainingEMIs = activeLoans.reduce((sum, loan) => {
    const progress = calculateLoanProgress(loan);
    return sum + progress.emisRemaining;
  }, 0);

  const totalInterestRemaining = activeLoans.reduce((sum, loan) => {
    const progress = calculateLoanProgress(loan);
    return sum + progress.totalInterestRemaining;
  }, 0);

  return (
    <div className="card mb-6 bg-gradient-to-r from-brand-purple from-opacity-10 to-brand-dark-purple to-opacity-10 border-brand-purple border-opacity-30">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Loan Summary</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div>
          <p className="text-xs text-gray-600 mb-1">Total EMIs Remaining</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900">{totalRemainingEMIs}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Total Outstanding</p>
          <p className="text-lg sm:text-xl font-bold status-expense text-money">
            {currencySymbol}
            {totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Monthly EMI Burden</p>
          <p className="text-lg sm:text-xl font-bold status-loan text-money">
            {currencySymbol}
            {totalEMI.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Interest Yet to Pay</p>
          <p className="text-lg sm:text-xl font-bold status-expense text-money">
            {currencySymbol}
            {totalInterestRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoanSummaryCard;

