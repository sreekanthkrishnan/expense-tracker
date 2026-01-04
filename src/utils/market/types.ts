/**
 * Market Data Types
 * 
 * Type definitions for market data fetching and caching.
 */

export interface GoldSilverRates {
  gold24K: {
    perGram: number;
    per8Gram: number;
  };
  gold22K: {
    perGram: number;
    per8Gram: number;
  };
  silver: {
    perGram: number;
    per8Gram: number;
  };
  fetchedAt: string; // ISO timestamp
  currency: string;
  sanityCheckFailed?: boolean; // True if price validation failed
}

// Legacy interface for backward compatibility
export interface LegacyGoldSilverRates {
  gold: {
    perGram: number;
    per8Gram: number;
  };
  silver: {
    perGram: number;
    per8Gram: number;
  };
  fetchedAt: string;
  currency: string;
}

export interface HistoricalPricePoint {
  date: string; // ISO date string
  gold24K: number;
  gold22K: number;
  silver: number;
}

export interface MetalHistory {
  metal: 'gold24K' | 'gold22K' | 'silver';
  data: Array<{
    date: string;
    price: number;
  }>;
  currency: string;
  fetchedAt: string;
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
