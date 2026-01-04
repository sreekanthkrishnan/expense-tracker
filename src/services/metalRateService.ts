/**
 * Metal Rate Service
 * 
 * Handles gold and silver rates from both API and admin sources.
 * 
 * PRIORITY LOGIC (NON-NEGOTIABLE):
 * 1. API rates (if available) - Market accuracy preserved
 * 2. Admin rates (fallback only) - Used when API data is missing
 * 
 * Admin rates act as a safety net, NOT an override.
 * This ensures market accuracy while allowing manual rates for:
 * - Historical dates missing in API
 * - Future dates
 * - API downtime scenarios
 */

import { supabase } from '../lib/supabaseClient';

export interface MetalRate {
  id: string;
  metal: 'gold' | 'silver';
  purity: '24k' | '22k' | '999';
  price_per_gram: number;
  date: string; // ISO date string (YYYY-MM-DD)
  source: 'admin' | 'api';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMetalRateInput {
  metal: 'gold' | 'silver';
  purity: '24k' | '22k' | '999';
  price_per_gram: number;
  date: string; // ISO date string (YYYY-MM-DD)
}

/**
 * Get API rate for a specific metal, purity, and date
 * Returns null if no API rate exists for that date
 * 
 * API rates have highest priority - they represent live market data
 */
export const getApiRate = async (
  metal: 'gold' | 'silver',
  purity: '24k' | '22k' | '999',
  date: string // ISO date string (YYYY-MM-DD)
): Promise<MetalRate | null> => {
  try {
    const { data, error } = await supabase
      .from('metal_rates')
      .select('*')
      .eq('metal', metal)
      .eq('purity', purity)
      .eq('date', date)
      .eq('source', 'api')
      .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

    if (error) {
      // PGRST116 means no rows found, which is expected when no rate exists
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching API rate:', error);
      return null;
    }

    // maybeSingle() returns null if no rows found, data if one row found
    return data as MetalRate | null;
  } catch (error) {
    console.error('Error fetching API rate:', error);
    return null;
  }
};

/**
 * Get admin rate for a specific metal, purity, and date
 * Returns null if no admin rate exists for that date
 * 
 * Admin rates override API rates when available, allowing manual control.
 */
export const getAdminRate = async (
  metal: 'gold' | 'silver',
  purity: '24k' | '22k' | '999',
  date: string // ISO date string (YYYY-MM-DD)
): Promise<MetalRate | null> => {
  try {
    const { data, error } = await supabase
      .from('metal_rates')
      .select('*')
      .eq('metal', metal)
      .eq('purity', purity)
      .eq('date', date)
      .eq('source', 'admin')
      .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

    if (error) {
      // PGRST116 means no rows found, which is expected when no rate exists
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching admin rate:', error);
      return null;
    }

    // maybeSingle() returns null if no rows found, data if one row found
    return data as MetalRate | null;
  } catch (error) {
    console.error('Error fetching admin rate:', error);
    return null;
  }
};

/**
 * Get resolved rate following priority logic:
 * 1. Admin rate (if available) - Admin can override for today
 * 2. API rate (fallback) - Use stored API data if no admin override
 * 3. null (if neither exists)
 * 
 * This is the main function to use when fetching rates.
 * Admin rates take precedence over API rates, allowing manual control.
 */
export const getResolvedRate = async (
  metal: 'gold' | 'silver',
  purity: '24k' | '22k' | '999',
  date: string // ISO date string (YYYY-MM-DD)
): Promise<{ rate: MetalRate; source: 'api' | 'admin' } | null> => {
  // STEP 1: Check for admin rate first (admin can override)
  const adminRate = await getAdminRate(metal, purity, date);
  if (adminRate) {
    return { rate: adminRate, source: 'admin' };
  }

  // STEP 2: Fallback to API rate if no admin override exists
  const apiRate = await getApiRate(metal, purity, date);
  if (apiRate) {
    return { rate: apiRate, source: 'api' };
  }

  // STEP 3: Neither exists
  return null;
};

/**
 * Get all resolved rates for a date in a single query (optimized)
 * Fetches gold 24K, gold 22K, and silver rates efficiently
 */
export const getResolvedRatesForDate = async (
  date: string // ISO date string (YYYY-MM-DD)
): Promise<{
  gold24K: { rate: MetalRate; source: 'api' | 'admin' } | null;
  gold22K: { rate: MetalRate; source: 'api' | 'admin' } | null;
  silver: { rate: MetalRate; source: 'api' | 'admin' } | null;
}> => {
  // Fetch all rates in parallel for better performance
  const [gold24K, gold22K, silver] = await Promise.all([
    getResolvedRate('gold', '24k', date),
    getResolvedRate('gold', '22k', date),
    getResolvedRate('silver', '999', date),
  ]);

  return {
    gold24K,
    gold22K,
    silver,
  };
};

/**
 * Get all admin rates (admin only)
 */
export const getAllAdminRates = async (): Promise<MetalRate[]> => {
  try {
    const { data, error } = await supabase
      .from('metal_rates')
      .select('*')
      .eq('source', 'admin')
      .order('date', { ascending: false })
      .order('metal', { ascending: true })
      .order('purity', { ascending: true });

    if (error) {
      throw error;
    }

    return data as MetalRate[];
  } catch (error) {
    console.error('Error fetching all admin rates:', error);
    throw error;
  }
};

/**
 * Create a new admin rate (admin only)
 */
export const createAdminRate = async (
  input: CreateMetalRateInput
): Promise<MetalRate> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('metal_rates')
      .insert({
        metal: input.metal,
        purity: input.purity,
        price_per_gram: input.price_per_gram,
        date: input.date,
        source: 'admin',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate
      if (error.code === '23505') {
        throw new Error(`A rate already exists for ${input.metal} ${input.purity} on ${input.date}. Use update instead.`);
      }
      throw error;
    }

    return data as MetalRate;
  } catch (error) {
    console.error('Error creating admin rate:', error);
    throw error;
  }
};

