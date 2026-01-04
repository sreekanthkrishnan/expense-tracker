/**
 * Fetch Gold & Silver Rates
 * 
 * Fetches live gold and silver prices from public APIs.
 * Falls back to cached data if API fails.
 * 
 * SECURITY: Uses public APIs only, no API keys required for basic rates.
 */

import type { GoldSilverRates } from './types';
import { getCachedMarketData, cacheGoldSilverRates, isCacheFresh } from './cacheMarketData';
import { calculate22KFrom24K, calculate8GramPrice } from './calculateCaratRates';
import { getUSDToCurrencyRate, sanityCheckGoldPrice } from './getExchangeRate';

const GRAMS_PER_TROY_OUNCE = 31.1035;

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
 * Fetch rates from Metals.live API (free tier, no API key required)
 * Alternative: Can use other free APIs like GoldAPI, RapidAPI
 */
const fetchFromMetalsAPI = async (currency: string = 'INR'): Promise<GoldSilverRates | null> => {
  try {
    // Using a free public API endpoint
    // Note: In production, you may want to use a more reliable API with an API key
    const response = await fetch(`https://api.metals.live/v1/spot/${currency.toLowerCase()}`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Parse response (adjust based on actual API response structure)
    // This is a placeholder - actual API structure may vary
    const gold24KPerGram = data.gold?.price || 0;
    const silverPerGram = data.silver?.price || 0;

    if (gold24KPerGram === 0 || silverPerGram === 0) {
      throw new Error('Invalid data from API');
    }

    // Calculate 22K from 24K
    const gold22KPerGram = calculate22KFrom24K(gold24KPerGram);

    return {
      gold24K: {
        perGram: gold24KPerGram,
        per8Gram: calculate8GramPrice(gold24KPerGram),
      },
      gold22K: {
        perGram: gold22KPerGram,
        per8Gram: calculate8GramPrice(gold22KPerGram),
      },
      silver: {
        perGram: silverPerGram,
        per8Gram: calculate8GramPrice(silverPerGram),
      },
      fetchedAt: new Date().toISOString(),
      currency,
    };
  } catch (error) {
    console.warn('Failed to fetch from Metals API:', error);
    return null;
  }
};

/**
 * Fetch rates from GoldAPI.io
 * API Documentation: https://www.goldapi.io/
 * 
 * RULES:
 * 1. API base unit = USD per troy ounce
 * 2. Convert currency ONLY once (USD → target currency)
 * 3. Convert ounce → gram using 31.1035
 * 4. 24K only for calculations
 * 5. 22K = 24K × 0.916 (display only)
 * 6. No GST, making charges, or premiums
 * 7. Sanity check: if price > ₹10,000 → log error
 */
const fetchFromGoldAPI = async (currency: string = 'INR'): Promise<GoldSilverRates | null> => {
  try {
    // Using GoldAPI.io (requires API key - set in .env or use provided key)
    const apiKey = import.meta.env.VITE_GOLDAPI_KEY || 'goldapi-f2bsmjzh8l2r-io';
    
    if (!apiKey) {
      return null; // No API key available
    }

    const currencyUpper = currency.toUpperCase();

    // STEP 1: Fetch gold price in USD per troy ounce (base unit)
    const goldUSDResponse = await fetch(`https://www.goldapi.io/api/XAU/USD`, {
      headers: {
        'x-access-token': apiKey,
      },
    });

    if (!goldUSDResponse.ok) {
      throw new Error(`GoldAPI USD returned ${goldUSDResponse.status}`);
    }

    const goldUSDData = await goldUSDResponse.json();
    
    // Get price in USD per troy ounce
    const goldUSDPerOunce = goldUSDData.price || 0;
    
    if (goldUSDPerOunce === 0) {
      throw new Error('Invalid gold price from API');
    }

    // STEP 2: Convert currency ONLY once (USD → target currency)
    let exchangeRate = 1; // Default for USD
    if (currencyUpper !== 'USD') {
      const rate = await getUSDToCurrencyRate(currencyUpper);
      if (!rate || rate <= 0) {
        console.error(`Failed to get exchange rate for ${currencyUpper}. Rate: ${rate}`);
        throw new Error(`Failed to get exchange rate for ${currencyUpper}`);
      }
      exchangeRate = rate;
      console.log(`Exchange rate USD to ${currencyUpper}: ${exchangeRate}`);
    }

    // Convert USD per ounce to target currency per ounce
    const goldPerOunceInTargetCurrency = goldUSDPerOunce * exchangeRate;

    // STEP 3: Convert ounce → gram using 31.1035
    // This is the ONLY place we convert ounce to gram
    const gold24KPerGram = goldPerOunceInTargetCurrency / GRAMS_PER_TROY_OUNCE;

    console.log(`Gold calculation: USD ${goldUSDPerOunce}/oz × ${exchangeRate} = ${goldPerOunceInTargetCurrency} ${currencyUpper}/oz ÷ ${GRAMS_PER_TROY_OUNCE} = ${gold24KPerGram} ${currencyUpper}/gram`);

    // Sanity check: Returns false if price seems incorrect
    const sanityCheckPassed = sanityCheckGoldPrice(gold24KPerGram, currencyUpper);
    
    // If sanity check failed, don't return data (return null to trigger fallback)
    if (!sanityCheckPassed) {
      console.error(`Sanity check failed for gold price: ${gold24KPerGram} ${currencyUpper}/gram. Skipping this data source.`);
      return null;
    }

    // Fetch silver (same process)
    const silverUSDResponse = await fetch(`https://www.goldapi.io/api/XAG/USD`, {
      headers: {
        'x-access-token': apiKey,
      },
    });

    if (!silverUSDResponse.ok) {
      throw new Error(`GoldAPI silver USD returned ${silverUSDResponse.status}`);
    }

    const silverUSDData = await silverUSDResponse.json();
    const silverUSDPerOunce = silverUSDData.price || 0;

    if (silverUSDPerOunce === 0) {
      throw new Error('Invalid silver price from API');
    }

    // Convert silver: USD → target currency → gram
    const silverPerOunceInTargetCurrency = silverUSDPerOunce * exchangeRate;
    const silverPerGram = silverPerOunceInTargetCurrency / GRAMS_PER_TROY_OUNCE;

    // STEP 4: Calculate 22K from 24K (display only, not used in calculations)
    const gold22KPerGram = calculate22KFrom24K(gold24KPerGram);

    return {
      gold24K: {
        perGram: gold24KPerGram,
        per8Gram: calculate8GramPrice(gold24KPerGram),
      },
      gold22K: {
        perGram: gold22KPerGram,
        per8Gram: calculate8GramPrice(gold22KPerGram),
      },
      silver: {
        perGram: silverPerGram,
        per8Gram: calculate8GramPrice(silverPerGram),
      },
      fetchedAt: new Date().toISOString(),
      currency: currencyUpper,
    };
  } catch (error) {
    console.error('Failed to fetch from GoldAPI:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return null;
  }
};

/**
 * Fetch rates using fallback method (scraping or alternative API)
 * For India, we can use a simple calculation based on MCX rates
 */
const fetchFromFallback = async (_currency: string = 'INR'): Promise<GoldSilverRates | null> => {
  try {
    // Fallback: Use a simple public endpoint or calculation
    // This is a placeholder - implement based on available free APIs
    // For now, return null to use cached data
    return null;
  } catch (error) {
    console.warn('Fallback fetch failed:', error);
    return null;
  }
};

/**
 * Main function to fetch gold and silver rates
 * Tries multiple APIs and falls back to cache
 */
export const fetchGoldSilverRates = async (
  currency: string = 'INR',
  forceRefresh: boolean = false
): Promise<GoldSilverRates> => {
  // Check cache first if not forcing refresh
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

  // Try fetching from APIs in order
  let rates: GoldSilverRates | null = null;

  // Try GoldAPI first (most reliable if API key is available)
  rates = await fetchFromGoldAPI(currency);
  
  // Try Metals API if GoldAPI failed
  if (!rates) {
    rates = await fetchFromMetalsAPI(currency);
  }

  // Try fallback
  if (!rates) {
    rates = await fetchFromFallback(currency);
  }

  // If all APIs failed, use cached data (even if stale)
  if (!rates) {
    const cached = await getCachedMarketData();
    if (cached?.goldSilver) {
      // Try to migrate legacy format if needed
      const migrated = migrateLegacyRates(cached.goldSilver);
      if (migrated) {
        // Update cache with new format
        await cacheGoldSilverRates(migrated);
        return migrated;
      } else if (cached.goldSilver.gold24K && cached.goldSilver.gold22K) {
        // Already in new format
        return cached.goldSilver as GoldSilverRates;
      }
    }

    // Last resort: Return default values with a warning
    console.warn('Unable to fetch gold/silver rates. Using default values.');
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
      currency,
    };
  }

  // Perform sanity check on final rates and set flag
  const goldPrice = rates.gold24K?.perGram || 0;
  if (goldPrice > 0) {
    const sanityCheckPassed = sanityCheckGoldPrice(goldPrice, rates.currency);
    rates.sanityCheckFailed = !sanityCheckPassed;
  }

  // Cache the fetched rates
  await cacheGoldSilverRates(rates);

  return rates;
};
