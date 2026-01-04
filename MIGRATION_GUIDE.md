# IndexedDB to Supabase Migration Guide

## Overview

The expense tracker now includes a **one-time migration system** that safely moves existing local data (IndexedDB) to Supabase cloud storage. This ensures existing users don't lose their data when upgrading to the cloud-based system.

## Migration Flow

### Automatic Detection

1. **After Login**: System automatically checks for IndexedDB data
2. **Migration Status**: Checks if user has already migrated
3. **Data Detection**: Counts records in IndexedDB stores
4. **User Prompt**: Shows migration modal if data is found

### User Experience

1. **Initial Prompt**: User sees modal asking to migrate data
2. **Preview**: Shows summary of data to be migrated
3. **Confirmation**: User confirms migration
4. **Progress**: Real-time progress indicator during migration
5. **Success**: Migration report with results
6. **Option**: User can choose to keep local data for offline use

### Manual Migration

Users who skip the initial migration can manually trigger it:
- Go to **Profile** → **Data & Backup**
- Look for "Local data detected" section
- Click **"Migrate Local Data"**

## Security Features

✅ **User-Scoped**: All migrations are per-user via Supabase RLS  
✅ **User ID Protection**: Never trusts `user_id` from IndexedDB - always uses current user  
✅ **One-Time**: Migration flag prevents duplicate migrations  
✅ **Safe**: Never deletes data without user consent  
✅ **Idempotent**: Can be safely retried if it fails  

## Data Migration

### Migrated Data Types

- **Income**: All income records
- **Expenses**: All expense records
- **Loans**: All loan records
- **Savings Goals**: All savings goal records
- **Profile**: User profile settings

### Migration Process

1. **Read from IndexedDB**: Fetches all data from local storage
2. **Sanitize**: Removes any `user_id` fields (security)
3. **Validate**: Ensures required fields are present
4. **Insert**: Batch inserts into Supabase (user_id auto-set by RLS)
5. **Track**: Marks migration as complete per user
6. **Reload**: Refreshes data from Supabase

### Conflict Handling

- **Merge Mode**: New records are added to existing Supabase data
- **Duplicate Prevention**: New IDs generated to avoid conflicts
- **Error Handling**: Failed records are logged but don't stop migration

## Migration State Tracking

### LocalStorage Flag

```javascript
localStorage.setItem(`migration_done_${userId}`, 'true');
```

This ensures:
- Migration runs once per user
- No duplicate uploads
- Per-user tracking (different users on same device)

### Checking Migration Status

```javascript
import { isMigrationDone } from './utils/migration/markMigrationDone';

const hasMigrated = isMigrationDone(userId);
```

## Technical Implementation

### Migration Utilities

Located in `src/utils/migration/`:

- **detectIndexedDBData.ts**: Detects and reads IndexedDB data
- **getMigrationSummary.ts**: Generates migration preview
- **markMigrationDone.ts**: Tracks migration state
- **migrateIncome.ts**: Migrates income records
- **migrateExpenses.ts**: Migrates expense records
- **migrateLoans.ts**: Migrates loan records
- **migrateSavings.ts**: Migrates savings goals
- **migrateProfile.ts**: Migrates user profile

### Migration Modal

**Component**: `src/components/MigrationModal.tsx`

**Steps**:
1. `prompt` - Initial user prompt
2. `preview` - Data summary and confirmation
3. `migrating` - Progress indicator
4. `success` - Migration results
5. `error` - Error handling

### Integration Points

1. **App.tsx**: Automatic detection after login
2. **DataBackup.tsx**: Manual migration option

## User Options

### Keep Local Data

After migration, users can choose to:
- ✅ **Keep local data** (default) - For offline access
- ❌ **Delete local data** - Clean up after migration

**Note**: Local data is never automatically deleted without user consent.

### Skip Migration

Users can:
- Skip the initial prompt
- Migrate later from Settings
- Continue using local data only (not recommended)

## Error Handling

### Partial Failures

- Individual record failures don't stop migration
- Errors are logged and shown in migration report
- Successful records are still migrated

### Retry Logic

- Users can retry failed migrations
- Migration flag is only set on complete success
- Failed records can be re-migrated

## Migration Report

After migration, users see:

```
Migration Results:
• Income: X migrated, Y failed
• Expenses: X migrated, Y failed
• Loans: X migrated, Y failed
• Savings: X migrated, Y failed
• Profile: Migrated

Warnings:
• [Any errors encountered]
```

## Best Practices

1. **Always Prompt**: Never auto-migrate without user consent
2. **Show Preview**: Always show what will be migrated
3. **Progress Feedback**: Show real-time progress
4. **Error Reporting**: Clearly show any failures
5. **Preserve Data**: Never delete local data without consent
6. **One-Time**: Ensure migration only runs once per user

## Troubleshooting

### Migration Not Appearing

- Check if IndexedDB has data
- Verify user is logged in
- Check if migration already completed
- Clear migration flag to retry: `localStorage.removeItem('migration_done_${userId}')`

### Migration Fails

- Check browser console for errors
- Verify Supabase connection
- Check RLS policies are enabled
- Review migration report for specific errors

### Data Not Appearing

- Refresh the page after migration
- Check Supabase dashboard for data
- Verify user is logged in with correct account
- Check migration report for failures

## Code Examples

### Check for Migration

```typescript
import { detectIndexedDBData } from './utils/migration/detectIndexedDBData';
import { isMigrationDone } from './utils/migration/markMigrationDone';

const shouldShowMigration = async (userId: string) => {
  const hasMigrated = isMigrationDone(userId);
  if (hasMigrated) return false;
  
  const summary = await detectIndexedDBData();
  return summary.hasData;
};
```

### Manual Migration Trigger

```typescript
import { getAllIndexedDBData } from './utils/migration/detectIndexedDBData';
import { getMigrationSummary } from './utils/migration/getMigrationSummary';

const triggerMigration = async () => {
  const indexedDBData = await getAllIndexedDBData();
  const summary = getMigrationSummary(indexedDBData);
  // Show migration modal with summary
};
```

## Security Notes

⚠️ **Critical Security Rules**:

1. **Never trust `user_id` from IndexedDB** - Always use current authenticated user
2. **Always use RLS** - Supabase automatically filters by user
3. **Sanitize data** - Remove any user_id fields before insert
4. **One-time only** - Migration flag prevents duplicates
5. **User consent** - Never migrate without explicit user action

## Future Considerations

- **Offline Sync**: Keep IndexedDB for offline access
- **Conflict Resolution**: Handle conflicts between local and cloud data
- **Selective Migration**: Allow users to choose which data to migrate
- **Migration History**: Track migration attempts and results

---

**Note**: This migration system is production-ready and follows all security best practices. All operations are user-scoped and cannot affect other users' data.
