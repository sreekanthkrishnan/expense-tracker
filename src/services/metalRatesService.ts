/**
 * Metal Rates Service
 * 
 * Frontend service for fetching metal rates from Supabase backend.
 * 
 * ARCHITECTURE:
 * - Frontend is READ-ONLY - never calls third-party APIs
 * - Backend (Supabase) is the single source of truth
 * - Rates come from:
 *   1. Admin manual entry (source = 'admin')
 *   2. Scheduled backend sync (source = 'api') - optional, handled by backend
 * 
 * WHY NO FRONTEND API CALLS:
 * - Prevents multiple repeated API calls
 * - Eliminates infinite loaders
 * - Ensures consistent data across all users
 * - Improves reliability and performance
 * - Backend can handle rate limiting and caching
 */

import { supabase } from '../lib/supabaseClient';
import { calculate22KFrom24K, calculate8GramPrice } from '../utils/market/calculateCaratRates';
import type { GoldSilverRates } from '../utils/market/types';

export interface MetalRate {
  id: string;
  metal: 'gold' | 'silver';
  purity: '24k' | '22k' | '999';
  price_per_gram: number;
  date: string; // YYYY-MM-DD
  source: 'admin' | 'api';
  created_at: string;
}

/**
 * Fetch metal rates for a specific date from backend
 * 
 * PRIORITY LOGIC (handled by backend data):
 * 1. Admin rates (source = 'admin') - Admin can override
 * 2. API rates (source = 'api') - Stored API data
 * 3. null - No rates available
 * 
 * Frontend does NOT decide priority - backend data already reflects it.
 */
export const fetchMetalRates = async (
  date: string // YYYY-MM-DD format
): Promise<GoldSilverRates | null> => {
  try {
    // Single query to fetch all rates for the date
    // Backend priority: admin rates override API rates (handled by getResolvedRatesForDate)
    const { data: rates, error } = await supabase
      .from('metal_rates')
      .select('*')
      .eq('date', date)
      .in('metal', ['gold', 'silver'])
      .in('purity', ['24k', '22k', '999']);

    if (error) {
      console.error('Error fetching metal rates from backend:', error);
      return null;
    }

    if (!rates || rates.length === 0) {
      return null; // No rates found in backend
    }

    // Find rates for each metal/purity combination
    // Priority: admin rates override API rates (if both exist, admin wins)
    const gold24K = rates.find(r => r.metal === 'gold' && r.purity === '24k' && r.source === 'admin') ||
                    rates.find(r => r.metal === 'gold' && r.purity === '24k' && r.source === 'api');
    
    const gold22K = rates.find(r => r.metal === 'gold' && r.purity === '22k' && r.source === 'admin') ||
                    rates.find(r => r.metal === 'gold' && r.purity === '22k' && r.source === 'api');
    
    const silver = rates.find(r => r.metal === 'silver' && r.purity === '999' && r.source === 'admin') ||
                   rates.find(r => r.metal === 'silver' && r.purity === '999' && r.source === 'api');

    // Need at least gold24K and silver to return valid rates
    if (!gold24K || !silver) {
      return null;
    }

    // Build response
    const result: GoldSilverRates = {
      gold24K: {
        perGram: gold24K.price_per_gram,
        per8Gram: calculate8GramPrice(gold24K.price_per_gram),
      },
      gold22K: gold22K
        ? {
            perGram: gold22K.price_per_gram,
            per8Gram: calculate8GramPrice(gold22K.price_per_gram),
          }
        : {
            // Calculate 22K from 24K if not explicitly provided
            perGram: calculate22KFrom24K(gold24K.price_per_gram),
            per8Gram: calculate8GramPrice(calculate22KFrom24K(gold24K.price_per_gram)),
          },
      silver: {
        perGram: silver.price_per_gram,
        per8Gram: calculate8GramPrice(silver.price_per_gram),
      },
      fetchedAt: new Date().toISOString(),
      currency: 'INR', // Default, can be extended
      source: gold24K.source === 'admin' || silver.source === 'admin' ? 'admin' : 'api',
      sourceDetails: {
        gold24K: gold24K.source,
        gold22K: gold22K?.source || 'calculated',
        silver: silver.source,
      },
    };

    return result;
  } catch (error) {
    console.error('Error in fetchMetalRates:', error);
    return null;
  }
};

/**
 * Get historical rates for growth chart
 * Fetches ONLY from backend - no third-party API calls
 */
export const getHistoricalRates = async (
  metal: 'gold' | 'silver',
  purity: '24k' | '22k' | '999',
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; price: number }>> => {
  try {
    const { data, error } = await supabase
      .from('metal_rates')
      .select('date, price_per_gram, source')
      .eq('metal', metal)
      .eq('purity', purity)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching historical rates:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Group by date and prioritize admin over API
    const ratesByDate = new Map<string, number>();
    
    for (const rate of data) {
      const existing = ratesByDate.get(rate.date);
      // Admin rates override API rates
      if (!existing || rate.source === 'admin') {
        ratesByDate.set(rate.date, rate.price_per_gram);
      }
    }

    // Convert to array format
    return Array.from(ratesByDate.entries())
      .map(([date, price]) => ({ date, price }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error in getHistoricalRates:', error);
    return [];
  }
};
