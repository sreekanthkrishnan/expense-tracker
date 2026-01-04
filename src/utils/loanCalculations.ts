import type { Loan } from '../types';

export interface LoanProgress {
  emisPaid: number;
  emisRemaining: number;
  progressPercentage: number;
  remainingPrincipal: number;
  totalInterestPaid: number;
  totalInterestRemaining: number;
}

export interface EarlyClosureTip {
  type: 'prepay' | 'extra-emi' | 'increase-emi' | 'high-interest';
  title: string;
  description: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Calculate loan progress based on outstanding balance and tenure
 */
export const calculateLoanProgress = (loan: Loan): LoanProgress => {
  if (loan.status === 'Closed' || loan.outstandingBalance <= 0) {
    return {
      emisPaid: loan.tenure,
      emisRemaining: 0,
      progressPercentage: 100,
      remainingPrincipal: 0,
      totalInterestPaid: loan.emi * loan.tenure - loan.principal,
      totalInterestRemaining: 0,
    };
  }

  // Calculate EMIs paid based on outstanding balance
  // For reducing balance: use reverse EMI calculation
  // For flat: linear calculation
  const totalPayable = loan.emi * loan.tenure;
  const totalInterest = totalPayable - loan.principal;
  const principalPaid = loan.principal - loan.outstandingBalance;
  
  let emisPaid: number;
  if (loan.interestType === 'flat') {
    // Flat interest: principal reduces linearly
    const principalPaidPercentage = loan.principal > 0 ? principalPaid / loan.principal : 0;
    emisPaid = Math.round(principalPaidPercentage * loan.tenure);
  } else {
    // Reducing balance: calculate remaining tenure from outstanding balance
    // Using the EMI formula in reverse
    const monthlyRate = loan.interestRate / (12 * 100);
    if (monthlyRate === 0 || loan.outstandingBalance <= 0 || loan.emi <= 0) {
      emisPaid = loan.tenure;
    } else {
      try {
        // Calculate remaining tenure: n = -log(1 - (P*r)/EMI) / log(1+r)
        // Where P = outstanding balance, r = monthly rate, EMI = monthly payment
        const ratio = (loan.outstandingBalance * monthlyRate) / loan.emi;
        if (ratio >= 1) {
          // Outstanding balance too high, likely early in loan
          emisPaid = 0;
        } else {
          const remainingTenure = Math.ceil(
            -Math.log(1 - ratio) / Math.log(1 + monthlyRate)
          );
          emisPaid = Math.max(0, Math.min(loan.tenure, loan.tenure - remainingTenure));
        }
      } catch (error) {
        // Fallback: estimate based on principal paid
        const principalPaidPercentage = loan.principal > 0 ? principalPaid / loan.principal : 0;
        emisPaid = Math.round(principalPaidPercentage * loan.tenure * 0.85); // Adjustment for reducing balance
      }
    }
  }

  const emisRemaining = Math.max(0, loan.tenure - emisPaid);
  const progressPercentage = loan.tenure > 0 ? (emisPaid / loan.tenure) * 100 : 0;
  
  // Estimate interest paid (approximate)
  const interestPaidPercentage = emisPaid / loan.tenure;
  const totalInterestPaid = totalInterest * interestPaidPercentage;
  const totalInterestRemaining = totalInterest - totalInterestPaid;

  return {
    emisPaid,
    emisRemaining,
    progressPercentage,
    remainingPrincipal: loan.outstandingBalance,
    totalInterestPaid,
    totalInterestRemaining,
  };
};

/**
 * Generate early closure tips for a loan
 */
export const generateEarlyClosureTips = (loan: Loan, currencySymbol: string): EarlyClosureTip[] => {
  const tips: EarlyClosureTip[] = [];
  
  if (loan.status !== 'Active' || loan.type !== 'taken') {
    return tips;
  }

  const progress = calculateLoanProgress(loan);
  
  // High interest loan warning
  if (loan.interestRate > 15) {
    tips.push({
      type: 'high-interest',
      title: '⚠️ High Interest Loan',
      description: `This loan has ${loan.interestRate.toFixed(1)}% interest rate. Consider prioritizing closure.`,
      impact: `You'll pay ${currencySymbol}${progress.totalInterestRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in remaining interest.`,
      priority: 'high',
    });
  }

  // Prepayment suggestion
  if (progress.emisRemaining > 6 && loan.outstandingBalance > loan.emi * 3) {
    const prepayAmount = loan.emi * 3; // Suggest 3 EMIs worth
    const emisSaved = Math.floor(prepayAmount / loan.emi);
    if (emisSaved > 0) {
      tips.push({
        type: 'prepay',
        title: '💡 Prepay to Reduce EMIs',
        description: `Prepay ${currencySymbol}${prepayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} now`,
        impact: `Could reduce ${emisSaved} EMIs and save interest`,
        priority: 'medium',
      });
    }
  }

  // Extra EMI per year
  if (progress.emisRemaining > 12) {
    const monthsSaved = Math.floor(progress.emisRemaining / 13); // One extra EMI per year
    if (monthsSaved > 0) {
      tips.push({
        type: 'extra-emi',
        title: '💡 Pay One Extra EMI Per Year',
        description: 'Pay one additional EMI annually',
        impact: `Loan closes ${monthsSaved} months earlier`,
        priority: 'medium',
      });
    }
  }

  // Increase EMI suggestion
  if (progress.emisRemaining > 6 && loan.emi < loan.outstandingBalance * 0.1) {
    const increasedEMI = loan.emi * 1.2; // 20% increase
    const newTenure = Math.ceil(loan.outstandingBalance / (increasedEMI - (loan.outstandingBalance * loan.interestRate / 1200)));
    const monthsSaved = progress.emisRemaining - newTenure;
    if (monthsSaved > 0) {
      const extraPerMonth = increasedEMI - loan.emi;
      tips.push({
        type: 'increase-emi',
        title: '💡 Increase EMI',
        description: `Increase EMI by ${currencySymbol}${extraPerMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        impact: `Save ${monthsSaved} months and reduce interest`,
        priority: 'low',
      });
    }
  }

  return tips.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

/**
 * Check if loan has high interest
 */
export const isHighInterestLoan = (loan: Loan): boolean => {
  return loan.interestRate > 15;
};

/**
 * Check if loan has long remaining tenure
 */
export const isLongTenureLoan = (loan: Loan): boolean => {
  const progress = calculateLoanProgress(loan);
  return progress.emisRemaining > 24; // More than 2 years
};

/**
 * Check if loan is interest-heavy (high interest paid vs principal)
 */
export const isInterestHeavyLoan = (loan: Loan): boolean => {
  const totalPayable = loan.emi * loan.tenure;
  const totalInterest = totalPayable - loan.principal;
  const interestRatio = totalInterest / loan.principal;
  return interestRatio > 0.5; // Interest is more than 50% of principal
};

