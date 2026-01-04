/**
 * Profile Service
 * 
 * Handles user profile operations including role checking.
 */

import { supabase } from '../lib/supabaseClient';

export interface UserProfile {
  id: string;
  name: string | null;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

/**
 * Get current user's profile
 * Creates profile if it doesn't exist (for existing users who signed up before migration)
 */
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found');
      return null;
    }

    console.log('Fetching profile for user:', user.id);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      // If profile doesn't exist (PGRST116 = no rows returned), create it
      if (error.code === 'PGRST116') {
        console.log('Profile not found, creating new profile for user:', user.id);
        
        // Create profile with default role 'user'
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            role: 'user', // Default role
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          // If insert fails due to RLS, the table might not exist or migration not run
          if (createError.code === '42501') {
            console.error('RLS error - profiles table might not exist or migration not run. Please run migration 003_admin_schema.sql');
          }
          return null;
        }

        console.log('Profile created successfully:', newProfile);
        return newProfile as UserProfile;
      }
      
      console.error('Error fetching profile:', error);
      return null;
    }

    console.log('Profile found:', data);
    return data as UserProfile;
  } catch (error) {
    console.error('Error in getCurrentUserProfile:', error);
    return null;
  }
};

/**
 * Check if current user is admin
 */
export const isAdmin = async (): Promise<boolean> => {
  try {
    const profile = await getCurrentUserProfile();
    console.log('Admin check - profile:', profile);
    const isAdminUser = profile?.role === 'admin';
    console.log('Is admin?', isAdminUser);
    return isAdminUser;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data as UserProfile[];
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

/**
 * Update user profile (admin can update any, user can update own)
 */
export const updateUserProfile = async (
  userId: string,
  updates: { name?: string; role?: 'admin' | 'user' }
): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Fetch user profile from users_profile table (for app settings)
 */
export const fetchProfile = async (userId: string): Promise<import('../types').Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return null;
      }
      throw error;
    }

    return {
      id: data.id,
      name: data.name || '',
      currency: data.currency || 'USD',
      monthlyIncome: parseFloat(data.monthly_income?.toString() || '0'),
      riskLevel: (data.risk_level || 'Medium') as import('../types').Profile['riskLevel'],
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

/**
 * Upsert user profile in users_profile table (for app settings)
 */
export const upsertProfile = async (profile: import('../types').Profile): Promise<import('../types').Profile> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

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
      throw error;
    }

    return {
      id: data.id,
      name: data.name || '',
      currency: data.currency || 'USD',
      monthlyIncome: parseFloat(data.monthly_income?.toString() || '0'),
      riskLevel: (data.risk_level || 'Medium') as import('../types').Profile['riskLevel'],
    };
  } catch (error) {
    console.error('Error upserting profile:', error);
    throw error;
  }
};
