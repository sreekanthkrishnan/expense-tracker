/**
 * Market Rates Component
 * 
 * Displays live gold (24K/22K) and silver rates.
 * Fetches data on mount and allows manual refresh.
 * Shows cached data when offline.
 */

import { useState, useEffect, useRef } from 'react';
import { fetchMetalRates } from '../services/metalRatesService';
import { getCachedMarketData, cacheGoldSilverRates } from '../utils/market/cacheMarketData';
import type { GoldSilverRates } from '../utils/market/types';
import { formatMetalPrice } from '../utils/market/calculateCaratRates';
import { Icon } from './common/Icon';
import { useAppSelector } from '../store/hooks';

const MarketRates = () => {
  const { profile } = useAppSelector((state) => state.profile);
  const [rates, setRates] = useState<GoldSilverRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchRef = useRef(false); // Prevent multiple simultaneous fetches

  const currency = profile?.currency || 'INR';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency;

  /**
   * Load rates from backend (Supabase)
   * Single fetch per screen load - no polling, no retries
   */
  const loadRates = async (forceRefresh: boolean = false) => {
    // Prevent multiple simultaneous fetches
    if (fetchRef.current && !forceRefresh) {
      return;
    }

    // If already fetched and not forcing refresh, use cached data
    if (hasFetched && !forceRefresh) {
      const cached = await getCachedMarketData();
      if (cached?.goldSilver) {
        setRates(cached.goldSilver);
        setLoading(false);
        return;
      }
    }

    fetchRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch from backend (Supabase) - single call
      const data = await fetchMetalRates(today);
      
      if (data && data.gold24K && data.silver) {
        // Valid rates found
        setRates(data);
        setHasFetched(true);
        
        // Cache for offline access
        await cacheGoldSilverRates(data);
      } else {
        // No rates in backend - check cache
        const cached = await getCachedMarketData();
        if (cached?.goldSilver && cached.goldSilver.gold24K?.perGram > 0) {
          setRates(cached.goldSilver);
          setError('No rates found in database. Showing cached data.');
        } else {
          setError('No metal rates available. Please add rates via admin dashboard.');
          setRates(null);
        }
        setHasFetched(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market rates';
      setError(errorMessage);
      console.error('Error fetching market rates:', err);
      
      // Try to use cached data on error
      const cached = await getCachedMarketData();
      if (cached?.goldSilver) {
        setRates(cached.goldSilver);
      }
      setHasFetched(true);
    } finally {
      setLoading(false);
      fetchRef.current = false;
    }
  };

  // Fetch once on mount - no dependency on currency to prevent re-fetches
  useEffect(() => {
    if (!hasFetched) {
      loadRates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - fetch only once

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Today's Gold & Silver Rates</h3>
          <div className="text-xs text-gray-600 mt-1">
            {rates?.fetchedAt && (
              <>
                <p>Last updated: {formatDate(rates.fetchedAt)}</p>
                {rates.source && (
                  <p className="mt-1">
                    Source: {rates.source === 'api' ? (
                      <span className="text-green-600 font-medium">Market API</span>
                    ) : rates.source === 'admin' ? (
                      <span className="text-amber-600 font-medium">Admin fallback</span>
                    ) : (
                      <span className="text-gray-500">Cached</span>
                    )}
                  </p>
                )}
              </>
            )}
            {!rates?.fetchedAt && <p>Loading...</p>}
          </div>
        </div>
        <button
          onClick={() => loadRates(true)}
          disabled={loading}
          className="btn-icon text-gray-600 hover:text-gray-900 disabled:opacity-50"
          aria-label="Refresh rates"
        >
          <Icon 
            name="Loader" 
            size={20} 
            className={loading ? 'animate-spin' : ''} 
          />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-800 flex items-center">
            <Icon name="AlertTriangle" size={16} className="mr-2" />
            {error}
          </p>
          <p className="text-xs text-red-600 mt-1">
            Showing cached data if available. Please check your internet connection.
          </p>
        </div>
      )}

      {loading && !rates && (
        <div className="text-center py-8">
          <Icon name="Loader" size={32} className="animate-spin mx-auto mb-2" style={{ color: 'var(--color-primary)' }} />
          <p className="text-sm text-gray-600">Loading market rates...</p>
        </div>
      )}

      {rates && rates.gold24K && rates.gold22K && rates.silver && (rates.gold24K.perGram > 0 || rates.silver.perGram > 0) && (
        <>
          {/* Price Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Gold 24K Card */}
            <div className="p-4 rounded-lg border-2 border-yellow-200 bg-yellow-50">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-2">🟨</span>
                <h4 className="text-base font-semibold text-gray-900">Gold 24K</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">1 gram</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatMetalPrice(rates.gold24K?.perGram || 0, currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-yellow-300">
                  <span className="text-sm text-gray-600">8 grams</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatMetalPrice(rates.gold24K?.per8Gram || 0, currencySymbol)}
                  </span>
                </div>
              </div>
            </div>

            {/* Gold 22K Card */}
            <div className="p-4 rounded-lg border-2 border-yellow-300 bg-yellow-100">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-2">🟨</span>
                <h4 className="text-base font-semibold text-gray-900">Gold 22K</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">1 gram</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatMetalPrice(rates.gold22K?.perGram || 0, currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-yellow-300">
                  <span className="text-sm text-gray-600">8 grams</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatMetalPrice(rates.gold22K?.per8Gram || 0, currencySymbol)}
                  </span>
                </div>
              </div>
            </div>

            {/* Silver Card */}
            <div className="p-4 rounded-lg border-2 border-gray-300 bg-gray-50">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-2">⚪</span>
                <h4 className="text-base font-semibold text-gray-900">Silver</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">1 gram</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatMetalPrice(rates.silver?.perGram || 0, currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="text-sm text-gray-600">8 grams</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatMetalPrice(rates.silver?.per8Gram || 0, currencySymbol)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && !rates && !error && (
        <div className="text-center py-8">
          <Icon name="AlertTriangle" size={32} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">Unable to load market rates</p>
        </div>
      )}

      <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
        <p className="text-xs text-gray-600 flex items-start">
          <Icon name="Info" size={14} className="mr-2 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Disclaimer:</strong> Market prices are indicative. Rates may vary by jeweller and location.
            Rates are stored in the backend database and cached locally for offline access.
          </span>
        </p>
      </div>
    </div>
  );
};

export default MarketRates;
