import type { Loan } from '../types/index';
import { calculateEMI } from '../store/slices/loanSlice';
import { calculateLoanProgress } from './loanCalculations';

export interface LoanImpact {
  newEMI: number;
  newTenure: number;
  interestSaved: number;
  interestIncreased: number;
  newEndDate: string;
  monthsSaved: number;
  monthsAdded: number;
}

/**
 * Calculate new tenure when EMI is changed
 */
export const calculateNewTenureFromEMI = (
  loan: Loan,
  newEMI: number
): { newTenure: number; interestImpact: number } => {
  if (newEMI <= 0 || loan.outstandingBalance <= 0) {
    return { newTenure: loan.tenure, interestImpact: 0 };
  }

  const monthlyRate = loan.interestRate / (12 * 100);
  
  if (loan.interestType === 'flat') {
    // Flat interest: tenure = (Outstanding + Interest) / EMI
    const remainingInterest = (loan.outstandingBalance * loan.interestRate) / 100; // Annual interest
    const newTenure = Math.ceil((loan.outstandingBalance + remainingInterest) / newEMI);
    const totalPayable = newEMI * newTenure;
    const originalTotalPayable = loan.emi * loan.tenure;
    const interestImpact = originalTotalPayable - totalPayable;
    
    return { newTenure: Math.max(1, newTenure), interestImpact };
  } else {
    // Reducing balance: calculate tenure from EMI formula
    if (monthlyRate === 0) {
      const newTenure = Math.ceil(loan.outstandingBalance / newEMI);
      const totalPayable = newEMI * newTenure;
      const originalTotalPayable = loan.emi * loan.tenure;
      const interestImpact = originalTotalPayable - totalPayable;
      return { newTenure: Math.max(1, newTenure), interestImpact };
    }

    try {
      // n = -log(1 - (P*r)/EMI) / log(1+r)
      const ratio = (loan.outstandingBalance * monthlyRate) / newEMI;
      if (ratio >= 1) {
        // EMI too low, cannot pay off
        return { newTenure: loan.tenure, interestImpact: 0 };
      }
      
      const newTenure = Math.ceil(-Math.log(1 - ratio) / Math.log(1 + monthlyRate));
      const totalPayable = newEMI * newTenure;
      const originalTotalPayable = loan.emi * loan.tenure;
      const interestImpact = originalTotalPayable - totalPayable;
      
      return { newTenure: Math.max(1, newTenure), interestImpact };
    } catch (error) {
      // Fallback calculation
      const estimatedTenure = Math.ceil(loan.outstandingBalance / newEMI);
      const totalPayable = newEMI * estimatedTenure;
      const originalTotalPayable = loan.emi * loan.tenure;
      const interestImpact = originalTotalPayable - totalPayable;
      return { newTenure: Math.max(1, estimatedTenure), interestImpact };
    }
  }
};

/**
 * Calculate new EMI when tenure is changed
 */
export const calculateNewEMIFromTenure = (
  loan: Loan,
  newRemainingTenure: number
): { newEMI: number; interestImpact: number } => {
  if (newRemainingTenure <= 0 || loan.outstandingBalance <= 0) {
    return { newEMI: loan.emi, interestImpact: 0 };
  }

  const newEMI = calculateEMI(
    loan.outstandingBalance,
    loan.interestRate,
    newRemainingTenure,
    loan.interestType
  );

  const totalPayable = newEMI * newRemainingTenure;
  const originalTotalPayable = loan.emi * loan.tenure;
  const interestImpact = originalTotalPayable - totalPayable;

  return { newEMI, interestImpact };
};

/**
 * Calculate minimum EMI for a loan
 */
export const calculateMinimumEMI = (loan: Loan): number => {
  // Minimum EMI should at least cover the interest
  const monthlyInterest = (loan.outstandingBalance * loan.interestRate) / (12 * 100);
  return monthlyInterest * 1.1; // 10% buffer
};

/**
 * Calculate full loan impact when EMI or tenure changes
 */
export const calculateLoanImpact = (
  loan: Loan,
  newEMI?: number,
  newRemainingTenure?: number
): LoanImpact => {
  const startDate = new Date(loan.startDate);
  const progress = calculateLoanProgress(loan);
  const currentRemainingTenure = progress.emisRemaining;

  let finalEMI: number;
  let finalTenure: number;
  let interestImpact: number;

  if (newEMI !== undefined) {
    // User changed EMI
    finalEMI = newEMI;
    const result = calculateNewTenureFromEMI(loan, newEMI);
    finalTenure = result.newTenure;
    interestImpact = result.interestImpact;
  } else if (newRemainingTenure !== undefined) {
    // User changed tenure
    finalTenure = newRemainingTenure;
    const result = calculateNewEMIFromTenure(loan, newRemainingTenure);
    finalEMI = result.newEMI;
    interestImpact = result.interestImpact;
  } else {
    // No changes
    finalEMI = loan.emi;
    finalTenure = currentRemainingTenure;
    interestImpact = 0;
  }

  // Calculate new end date based on remaining tenure
  const newEndDate = new Date(startDate);
  const emisPaid = progress.emisPaid;
  newEndDate.setMonth(newEndDate.getMonth() + emisPaid + finalTenure);

  const monthsSaved = finalTenure < currentRemainingTenure ? currentRemainingTenure - finalTenure : 0;
  const monthsAdded = finalTenure > currentRemainingTenure ? finalTenure - currentRemainingTenure : 0;

  return {
    newEMI: finalEMI,
    newTenure: finalTenure,
    interestSaved: interestImpact > 0 ? interestImpact : 0,
    interestIncreased: interestImpact < 0 ? Math.abs(interestImpact) : 0,
    newEndDate: newEndDate.toISOString().split('T')[0],
    monthsSaved,
    monthsAdded,
  };
};

/**
 * Generate smart suggestions based on impact
 */
export const generateImpactSuggestions = (
  impact: LoanImpact,
  currencySymbol: string
): string[] => {
  const suggestions: string[] = [];

  if (impact.interestSaved > 0) {
    suggestions.push(
      `💰 Save ${currencySymbol}${impact.interestSaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in interest`
    );
  }

  if (impact.monthsSaved > 0) {
    suggestions.push(`⏰ Loan closes ${impact.monthsSaved} month${impact.monthsSaved > 1 ? 's' : ''} earlier`);
  }

  if (impact.interestIncreased > 0) {
    suggestions.push(
      `⚠️ Interest increases by ${currencySymbol}${impact.interestIncreased.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    );
  }

  if (impact.monthsAdded > 0) {
    suggestions.push(`⏳ Loan extends by ${impact.monthsAdded} month${impact.monthsAdded > 1 ? 's' : ''}`);
  }

  return suggestions;
};

