/**
 * Get Exchange Rate
 * 
 * Fetches current exchange rate from USD to target currency.
 * Uses a free public API for exchange rates.
 * 
 * SECURITY: Uses public APIs only, no authentication required.
 */

/**
 * Fetch exchange rate from USD to target currency
 * Uses exchangerate-api.com (free tier, no API key required)
 * Falls back to alternative APIs if primary fails
 */
export const getUSDToCurrencyRate = async (targetCurrency: string): Promise<number | null> => {
  try {
    const currencyUpper = targetCurrency.toUpperCase();
    
    // If target is USD, return 1
    if (currencyUpper === 'USD') {
      return 1;
    }

    // Try primary API: exchangerate-api.com
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
      
      if (!response.ok) {
        throw new Error(`Exchange rate API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.rates || !data.rates[currencyUpper]) {
        throw new Error(`Exchange rate not found for ${currencyUpper}`);
      }

      return data.rates[currencyUpper];
    } catch (primaryError) {
      console.warn('Primary exchange rate API failed, trying fallback:', primaryError);
      
      // Fallback: Try alternative API (fixer.io free tier or exchangerate.host)
      try {
        const fallbackResponse = await fetch(`https://api.exchangerate.host/latest?base=USD&symbols=${currencyUpper}`);
        
        if (!fallbackResponse.ok) {
          throw new Error(`Fallback exchange rate API returned ${fallbackResponse.status}`);
        }

        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.success && fallbackData.rates && fallbackData.rates[currencyUpper]) {
          return fallbackData.rates[currencyUpper];
        }
        
        throw new Error(`Exchange rate not found in fallback API for ${currencyUpper}`);
      } catch (fallbackError) {
        console.warn('Fallback exchange rate API also failed:', fallbackError);
        
        // Last resort: Use approximate rate for INR (can be updated manually)
        if (currencyUpper === 'INR') {
          console.warn('Using approximate INR rate: 83.0 (fallback)');
          return 83.0; // Approximate fallback rate
        }
        
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error('All exchange rate APIs failed:', error);
    return null;
  }
};

/**
 * Sanity check for gold price
 * Returns true if price is valid, false if it seems incorrect
 * Also logs error if price seems incorrect
 */
export const sanityCheckGoldPrice = (pricePerGram: number, currency: string): boolean => {
  // Sanity check: Gold price should not exceed ₹10,000/g (or equivalent)
  const maxPrice = currency === 'INR' ? 10000 : currency === 'USD' ? 200 : 10000;
  
  if (pricePerGram > maxPrice) {
    console.error(
      `⚠️ SANITY CHECK FAILED: Gold price seems incorrect!`,
      `Price: ${pricePerGram} ${currency}/gram`,
      `Expected: < ${maxPrice} ${currency}/gram`
    );
    return false;
  }
  
  return true;
};
