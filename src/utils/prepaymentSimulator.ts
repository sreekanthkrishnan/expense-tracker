/**
 * Pre-Payment Simulation Utility
 * 
 * Calculates the impact of a lump-sum pre-payment on a loan.
 * Supports two modes: Reduce Tenure or Reduce EMI
 */

import type { Loan } from '../types/index';
import { calculateEMI } from '../store/slices/loanSlice';
import { calculateLoanProgress } from './loanCalculations';

export interface PrepaymentSimulation {
  newEMI: number;
  newRemainingTenure: number;
  interestSaved: number;
  monthsSaved: number;
  newEndDate: string;
  totalPayableBefore: number;
  totalPayableAfter: number;
}

export interface PrepaymentInput {
  loan: Loan;
  prepaymentAmount: number;
  mode: 'TENURE' | 'EMI';
}

/**
 * Simulate pre-payment impact on a loan
 */
export const simulatePrepayment = ({
  loan,
  prepaymentAmount,
  mode,
}: PrepaymentInput): PrepaymentSimulation | null => {
  if (prepaymentAmount <= 0 || prepaymentAmount > loan.outstandingBalance) {
    return null;
  }

  const progress = calculateLoanProgress(loan);
  const currentRemainingTenure = progress.emisRemaining;
  const remainingPrincipal = loan.outstandingBalance - prepaymentAmount;

  if (remainingPrincipal <= 0) {
    // Pre-payment covers entire loan
    return {
      newEMI: 0,
      newRemainingTenure: 0,
      interestSaved: progress.totalInterestRemaining,
      monthsSaved: currentRemainingTenure,
      newEndDate: new Date().toISOString().split('T')[0],
      totalPayableBefore: loan.emi * currentRemainingTenure,
      totalPayableAfter: prepaymentAmount,
    };
  }

  let newEMI: number;
  let newRemainingTenure: number;

  if (mode === 'TENURE') {
    // Keep EMI same, reduce tenure
    newEMI = loan.emi;
    newRemainingTenure = calculateRemainingTenure(
      remainingPrincipal,
      loan.emi,
      loan.interestRate,
      loan.interestType
    );
  } else {
    // Keep tenure same, reduce EMI
    newRemainingTenure = currentRemainingTenure;
    newEMI = calculateEMI(
      remainingPrincipal,
      loan.interestRate,
      newRemainingTenure,
      loan.interestType
    );
  }

  // Calculate total payable after pre-payment
  const totalPayableAfter = prepaymentAmount + (newEMI * newRemainingTenure);
  
  // Calculate total payable before (without pre-payment)
  const totalPayableBefore = loan.emi * currentRemainingTenure;
  
  // Interest saved
  const interestSaved = totalPayableBefore - totalPayableAfter;

  // Months saved
  const monthsSaved = mode === 'TENURE' 
    ? Math.max(0, currentRemainingTenure - newRemainingTenure)
    : 0;

  // Calculate new end date
  const startDate = new Date(loan.startDate);
  const emisPaid = progress.emisPaid;
  const newEndDate = new Date(startDate);
  newEndDate.setMonth(newEndDate.getMonth() + emisPaid + newRemainingTenure);

  return {
    newEMI,
    newRemainingTenure,
    interestSaved: Math.max(0, interestSaved),
    monthsSaved,
    newEndDate: newEndDate.toISOString().split('T')[0],
    totalPayableBefore,
    totalPayableAfter,
  };
};

/**
 * Calculate remaining tenure after pre-payment (for TENURE reduction mode)
 */
const calculateRemainingTenure = (
  remainingPrincipal: number,
  emi: number,
  interestRate: number,
  interestType: 'flat' | 'reducing'
): number => {
  if (emi <= 0 || remainingPrincipal <= 0) {
    return 0;
  }

  if (interestType === 'flat') {
    // Flat interest: tenure = (Principal + Interest) / EMI
    const remainingInterest = (remainingPrincipal * interestRate) / 100; // Annual interest
    const tenure = Math.ceil((remainingPrincipal + remainingInterest) / emi);
    return Math.max(1, tenure);
  } else {
    // Reducing balance: n = -log(1 - (P*r)/EMI) / log(1+r)
    const monthlyRate = interestRate / (12 * 100);
    
    if (monthlyRate === 0) {
      return Math.ceil(remainingPrincipal / emi);
    }

    try {
      const ratio = (remainingPrincipal * monthlyRate) / emi;
      if (ratio >= 1) {
        // EMI too low, cannot pay off
        return 0;
      }
      
      const tenure = Math.ceil(-Math.log(1 - ratio) / Math.log(1 + monthlyRate));
      return Math.max(1, tenure);
    } catch (error) {
      // Fallback calculation
      return Math.ceil(remainingPrincipal / emi);
    }
  }
};

/**
 * Generate smart insights based on simulation
 */
export const generatePrepaymentInsights = (
  simulation: PrepaymentSimulation,
  prepaymentAmount: number,
  mode: 'TENURE' | 'EMI',
  currencySymbol: string
): string[] => {
  const insights: string[] = [];

  if (simulation.monthsSaved > 0) {
    insights.push(
      `Pre-payment of ${currencySymbol}${prepaymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} closes loan ${simulation.monthsSaved} month${simulation.monthsSaved > 1 ? 's' : ''} earlier`
    );
  }

  if (simulation.interestSaved > 0) {
    insights.push(
      `You save ${currencySymbol}${simulation.interestSaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in interest`
    );
  }

  if (mode === 'TENURE' && simulation.monthsSaved > 0) {
    insights.push(
      `Tenure reduction gives better savings than EMI reduction`
    );
  }

  return insights;
};

