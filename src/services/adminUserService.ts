/**
 * Admin User Service
 * 
 * Handles admin operations for user management.
 * NOTE: User creation requires Supabase Admin API (service role key).
 * This should be done via a secure edge function or backend service.
 * 
 * For now, this service provides the interface, but actual user creation
 * must be done server-side to protect the service role key.
 */

import { supabase } from '../lib/supabaseClient';
import type { UserProfile } from './profileService';

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
}

/**
 * Get all users (admin only)
 * Uses the profileService, but kept here for admin context
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
 * Update user role (admin only)
 */
export const updateUserRole = async (
  userId: string,
  role: 'admin' | 'user'
): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Update user name (admin can update any user)
 */
export const updateUserName = async (
  userId: string,
  name: string
): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error updating user name:', error);
    throw error;
  }
};

/**
 * IMPORTANT: User creation requires Supabase Admin API
 * This function is a placeholder - actual implementation should be done
 * via a secure edge function or backend service that has access to
 * the service role key.
 * 
 * Example edge function structure:
 * - POST /api/admin/create-user
 * - Uses service role key server-side
 * - Creates user in auth.users
 * - Creates profile with role
 * - Returns user data
 */
export const createUser = async (
  _input: CreateUserInput
): Promise<{ success: boolean; message: string }> => {
  // This is a placeholder - actual implementation requires service role key
  // which should NEVER be exposed to the frontend
  
  return {
    success: false,
    message: 'User creation must be done via secure backend endpoint. Please implement an edge function or backend service that uses the Supabase service role key.'
  };
};
