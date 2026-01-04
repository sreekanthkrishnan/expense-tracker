/**
 * Delete Duplicate Records from Supabase
 * 
 * Safely deletes duplicate entries from Supabase.
 * SECURITY: All operations respect RLS policies.
 */

import { supabase } from '../../lib/supabaseClient';
import type { DuplicateGroup } from './detectDuplicates';

export interface DeleteResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Delete duplicate income records
 * 
 * @param duplicateIds - Array of income IDs to delete
 * @returns Delete result
 */
export const deleteSupabaseIncomeDuplicates = async (duplicateIds: string[]): Promise<DeleteResult> => {
  const result: DeleteResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  if (duplicateIds.length === 0) {
    return result;
  }

  // Delete in batches to avoid overwhelming the database
  const batchSize = 50;
  for (let i = 0; i < duplicateIds.length; i += batchSize) {
    const batch = duplicateIds.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('incomes')
      .delete()
      .in('id', batch);

    if (error) {
      result.failed += batch.length;
      result.errors.push(`Failed to delete income batch: ${error.message}`);
    } else {
      result.success += batch.length;
    }
  }

  return result;
};

/**
 * Delete duplicate expense records
 * 
 * @param duplicateIds - Array of expense IDs to delete
 * @returns Delete result
 */
export const deleteSupabaseExpenseDuplicates = async (duplicateIds: string[]): Promise<DeleteResult> => {
  const result: DeleteResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  if (duplicateIds.length === 0) {
    return result;
  }

  // Delete in batches
  const batchSize = 50;
  for (let i = 0; i < duplicateIds.length; i += batchSize) {
    const batch = duplicateIds.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .in('id', batch);

    if (error) {
      result.failed += batch.length;
      result.errors.push(`Failed to delete expense batch: ${error.message}`);
    } else {
      result.success += batch.length;
    }
  }

  return result;
};

/**
 * Delete duplicates from a duplicate group
 * Keeps the first entry (oldest), deletes the rest
 * 
 * @param group - Duplicate group
 * @param keepIndex - Index of entry to keep (default: 0, oldest)
 * @returns Delete result
 */
export const deleteDuplicateGroup = async (
  group: DuplicateGroup,
  keepIndex: number = 0
): Promise<DeleteResult> => {
  if (group.entries.length <= 1) {
    return { success: 0, failed: 0, errors: [] };
  }

  // Get IDs to delete (all except the one to keep)
  const idsToDelete = group.entries
    .filter((_, index) => index !== keepIndex)
    .map((entry) => entry.id);

  if (group.type === 'income') {
    return await deleteSupabaseIncomeDuplicates(idsToDelete);
  } else {
    return await deleteSupabaseExpenseDuplicates(idsToDelete);
  }
};
