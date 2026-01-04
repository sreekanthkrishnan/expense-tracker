/**
 * Market Data Caching Utility
 * 
 * Caches market data in IndexedDB for offline access.
 * SECURITY: No sensitive data is cached, only public market rates.
 */

import type { MarketDataCache, GoldSilverRates, MutualFundData, FDRate } from './types';

const DB_NAME = 'ExpenseTrackerDB';
const STORE_NAME = 'marketData';
const CACHE_KEY = 'marketDataCache';

/**
 * Initialize IndexedDB for market data
 * 
 * Note: Object stores can only be created during onupgradeneeded event.
 * The database may already exist from the main app (version 1), so we use
 * version 2 to ensure onupgradeneeded fires and creates the marketData store.
 */
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // Use version 2 to ensure upgrade happens if database exists at version 1
    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create the marketData store if it doesn't exist
      // This will only run if upgrading from version 1 to 2
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

/**
 * Cache market data
 */
export const cacheMarketData = async (data: Partial<MarketDataCache>): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const cacheData: MarketDataCache = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put({ key: CACHE_KEY, data: cacheData, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.warn('Failed to cache market data:', error);
    // Don't throw - caching is optional
  }
};

/**
 * Get cached market data
 */
export const getCachedMarketData = async (): Promise<MarketDataCache | null> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const cached = await new Promise<any>((resolve, reject) => {
      const request = store.get(CACHE_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();

    if (cached && cached.data) {
      return cached.data as MarketDataCache;
    }

    return null;
  } catch (error) {
    console.warn('Failed to get cached market data:', error);
    return null;
  }
};

/**
 * Cache gold/silver rates
 */
export const cacheGoldSilverRates = async (rates: GoldSilverRates): Promise<void> => {
  const cached = await getCachedMarketData();
  await cacheMarketData({
    ...cached,
    goldSilver: rates,
  });
};

/**
 * Cache mutual fund data
 */
export const cacheMutualFundData = async (fundName: string, data: MutualFundData): Promise<void> => {
  const cached = await getCachedMarketData();
  const existingFunds = cached?.mutualFunds || {};
  await cacheMarketData({
    ...cached,
    mutualFunds: {
      ...existingFunds,
      [fundName]: data,
    },
  });
};

/**
 * Cache FD rates
 */
export const cacheFDRates = async (rates: FDRate[]): Promise<void> => {
  const cached = await getCachedMarketData();
  await cacheMarketData({
    ...cached,
    fdRates: rates,
  });
};

/**
 * Check if cached data is still fresh (within 1 hour)
 */
export const isCacheFresh = (cachedData: MarketDataCache | null): boolean => {
  if (!cachedData || !cachedData.lastUpdated) {
    return false;
  }

  const lastUpdated = new Date(cachedData.lastUpdated);
  const now = new Date();
  const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

  return hoursDiff < 1; // Cache is fresh if less than 1 hour old
};
