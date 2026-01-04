/**
 * Calculate Carat Rates
 * 
 * Converts between different gold carat values.
 * Industry standard: 22K = 24K × 0.916 (91.6% pure gold)
 * 
 * SECURITY: All calculations are client-side, no data sent to servers.
 */

/**
 * Calculate 22K gold price from 24K price
 * 
 * Formula: 22K = 24K × (22/24) = 24K × 0.9167
 * Industry standard uses 0.916 (91.6% pure gold)
 * 
 * @param price24K - Price per gram for 24K gold
 * @returns Price per gram for 22K gold
 */
export const calculate22KFrom24K = (price24K: number): number => {
  if (price24K <= 0) {
    return 0;
  }
  
  // Industry standard: 22K is 91.6% of 24K
  // 22/24 = 0.9167, but commonly rounded to 0.916
  return price24K * 0.916;
};

/**
 * Calculate 8 gram price from per gram price
 * 
 * @param pricePerGram - Price per gram
 * @returns Price for 8 grams
 */
export const calculate8GramPrice = (pricePerGram: number): number => {
  return pricePerGram * 8;
};

/**
 * Format metal price for display
 * 
 * @param price - Price value
 * @param currencySymbol - Currency symbol (₹, $, etc.)
 * @returns Formatted price string
 */
export const formatMetalPrice = (price: number, currencySymbol: string = '₹'): string => {
  if (price === 0 || isNaN(price)) {
    return 'N/A';
  }
  
  return `${currencySymbol}${price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
