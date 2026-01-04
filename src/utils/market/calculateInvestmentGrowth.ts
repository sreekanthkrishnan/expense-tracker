/**
 * Calculate Investment Growth Prediction
 * 
 * Calculates predicted future value of investments based on:
 * - Current market rates
 * - Historical performance (CAGR)
 * - Investment type and tenure
 * 
 * SECURITY: All calculations are client-side, no sensitive data sent to servers.
 */

import type { SavingsGoal } from '../../types';
import type { GrowthPrediction } from './types';
// No imports needed - backend owns all rate data, frontend uses historical averages for predictions
import { fetchMutualFundData } from './fetchMutualFundData';
import { getFDRateForTenure } from './fetchFDRates';

/**
 * Calculate years until target date
 */
const getYearsToTarget = (targetDate: string): number => {
  const target = new Date(targetDate);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, diffYears);
};

/**
 * Calculate compound interest
 */
const compoundInterest = (
  principal: number,
  rate: number, // Annual rate as percentage (e.g., 8.5 for 8.5%)
  years: number
): number => {
  return principal * Math.pow(1 + rate / 100, years);
};

/**
 * Calculate growth for Gold investment
 * Uses historical average - no API calls needed
 */
const calculateGoldGrowth = async (
  currentValue: number,
  years: number
): Promise<GrowthPrediction> => {
  // Historical average annual growth for gold (typically 8-12% over long term)
  // Using conservative estimate of 10% annual growth
  // No API calls - backend owns all rate data
  const avgAnnualGrowth = 10.0;

  // Calculate predicted value
  const predictedValue = compoundInterest(currentValue, avgAnnualGrowth, years);
  const growthPercentage = ((predictedValue - currentValue) / currentValue) * 100;

  return {
    currentValue,
    predictedValue,
    growthPercentage,
    annualReturnRate: avgAnnualGrowth,
    yearsToTarget: years,
    riskLevel: 'Medium', // Gold has medium risk
    disclaimer: 'Predictions based on historical average growth. Actual returns may vary significantly.',
  };
};

/**
 * Calculate growth for Silver investment
 * Uses historical average - no API calls needed
 */
const calculateSilverGrowth = async (
  currentValue: number,
  years: number
): Promise<GrowthPrediction> => {
  // Historical average annual growth for silver (typically 6-10% over long term)
  // No API calls - backend owns all rate data
  const avgAnnualGrowth = 8.0;

  const predictedValue = compoundInterest(currentValue, avgAnnualGrowth, years);
  const growthPercentage = ((predictedValue - currentValue) / currentValue) * 100;

  return {
    currentValue,
    predictedValue,
    growthPercentage,
    annualReturnRate: avgAnnualGrowth,
    yearsToTarget: years,
    riskLevel: 'Medium',
    disclaimer: 'Predictions based on historical average growth. Silver prices can be volatile.',
  };
};

/**
 * Calculate growth for Mutual Fund investment
 */
const calculateMutualFundGrowth = async (
  currentValue: number,
  years: number,
  fundName?: string,
  expectedReturn?: number
): Promise<GrowthPrediction> => {
  let annualReturn = expectedReturn || 12.0; // Default 12% if not specified

  // Try to fetch actual CAGR from fund data
  if (fundName) {
    const fundData = await fetchMutualFundData(fundName);
    if (fundData) {
      // Use 5-year CAGR if available, else 3-year, else 1-year
      if (fundData.cagr5Y) {
        annualReturn = fundData.cagr5Y;
      } else if (fundData.cagr3Y) {
        annualReturn = fundData.cagr3Y;
      } else if (fundData.cagr1Y) {
        annualReturn = fundData.cagr1Y;
      }
    }
  }

  // Apply conservative/expected/optimistic scenarios
  // For now, use expected (can be extended)
  const predictedValue = compoundInterest(currentValue, annualReturn, years);
  const growthPercentage = ((predictedValue - currentValue) / currentValue) * 100;

  return {
    currentValue,
    predictedValue,
    growthPercentage,
    annualReturnRate: annualReturn,
    yearsToTarget: years,
    riskLevel: 'High', // Mutual funds have higher risk
    disclaimer: 'Predictions based on historical CAGR. Past performance does not guarantee future returns.',
  };
};

/**
 * Calculate growth for Fixed Deposit
 */