/**
 * Update an existing admin rate (admin only)
 */
export const updateAdminRate = async (
  id: string,
  updates: Partial<CreateMetalRateInput>
): Promise<MetalRate> => {
  try {
    const { data, error } = await supabase
      .from('metal_rates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as MetalRate;
  } catch (error) {
    console.error('Error updating admin rate:', error);
    throw error;
  }
};

/**
 * Delete an admin rate (admin only)
 */
export const deleteAdminRate = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('metal_rates')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting admin rate:', error);
    throw error;
  }
};

/**
 * Check if admin rate exists for a date (to prevent duplicates)
 */
export const checkRateExists = async (
  metal: 'gold' | 'silver',
  purity: '24k' | '22k' | '999',
  date: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('metal_rates')
      .select('id')
      .eq('metal', metal)
      .eq('purity', purity)
      .eq('date', date)
      .eq('source', 'admin')
      .maybeSingle(); // Use maybeSingle() to handle 0 rows gracefully

    if (error) {
      if (error.code === 'PGRST116') {
        return false; // No rate exists
      }
      console.error('Error checking rate existence:', error);
      return false;
    }

    return !!data; // Return true if data exists, false if null
  } catch (error) {
    console.error('Error checking rate existence:', error);
    return false;
  }
};

/**
 * Store API rate in database
 * Called automatically when rates are fetched from live APIs
 * This allows future lookups to use cached API rates instead of re-fetching
 */
export const storeApiRate = async (
  metal: 'gold' | 'silver',
  purity: '24k' | '22k' | '999',
  price_per_gram: number,
  date: string // ISO date string (YYYY-MM-DD)
): Promise<void> => {
  try {
    // Check if API rate already exists for this date
    const existing = await getApiRate(metal, purity, date);
    if (existing) {
      // Update existing API rate
      await supabase
        .from('metal_rates')
        .update({ price_per_gram })
        .eq('id', existing.id);
      return;
    }

    // Insert new API rate
    await supabase
      .from('metal_rates')
      .insert({
        metal,
        purity,
        price_per_gram,
        date,
        source: 'api',
        created_by: null, // API rates are system-generated
      });
  } catch (error) {
    // Silently fail - storing API rates is optional optimization
    console.warn('Failed to store API rate in database:', error);
  }
};
