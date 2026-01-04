/**
 * Market Data Types
 * 
 * Type definitions for market data fetching and caching.
 */

export interface GoldSilverRates {
  gold: {
    perGram: number;
    per8Gram: number;
  };
  silver: {
    perGram: number;
    per8Gram: number;
  };
  fetchedAt: string; // ISO timestamp
  currency: string;
}

export interface MutualFundData {
  fundName: string;
  nav: number; // Net Asset Value
  cagr1Y?: number; // 1-year CAGR
  cagr3Y?: number; // 3-year CAGR
  cagr5Y?: number; // 5-year CAGR
  fetchedAt: string;
}

export interface FDRate {
  tenureMonths: number;
  interestRate: number; // Annual percentage
  bankName?: string;
  fetchedAt: string;
}

export interface MarketDataCache {
  goldSilver?: GoldSilverRates;
  mutualFunds?: { [fundName: string]: MutualFundData };
  fdRates?: FDRate[];
  lastUpdated: string;
}

export interface GrowthPrediction {
  currentValue: number;
  predictedValue: number;
  growthPercentage: number;
  annualReturnRate: number;
  yearsToTarget: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  disclaimer: string;
}
