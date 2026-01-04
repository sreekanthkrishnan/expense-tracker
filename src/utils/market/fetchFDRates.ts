/**
 * Fetch Fixed Deposit (FD) and Recurring Deposit (RD) Rates
 * 
 * Fetches current FD/RD interest rates from public sources.
 * Falls back to average rates if specific bank APIs are unavailable.
 * 
 * SECURITY: Uses public rate information, no authentication required.
 */

import type { FDRate } from './types';
import { getCachedMarketData, cacheFDRates, isCacheFresh } from './cacheMarketData';

/**
 * Fetch FD rates from RBI or bank APIs
 * Note: Most banks don't provide public APIs, so we use average rates
 */
const fetchFromRBI = async (): Promise<FDRate[] | null> => {
  try {
    // RBI provides policy rates, but not specific FD rates
    // For now, return null and use fallback
    return null;
  } catch (error) {
    console.warn('Failed to fetch from RBI:', error);
    return null;
  }
};

/**
 * Get average FD rates (fallback)
 * These are typical rates for Indian banks (can be updated manually)
 */
const getAverageFDRates = (): FDRate[] => {
  const now = new Date().toISOString();
  
  // Typical FD rates for different tenures (as of 2024)
  // These should be updated periodically or fetched from a reliable source
  return [
    {
      tenureMonths: 6,
      interestRate: 6.5, // 6.5% per annum
      bankName: 'Average',
      fetchedAt: now,
    },
    {
      tenureMonths: 12,
      interestRate: 7.0,
      bankName: 'Average',
      fetchedAt: now,
    },
    {
      tenureMonths: 24,
      interestRate: 7.25,
      bankName: 'Average',
      fetchedAt: now,
    },
    {
      tenureMonths: 36,
      interestRate: 7.5,
      bankName: 'Average',
      fetchedAt: now,
    },
    {
      tenureMonths: 60,
      interestRate: 7.75,
      bankName: 'Average',
      fetchedAt: now,
    },
  ];
};

/**
 * Fetch from custom API endpoint (if configured)
 * Users can set VITE_FD_RATES_API_URL in .env
 */
const fetchFromCustomAPI = async (): Promise<FDRate[] | null> => {
  try {
    const apiUrl = import.meta.env.VITE_FD_RATES_API_URL;
    
    if (!apiUrl) {
      return null;
    }

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Custom API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Parse response (adjust based on API structure)
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        tenureMonths: item.tenureMonths || item.tenure_months || 12,
        interestRate: parseFloat(item.interestRate || item.interest_rate || 0),
        bankName: item.bankName || item.bank_name || 'Unknown',
        fetchedAt: new Date().toISOString(),
      }));
    }

    return null;
  } catch (error) {
    console.warn('Failed to fetch from custom API:', error);
    return null;
  }
};

/**
 * Main function to fetch FD rates
 */
export const fetchFDRates = async (forceRefresh: boolean = false): Promise<FDRate[]> => {
  // Check cache first
  if (!forceRefresh) {
    const cached = await getCachedMarketData();
    if (cached?.fdRates && cached.fdRates.length > 0 && isCacheFresh(cached)) {
      return cached.fdRates;
    }
  }

  // Try fetching from APIs
  let rates: FDRate[] | null = null;

  // Try custom API first (if configured)
  rates = await fetchFromCustomAPI();

  // Try RBI
  if (!rates || rates.length === 0) {
    rates = await fetchFromRBI();
  }

  // Use average rates as fallback
  if (!rates || rates.length === 0) {
    rates = getAverageFDRates();
  }

  // Cache the rates
  await cacheFDRates(rates);

  return rates;
};

/**
 * Get FD rate for specific tenure
 */
export const getFDRateForTenure = async (
  tenureMonths: number,
  forceRefresh: boolean = false
): Promise<number> => {
  const rates = await fetchFDRates(forceRefresh);
  
  // Find exact match
  const exact = rates.find(r => r.tenureMonths === tenureMonths);
  if (exact) {
    return exact.interestRate;
  }

  // Find closest match
  const sorted = rates.sort((a, b) => Math.abs(a.tenureMonths - tenureMonths) - Math.abs(b.tenureMonths - tenureMonths));
  if (sorted.length > 0) {
    return sorted[0].interestRate;
  }

  // Default rate
  return 7.0;
};
