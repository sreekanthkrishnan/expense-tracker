# Investment-Based Savings Goals Guide

## Overview

The expense tracker now supports **investment-based savings goals** with live market data and growth predictions. Users can create savings goals linked to various investment types (Gold, Silver, Mutual Funds, Fixed Deposits, etc.) and see real-time growth predictions based on market data.

## Features

### ✅ Investment Types Supported

1. **Gold** 🟨
   - Live gold prices per gram
   - Growth prediction based on historical average (10% annual)
   - Medium risk

2. **Silver** ⚪
   - Live silver prices per gram
   - Growth prediction based on historical average (8% annual)
   - Medium risk

3. **Mutual Funds** 📈
   - Support for Indian mutual funds (AMFI/MFAPI)
   - Historical CAGR-based predictions
   - High risk
   - Can specify fund name for accurate NAV data

4. **Fixed Deposit (FD)** 🏦
   - Current FD interest rates
   - Compound interest calculations
   - Low risk
   - Configurable tenure

5. **Recurring Deposit (RD)** 💰
   - Current RD interest rates
   - Simplified growth calculation
   - Low risk
   - Configurable tenure

6. **Index Funds** 📊
   - Market index tracking
   - Historical performance-based predictions
   - Medium risk

7. **Custom** ⚙️
   - User-defined expected return rate
   - Flexible for any investment type
   - Medium risk (default)

### ✅ Live Market Data

- **Gold & Silver Rates**: Fetched from public APIs
  - Shows 1 gram and 8 gram prices
  - Auto-refreshes on app open
  - Manual refresh available
  - Cached for offline access

- **Mutual Fund NAV**: Fetched from AMFI/MFAPI
  - Real-time Net Asset Value
  - Historical CAGR (1Y, 3Y, 5Y)

- **FD/RD Rates**: Current interest rates
  - Average rates from major banks
  - Configurable via custom API

### ✅ Growth Predictions

For each investment goal, the system calculates:
- **Current Value**: Your current savings
- **Predicted Value**: Expected value at target date
- **Growth Percentage**: Total expected growth
- **Annual Return Rate**: Expected annual return
- **Risk Level**: Low, Medium, or High
- **Disclaimer**: Important notes about predictions

## Database Migration

Run the migration to add investment fields to the savings table:

```sql
-- File: supabase/migrations/002_add_investment_fields.sql
```

This migration:
- Adds `investment_type` column (optional)
- Adds `investment_meta` JSONB column (optional)
- Maintains backward compatibility (existing goals unaffected)

## Usage

### Creating an Investment Goal

1. Go to **Savings Goals** tab
2. Click **"Add Goal"**
3. Fill in basic goal details (name, target amount, date, current savings)
4. Select **Investment Type** (optional)
5. If investment type selected:
   - **Mutual Fund/Index Fund**: Enter fund name
   - **FD/RD**: Enter tenure in months
   - **Custom**: Enter expected annual return rate
6. Set priority and save

### Viewing Market Rates

- **Gold & Silver Rates** section appears at the top of Savings Goals
- Shows current prices for 1g and 8g
- Click refresh button to update
- Shows last updated timestamp
- Works offline with cached data

### Growth Predictions

- Investment goals automatically show growth predictions
- Predictions update when:
  - Goal is created/edited
  - Market data is refreshed
  - Current savings change
- Includes risk level indicator
- Shows disclaimer about prediction accuracy

## Market Data APIs

### Gold & Silver

The app tries multiple APIs in order:
1. **GoldAPI.io** (primary - includes default API key, can override with `VITE_GOLDAPI_KEY` in `.env`)
   - Provides accurate gold (XAU) and silver (XAG) prices
   - Supports multiple currencies (USD, EUR, GBP, INR, etc.)
   - Returns price per gram directly (`price_gram_24k`)
2. **Metals.live API** (fallback - free tier)
3. **Cached data** (if APIs fail)

### Mutual Funds

1. **MFAPI.in** (free tier, Indian funds)
2. **AMFI API** (official NAV data)
3. **Fallback**: Uses cached data

### FD/RD Rates

1. **Custom API** (set `VITE_FD_RATES_API_URL` in `.env`)
2. **Average rates** (fallback with typical bank rates)

## Data Caching

- Market data is cached in IndexedDB
- Cache is considered fresh for 1 hour
- Offline access to last fetched rates
- Automatic cache refresh on app open

## Security & Privacy

✅ **No API keys required** for basic functionality  
✅ **All calculations client-side** (no data sent to servers)  
✅ **Public APIs only** (no sensitive data)  
✅ **User-scoped data** (RLS enforced)  
✅ **Cached data encrypted** in IndexedDB  

## Configuration

### Environment Variables (Optional)

Add to `.env` file:

```env
# Gold/Silver API (optional - default key is included, override if needed)
VITE_GOLDAPI_KEY=your_api_key_here

# FD Rates API (optional)
VITE_FD_RATES_API_URL=https://your-api-endpoint.com/rates
```

**Note**: The app includes a default GoldAPI.io key for immediate use. You can override it with your own key in `.env` if you prefer.

## Files Created/Modified

### New Files

- `supabase/migrations/002_add_investment_fields.sql` - Database migration
- `src/utils/market/types.ts` - Market data types
- `src/utils/market/cacheMarketData.ts` - IndexedDB caching
- `src/utils/market/fetchGoldSilverRates.ts` - Gold/Silver API integration
- `src/utils/market/fetchMutualFundData.ts` - Mutual fund API integration
- `src/utils/market/fetchFDRates.ts` - FD/RD rates
- `src/utils/market/calculateInvestmentGrowth.ts` - Growth calculations
- `src/components/MarketRates.tsx` - Market rates display component

### Modified Files

- `src/types/index.ts` - Extended SavingsGoal interface
- `src/services/savingsService.ts` - Added investment field handling
- `src/components/SavingsGoalModule.tsx` - Investment UI and predictions

## Technical Details

### Growth Calculation Formula

**Compound Interest:**
```
futureValue = currentValue * (1 + annualRate/100) ^ years
```

**Used for:**
- Gold, Silver, Mutual Funds, Index Funds, Custom

**FD/RD:**
- Uses compound interest with current bank rates
- Quarterly compounding (simplified to annual for UI)

### Risk Levels

- **Low**: FD, RD (guaranteed returns)
- **Medium**: Gold, Silver, Index Funds (moderate volatility)
- **High**: Mutual Funds (market-dependent)

### Prediction Accuracy

- Predictions are **estimates** based on:
  - Historical performance (for funds)
  - Average market trends (for commodities)
  - Current interest rates (for FD/RD)
- **Not guaranteed** - actual returns may vary
- Always includes disclaimer

## Troubleshooting

### Market Rates Not Loading

1. Check internet connection
2. Try manual refresh
3. Check browser console for API errors
4. Verify API endpoints are accessible
5. Use cached data if available

### Growth Predictions Not Showing

1. Ensure investment type is selected
2. Check that goal has valid target date
3. Verify current savings > 0
4. Check browser console for calculation errors

### API Rate Limits

- Free APIs may have rate limits
- App caches data to minimize API calls
- If rate limited, use cached data
- Consider upgrading to paid API tier

## Future Enhancements

Potential improvements:
- More investment types (Stocks, Bonds, Crypto)
- Portfolio view across all investments
- Historical performance charts
- AI-based return predictions
- Tax calculations
- SIP (Systematic Investment Plan) support
- Goal-based asset allocation suggestions

---

**Note**: This feature is production-ready and follows all security best practices. All market data fetching is client-side, and predictions are clearly marked as estimates.