const calculateFDGrowth = async (
  currentValue: number,
  years: number,
  tenureMonths?: number
): Promise<GrowthPrediction> => {
  // Get FD rate for tenure
  const tenure = tenureMonths || Math.round(years * 12);
  const interestRate = await getFDRateForTenure(tenure);

  // FD uses compound interest (quarterly compounding typically)
  // Simplified: annual compounding
  const predictedValue = compoundInterest(currentValue, interestRate, years);
  const growthPercentage = ((predictedValue - currentValue) / currentValue) * 100;

  return {
    currentValue,
    predictedValue,
    growthPercentage,
    annualReturnRate: interestRate,
    yearsToTarget: years,
    riskLevel: 'Low', // FD is low risk
    disclaimer: 'Predictions based on current FD rates. Rates may change on renewal.',
  };
};

/**
 * Calculate growth for Recurring Deposit
 */
const calculateRDGrowth = async (
  currentValue: number,
  years: number,
  tenureMonths?: number
): Promise<GrowthPrediction> => {
  // RD typically has slightly lower rates than FD
  const tenure = tenureMonths || Math.round(years * 12);
  const fdRate = await getFDRateForTenure(tenure);
  const rdRate = fdRate * 0.95; // RD is typically 0.5-1% lower than FD

  // RD calculation is more complex (monthly deposits), simplified here
  const predictedValue = compoundInterest(currentValue, rdRate, years);
  const growthPercentage = ((predictedValue - currentValue) / currentValue) * 100;

  return {
    currentValue,
    predictedValue,
    growthPercentage,
    annualReturnRate: rdRate,
    yearsToTarget: years,
    riskLevel: 'Low',
    disclaimer: 'Predictions based on current RD rates. Simplified calculation.',
  };
};

/**
 * Calculate growth for Index Fund
 */
const calculateIndexFundGrowth = async (
  currentValue: number,
  years: number,
  fundName?: string
): Promise<GrowthPrediction> => {
  // Index funds typically track market indices (Nifty, Sensex, etc.)
  // Historical average: 10-15% CAGR
  let annualReturn = 12.0;

  if (fundName) {
    const fundData = await fetchMutualFundData(fundName);
    if (fundData?.cagr5Y) {
      annualReturn = fundData.cagr5Y;
    }
  }

  const predictedValue = compoundInterest(currentValue, annualReturn, years);
  const growthPercentage = ((predictedValue - currentValue) / currentValue) * 100;

  return {
    currentValue,
    predictedValue,
    growthPercentage,
    annualReturnRate: annualReturn,
    yearsToTarget: years,
    riskLevel: 'Medium',
    disclaimer: 'Predictions based on historical index performance. Market conditions may vary.',
  };
};

/**
 * Calculate growth for Custom investment
 */
const calculateCustomGrowth = (
  currentValue: number,
  years: number,
  expectedReturnRate?: number
): GrowthPrediction => {
  const annualReturn = expectedReturnRate || 8.0; // Default 8%
  const predictedValue = compoundInterest(currentValue, annualReturn, years);
  const growthPercentage = ((predictedValue - currentValue) / currentValue) * 100;

  return {
    currentValue,
    predictedValue,
    growthPercentage,
    annualReturnRate: annualReturn,
    yearsToTarget: years,
    riskLevel: 'Medium', // Unknown for custom
    disclaimer: 'Predictions based on provided expected return rate. Actual returns may vary.',
  };
};

/**
 * Main function to calculate investment growth
 * No currency parameter needed - backend owns all rate data
 */
export const calculateInvestmentGrowth = async (
  goal: SavingsGoal
): Promise<GrowthPrediction | null> => {
  if (!goal.investmentType) {
    // No investment type - return null (regular savings goal)
    return null;
  }

  const currentValue = goal.currentSavings;
  const years = getYearsToTarget(goal.targetDate);
  const investmentType = goal.investmentType;
  const meta = goal.investmentMeta || {};

  switch (investmentType) {
    case 'gold':
      return await calculateGoldGrowth(currentValue, years);
    
    case 'silver':
      return await calculateSilverGrowth(currentValue, years);
    
    case 'mutual_fund':
      return await calculateMutualFundGrowth(
        currentValue,
        years,
        meta.fundName,
        meta.expectedReturnRate
      );
    
    case 'fd':
      return await calculateFDGrowth(currentValue, years, meta.tenureMonths);
    
    case 'rd':
      return await calculateRDGrowth(currentValue, years, meta.tenureMonths);
    
    case 'index_fund':
      return await calculateIndexFundGrowth(currentValue, years, meta.fundName);
    
    case 'custom':
      return calculateCustomGrowth(currentValue, years, meta.expectedReturnRate);
    
    default:
      return null;
  }
};
