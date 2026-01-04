/**
 * Fetch Gold & Silver Rates
 * 
 * Fetches gold and silver rates from database (admin or stored API rates).
 * Falls back to cached data if database rates are not available.
 * 
 * No third-party API calls - only uses database rates.
 */

import type { GoldSilverRates } from './types';
import { getCachedMarketData, cacheGoldSilverRates, isCacheFresh } from './cacheMarketData';
import { calculate22KFrom24K, calculate8GramPrice } from './calculateCaratRates';
import { getResolvedRatesForDate } from '../../services/metalRateService';

/**
 * Convert legacy cached data format to new format
 * Handles backward compatibility with old cache structure
 */
const migrateLegacyRates = (legacy: any): GoldSilverRates | null => {
  // Check if it's the old format (has 'gold' instead of 'gold24K')
  if (legacy && legacy.gold && !legacy.gold24K) {
    const gold24KPerGram = legacy.gold.perGram || 0;
    const gold22KPerGram = calculate22KFrom24K(gold24KPerGram);
    
    return {
      gold24K: {
        perGram: gold24KPerGram,
        per8Gram: legacy.gold.per8Gram || calculate8GramPrice(gold24KPerGram),
      },
      gold22K: {
        perGram: gold22KPerGram,
        per8Gram: calculate8GramPrice(gold22KPerGram),
      },
      silver: {
        perGram: legacy.silver?.perGram || 0,
        per8Gram: legacy.silver?.per8Gram || 0,
      },
      fetchedAt: legacy.fetchedAt || new Date().toISOString(),
      currency: legacy.currency || 'INR',
    };
  }
  
  // Check if it's already in the new format
  if (legacy && legacy.gold24K && legacy.gold22K) {
    return legacy as GoldSilverRates;
  }
  
  return null;
};


/**
 * Main function to fetch gold and silver rates
 * 
 * PRIORITY LOGIC:
 * 1. Admin rates (if available) - Admin can override for today
 * 2. API rates (stored in database) - Use stored API data if no admin override
 * 3. Cache (if fresh)
 * 
 * No third-party API calls - only uses database rates (admin or stored API rates)
 */
export const fetchGoldSilverRates = async (
  currency: string = 'INR',
  forceRefresh: boolean = false,
  date?: string // Optional date to fetch rates for (defaults to today)
): Promise<GoldSilverRates> => {
  // Use provided date or today's date
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  // STEP 1: Check database for rates (admin first, then API) - optimized single call
  try {
    const resolvedRates = await getResolvedRatesForDate(targetDate);

    // If we have resolved rates for all required metals from database, use them
    if (resolvedRates.gold24K && resolvedRates.silver) {
      const rates: GoldSilverRates = {
        gold24K: {
          perGram: resolvedRates.gold24K.rate.price_per_gram,
          per8Gram: calculate8GramPrice(resolvedRates.gold24K.rate.price_per_gram),
        },
        gold22K: resolvedRates.gold22K
          ? {
              perGram: resolvedRates.gold22K.rate.price_per_gram,
              per8Gram: calculate8GramPrice(resolvedRates.gold22K.rate.price_per_gram),
            }
          : {
              // Calculate 22K from 24K if not explicitly provided
              perGram: calculate22KFrom24K(resolvedRates.gold24K.rate.price_per_gram),
              per8Gram: calculate8GramPrice(calculate22KFrom24K(resolvedRates.gold24K.rate.price_per_gram)),
            },
        silver: {
          perGram: resolvedRates.silver.rate.price_per_gram,
          per8Gram: calculate8GramPrice(resolvedRates.silver.rate.price_per_gram),
        },
        fetchedAt: new Date().toISOString(),
        currency: currency.toUpperCase(),
        source: resolvedRates.gold24K.source === 'admin' || resolvedRates.silver.source === 'admin' ? 'admin' : 'api',
        sourceDetails: {
          gold24K: resolvedRates.gold24K.source,
          gold22K: resolvedRates.gold22K?.source || 'calculated',
          silver: resolvedRates.silver.source,
        },
      };

      // Cache resolved rates with source information
      await cacheGoldSilverRates(rates);
      return rates;
    }
  } catch (error) {
    console.warn('Error checking database rates:', error);
    // Continue to cache check if database check fails
  }

  // STEP 2: Check cache if not forcing refresh
  if (!forceRefresh) {
    const cached = await getCachedMarketData();
    if (cached?.goldSilver) {
      // Try to migrate legacy format if needed
      const migrated = migrateLegacyRates(cached.goldSilver);
      if (migrated && isCacheFresh(cached)) {
        // Update cache with new format
        await cacheGoldSilverRates(migrated);
        return migrated;
      } else if (migrated) {
        // Return migrated data even if cache is stale
        return migrated;
      } else if (cached.goldSilver.gold24K && cached.goldSilver.gold22K && isCacheFresh(cached)) {
        // Already in new format and fresh
        return cached.goldSilver as GoldSilverRates;
      }
    }
  }

  // STEP 3: If no database rates and no cache, return default values
  console.warn('No metal rates found in database or cache. Please add rates via admin dashboard.');
  return {
    gold24K: {
      perGram: 0,
      per8Gram: 0,
    },
    gold22K: {
      perGram: 0,
      per8Gram: 0,
    },
    silver: {
      perGram: 0,
      per8Gram: 0,
    },
    fetchedAt: new Date().toISOString(),
    currency: currency.toUpperCase(),
    source: 'cache',
  };
};
