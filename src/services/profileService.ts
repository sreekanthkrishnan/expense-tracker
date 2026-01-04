/**
 * Profile Service
 * 
 * Handles all CRUD operations for user profile using Supabase.
 * 
 * SECURITY: All operations automatically filter by user_id via RLS policies.
 */

import { supabase } from '../lib/supabaseClient';
import type { Profile } from '../types';

/**
 * Fetch the current user's profile
 */
export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    // Profile doesn't exist yet, return null
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching profile:', error);
    throw new Error('Failed to fetch profile');
  }

  if (!data) return null;

  return {
    id: data.id,
    name: data.name || '',
    currency: data.currency || 'USD',
    monthlyIncome: parseFloat(data.monthly_income || '0'),
    riskLevel: data.risk_level || 'Medium',
  };
};

/**
 * Create or update user profile
 */
export const upsertProfile = async (profile: Profile): Promise<Profile> => {
  const { data, error } = await supabase
    .from('users_profile')
    .upsert({
      id: profile.id,
      name: profile.name,
      currency: profile.currency,
      monthly_income: profile.monthlyIncome,
      risk_level: profile.riskLevel,
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting profile:', error);
    throw new Error('Failed to save profile');
  }

  return {
    id: data.id,
    name: data.name || '',
    currency: data.currency || 'USD',
    monthlyIncome: parseFloat(data.monthly_income || '0'),
    riskLevel: data.risk_level || 'Medium',
  };
};
