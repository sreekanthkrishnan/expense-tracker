/**
 * Delete Duplicate Records from IndexedDB
 * 
 * Safely deletes duplicate entries from local IndexedDB storage.
 */

import { dbDelete } from '../indexedDB';
import type { DuplicateGroup } from './detectDuplicates';

export interface DeleteResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Delete duplicate income records from IndexedDB
 * 
 * @param duplicateIds - Array of income IDs to delete
 * @returns Delete result
 */
export const deleteIndexedDBIncomeDuplicates = async (duplicateIds: string[]): Promise<DeleteResult> => {
  const result: DeleteResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const id of duplicateIds) {
    try {
      await dbDelete('income', id);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push(`Failed to delete income ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
};

/**
 * Delete duplicate expense records from IndexedDB
 * 
 * @param duplicateIds - Array of expense IDs to delete
 * @returns Delete result
 */
export const deleteIndexedDBExpenseDuplicates = async (duplicateIds: string[]): Promise<DeleteResult> => {
  const result: DeleteResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const id of duplicateIds) {
    try {
      await dbDelete('expenses', id);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push(`Failed to delete expense ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
};

/**
 * Delete duplicates from a duplicate group in IndexedDB
 * Keeps the first entry (oldest), deletes the rest
 * 
 * @param group - Duplicate group
 * @param keepIndex - Index of entry to keep (default: 0, oldest)
 * @returns Delete result
 */
export const deleteIndexedDBDuplicateGroup = async (
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
    return await deleteIndexedDBIncomeDuplicates(idsToDelete);
  } else {
    return await deleteIndexedDBExpenseDuplicates(idsToDelete);
  }
};
