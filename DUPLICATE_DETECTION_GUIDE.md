# Duplicate Detection & Cleanup Guide

## Overview

The expense tracker now includes a **duplicate detection and cleanup feature** that helps users identify and remove duplicate entries from their financial data. This improves data integrity and prevents accidental double-counting.

## How It Works

### Duplicate Detection Strategy

The system uses different strategies for old and new data:

#### For Records WITH Timestamp (New Data)
- **Key**: `amount + date + rounded(created_at, 5min)`
- Entries created within 5 minutes with the same amount and date are considered duplicates
- More accurate for future entries

#### For Records WITHOUT Timestamp (Old Data)
- **Key**: `amount + date + category/source + type`
- Uses category (expenses) or source (income) to identify duplicates
- Handles legacy data that doesn't have timestamps

### Duplicate Matching Rules

Two entries are considered duplicates if they match:
- ✅ **Amount** (exact match)
- ✅ **Date** (same date)
- ✅ **Category** (for expenses) or **Source** (for income)
- ✅ **Type** (income vs expense)
- ✅ **Time** (if available, within 5-minute window)

## Features

### 1. Scan for Duplicates
- Analyzes all income and expense records
- Groups duplicates together
- Shows summary statistics

### 2. Preview & Review
- Shows all duplicate groups
- Displays each entry with:
  - Amount
  - Date
  - Category/Source
  - Creation time (if available)
- Highlights which entry will be kept (oldest)

### 3. Selective Cleanup
- Users can select which duplicate groups to clean
- All groups selected by default
- Can unselect groups to preserve

### 4. Safe Deletion
- **Keeps oldest entry** by default
- Deletes newer duplicates
- Batch deletion for efficiency
- Respects Supabase RLS policies

## Usage

### Accessing the Feature

1. Navigate to **Profile** tab
2. Scroll to **"Data Cleanup"** section
3. Click **"Scan for Duplicates"**

### Cleaning Process

1. **Scan**: Click "Scan for Duplicates" button
2. **Review**: If duplicates found, click "Review & Clean Duplicates"
3. **Select**: Choose which duplicate groups to clean (all selected by default)
4. **Confirm**: Click "Remove X Duplicate Groups"
5. **Result**: See cleanup report with success/failure counts

## Safety Features

✅ **No Auto-Delete**: Never deletes without user confirmation  
✅ **User-Scoped**: Only detects and deletes user's own data  
✅ **RLS Protected**: All deletions respect Supabase RLS policies  
✅ **Preview First**: Always shows what will be deleted  
✅ **Selective**: Users choose which duplicates to remove  
✅ **Keeps Oldest**: Preserves the original entry  

## Technical Details

### Timestamp Handling

- **New Entries**: Automatically include `created_at` timestamp
- **Old Entries**: Work without timestamps using category/source matching
- **No Backfilling**: Old records are not modified to add fake timestamps

### Duplicate Key Generation

```typescript
// With timestamp (new)
key = `${type}:${amount}:${date}:${roundedTime}`

// Without timestamp (old)
key = `${type}:${amount}:${date}:${category|source}`
```

### Deletion Strategy

- Groups entries by duplicate key
- Sorts by creation time (oldest first)
- Keeps first entry (index 0)
- Deletes remaining entries in batch

## UI Components

### Data Cleanup Section
- Located in Profile → Data Cleanup
- Scan button
- Results summary
- Review & Clean button
- Cleanup results

### Preview Modal
- Shows all duplicate groups
- Checkboxes for selection
- Entry details with highlighting
- "Keep" badge on oldest entry
- Action buttons

## Best Practices

1. **Regular Scans**: Run duplicate scan periodically
2. **Review Carefully**: Check preview before deleting
3. **Selective Cleanup**: Unselect groups if unsure
4. **Verify Results**: Check cleanup report after deletion

## Limitations

- Only detects exact duplicates (same amount, date, category)
- Cannot detect "similar" entries (e.g., $100.00 vs $100)
- Requires user confirmation for all deletions
- Works on income and expenses only (not loans/savings)

## Future Enhancements

Potential improvements:
- Auto-warn on duplicate entry creation
- "Looks like a duplicate" prompt when adding
- Duplicate confidence score
- Background cleanup suggestions
- Support for loans and savings duplicates

## Files Created

- `src/utils/cleanup/detectDuplicates.ts` - Main detection logic
- `src/utils/cleanup/groupByDuplicateKey.ts` - Key generation
- `src/utils/cleanup/deleteSupabaseDuplicates.ts` - Supabase deletion
- `src/utils/cleanup/deleteIndexedDBDuplicates.ts` - IndexedDB deletion
- `src/components/DataCleanup.tsx` - UI component

## Security

- ✅ All operations user-scoped via RLS
- ✅ No cross-user data access
- ✅ Requires explicit user confirmation
- ✅ Batch operations respect RLS policies

---

**Note**: This feature is production-ready and follows all security best practices. Duplicate detection is conservative to avoid false positives.
