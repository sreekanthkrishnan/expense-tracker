/**
 * Fetch Mutual Fund Data
 * 
 * Fetches mutual fund NAV and historical CAGR data.
 * Supports AMFI API for Indian mutual funds.
 * 
 * SECURITY: Uses public APIs, no authentication required for basic NAV data.
 */

import type { MutualFundData } from './types';
import { getCachedMarketData, cacheMutualFundData, isCacheFresh } from './cacheMarketData';

/**
 * Fetch NAV from AMFI API (India)
 * AMFI provides free public API for NAV data
 */
const fetchFromAMFI = async (fundName: string): Promise<MutualFundData | null> => {
  try {
    // AMFI NAV API endpoint
    const response = await fetch('https://www.amfiindia.com/spages/NAVAll.txt');
    
    if (!response.ok) {
      throw new Error(`AMFI API returned ${response.status}`);
    }

    const text = await response.text();
    
    // Parse AMFI text format
    // Format: Scheme Code;ISIN Div Payout/ ISIN Growth / ISIN Div Reinvestment;Scheme Name;Net Asset Value;Date
    const lines = text.split('\n');
    let nav = 0;
    let found = false;

    for (const line of lines) {
      if (line.includes(fundName) || line.toLowerCase().includes(fundName.toLowerCase())) {
        const parts = line.split(';');
        if (parts.length >= 5) {
          nav = parseFloat(parts[4]) || 0;
          found = true;
          break;
        }
      }
    }

    if (!found || nav === 0) {
      return null;
    }

    // For CAGR, we would need historical data
    // This is a simplified version - in production, you'd fetch historical NAVs
    return {
      fundName,
      nav,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Failed to fetch from AMFI:', error);
    return null;
  }
};

/**
 * Fetch from alternative API (MFAPI.in or similar)
 */
const fetchFromMFAPI = async (fundName: string): Promise<MutualFundData | null> => {
  try {
    // Using MFAPI.in (free tier available)
    const response = await fetch(`https://api.mfapi.in/fund/${encodeURIComponent(fundName)}`);
    
    if (!response.ok) {
      throw new Error(`MFAPI returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.data || data.data.length === 0) {
      return null;
    }

    const latest = data.data[0];
    const nav = parseFloat(latest.nav) || 0;

    // Calculate CAGR from historical data if available
    let cagr1Y: number | undefined;
    let cagr3Y: number | undefined;
    let cagr5Y: number | undefined;

    if (data.data.length > 12) {
      // Calculate 1-year CAGR
      const oneYearAgo = data.data.find((d: any) => {
        const date = new Date(d.date);
        const now = new Date();
        const diffMonths = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return diffMonths >= 11 && diffMonths <= 13;
      });
      
      if (oneYearAgo) {
        const oldNav = parseFloat(oneYearAgo.nav) || nav;
        if (oldNav > 0) {
          cagr1Y = ((nav / oldNav) - 1) * 100;
        }
      }
    }

    return {
      fundName,
      nav,
      cagr1Y,
      cagr3Y,
      cagr5Y,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Failed to fetch from MFAPI:', error);
    return null;
  }
};

/**
 * Main function to fetch mutual fund data
 */
export const fetchMutualFundData = async (
  fundName: string,
  forceRefresh: boolean = false
): Promise<MutualFundData | null> => {
  // Check cache first
  if (!forceRefresh) {
    const cached = await getCachedMarketData();
    if (cached?.mutualFunds?.[fundName] && isCacheFresh(cached)) {
      return cached.mutualFunds[fundName];
    }
  }

  // Try fetching from APIs
  let data: MutualFundData | null = null;

  // Try MFAPI first (more reliable for Indian funds)
  data = await fetchFromMFAPI(fundName);

  // Try AMFI if MFAPI failed
  if (!data) {
    data = await fetchFromAMFI(fundName);
  }

  // If all APIs failed, use cached data
  if (!data) {
    const cached = await getCachedMarketData();
    if (cached?.mutualFunds?.[fundName]) {
      return cached.mutualFunds[fundName];
    }
    return null;
  }

  // Cache the fetched data
  await cacheMutualFundData(fundName, data);

  return data;
};
