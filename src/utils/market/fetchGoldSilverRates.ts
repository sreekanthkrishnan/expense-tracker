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
    const goldPerGram = data.gold?.price || 0;
    const silverPerGram = data.silver?.price || 0;

    if (goldPerGram === 0 || silverPerGram === 0) {
      throw new Error('Invalid data from API');
    }

    return {
      gold: {
        perGram: goldPerGram,
        per8Gram: goldPerGram * 8,
      },
      silver: {
        perGram: silverPerGram,
        per8Gram: silverPerGram * 8,
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
 * Supports: XAU (Gold), XAG (Silver)
 * Currency codes: USD, EUR, GBP, INR, etc. (uppercase)
 */
const fetchFromGoldAPI = async (currency: string = 'INR'): Promise<GoldSilverRates | null> => {
  try {
    // Using GoldAPI.io (requires API key - set in .env or use provided key)
    const apiKey = import.meta.env.VITE_GOLDAPI_KEY || 'goldapi-f2bsmjzh8l2r-io';
    
    if (!apiKey) {
      return null; // No API key available
    }

    // Convert currency to uppercase (API requires uppercase)
    const currencyUpper = currency.toUpperCase();

    // Fetch gold (XAU)
    const goldResponse = await fetch(`https://www.goldapi.io/api/XAU/${currencyUpper}`, {
      headers: {
        'x-access-token': apiKey,
      },
    });

    if (!goldResponse.ok) {
      throw new Error(`GoldAPI gold returned ${goldResponse.status}`);
    }

    const goldData = await goldResponse.json();
    
    // GoldAPI provides price_gram_24k directly, or we can calculate from price (per ounce)
    let goldPerGram = 0;
    if (goldData.price_gram_24k) {
      goldPerGram = goldData.price_gram_24k;
    } else if (goldData.price) {
      // Convert from per ounce to per gram (1 ounce = 31.1035 grams)
      goldPerGram = goldData.price / 31.1035;
    }

    if (goldPerGram === 0) {
      throw new Error('Invalid gold price from API');
    }

    // Fetch silver (XAG)
    const silverResponse = await fetch(`https://www.goldapi.io/api/XAG/${currencyUpper}`, {
      headers: {
        'x-access-token': apiKey,
      },
    });

    if (!silverResponse.ok) {
      throw new Error(`GoldAPI silver returned ${silverResponse.status}`);
    }

    const silverData = await silverResponse.json();
    
    // Silver price calculation
    let silverPerGram = 0;
    if (silverData.price_gram_24k) {
      silverPerGram = silverData.price_gram_24k;
    } else if (silverData.price) {
      // Convert from per ounce to per gram
      silverPerGram = silverData.price / 31.1035;
    }

    if (silverPerGram === 0) {
      throw new Error('Invalid silver price from API');
    }

    return {
      gold: {
        perGram: goldPerGram,
        per8Gram: goldPerGram * 8,
      },
      silver: {
        perGram: silverPerGram,
        per8Gram: silverPerGram * 8,
      },
      fetchedAt: new Date().toISOString(),
      currency: currencyUpper,
    };
  } catch (error) {
    console.warn('Failed to fetch from GoldAPI:', error);
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
    if (cached?.goldSilver && isCacheFresh(cached)) {
      return cached.goldSilver;
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
      return cached.goldSilver;
    }

    // Last resort: Return default values with a warning
    console.warn('Unable to fetch gold/silver rates. Using default values.');
    return {
      gold: {
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

  // Cache the fetched rates
  await cacheGoldSilverRates(rates);

  return rates;
};
