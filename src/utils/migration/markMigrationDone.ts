/**
 * Mark Migration Done
 * 
 * Tracks migration state per user to prevent duplicate migrations.
 * SECURITY: Uses user ID to ensure per-user tracking.
 */

/**
 * Check if migration has been completed for a user
 * 
 * @param userId - Current user's ID
 * @returns True if migration is done
 */
export const isMigrationDone = (userId: string): boolean => {
  const key = `migration_done_${userId}`;
  return localStorage.getItem(key) === 'true';
};

/**
 * Mark migration as completed for a user
 * 
 * @param userId - Current user's ID
 */
export const markMigrationDone = (userId: string): void => {
  const key = `migration_done_${userId}`;
  localStorage.setItem(key, 'true');
};

/**
 * Reset migration status (for testing or manual retry)
 * 
 * @param userId - Current user's ID
 */
export const resetMigrationStatus = (userId: string): void => {
  const key = `migration_done_${userId}`;
  localStorage.removeItem(key);
};
