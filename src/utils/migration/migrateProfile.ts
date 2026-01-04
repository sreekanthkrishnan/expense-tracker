/**
 * Migrate Profile Data
 * 
 * Migrates user profile from IndexedDB to Supabase.
 * SECURITY: Never trusts user_id from IndexedDB - always uses current user.
 */

import * as profileService from '../../services/profileService';
import type { Profile } from '../../types';

export interface MigrationResult {
  success: boolean;
  error?: string;
}

/**
 * Migrate profile to Supabase
 * 
 * @param profile - Profile data from IndexedDB
 * @param userId - Current user's ID (required)
 * @returns Migration result
 */
export const migrateProfile = async (
  profile: Profile | null,
  userId: string
): Promise<MigrationResult> => {
  if (!profile) {
    return { success: true };
  }

  try {
    // Strip any user_id if present (security)
    const { id, user_id, userId: profileUserId, ...profileData } = profile as any;

    // Create profile with current user's ID
    const newProfile: Profile = {
      ...profileData,
      id: userId, // Always use current user's ID
      name: profileData.name || '',
      currency: profileData.currency || 'USD',
      monthlyIncome: profileData.monthlyIncome || 0,
      riskLevel: profileData.riskLevel || 'Medium',
    };

    // Upsert into Supabase (user_id automatically set by RLS)
    await profileService.upsertProfile(newProfile);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to migrate profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
