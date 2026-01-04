# Export & Import Feature Guide

## Overview

The expense tracker now supports **exporting and importing** user data in JSON and Excel formats. This feature allows users to:
- Back up their financial data
- Restore data from previous backups
- Transfer data between devices
- Migrate data safely

## Security Features

✅ **User-Scoped**: All operations are automatically scoped to the logged-in user via Supabase RLS  
✅ **No Cross-User Data**: Users can only export/import their own data  
✅ **User ID Protection**: Imported `user_id` values are ignored and replaced with the current user's ID  
✅ **RLS Enforcement**: All database operations respect Row Level Security policies  

## Export Functionality

### Supported Formats

1. **JSON** (`.json`)
   - Human-readable format
   - Easy to edit manually
   - Recommended for backups

2. **Excel** (`.xlsx`)
   - Spreadsheet format
   - Multiple sheets (Income, Expenses, Loans, Savings, Profile)
   - Easy to view and analyze in Excel/Google Sheets

### Export Structure

#### JSON Format
```json
{
  "meta": {
    "app": "Personal Finance Tracker",
    "exportedAt": "2024-01-30T10:00:00.000Z",
    "version": "1.0"
  },
  "data": {
    "income": [...],
    "expenses": [...],
    "loans": [...],
    "savings": [...],
    "profile": {...}
  }
}
```

#### Excel Format
- **Income Sheet**: All income records
- **Expenses Sheet**: All expense records
- **Loans Sheet**: All loan records
- **Savings Sheet**: All savings goals
- **Profile Sheet**: User profile (optional)

### How to Export

1. Navigate to **Profile** tab
2. Scroll to **"Data & Backup"** section
3. Click **"Export as JSON"** or **"Export as Excel"**
4. File downloads automatically

## Import Functionality

### Supported Formats

- JSON (`.json`) - Must match export structure
- Excel (`.xlsx`) - Must have sheets: Income, Expenses, Loans, Savings

### Import Modes

#### 1. Merge Mode (Default)
- **Adds** new records to existing data
- Preserves all existing records
- Safe for incremental backups
- Recommended for most use cases

#### 2. Replace Mode
- **Deletes** all existing data first
- Then imports new data
- Requires confirmation modal
- Use with caution - data loss is permanent

### Import Process

1. Navigate to **Profile** tab
2. Scroll to **"Data & Backup"** section
3. Click **"Choose File"**
4. Select JSON or Excel file
5. File is validated automatically
6. Review import preview (record counts)
7. Select import mode (Merge or Replace)
8. Click **"Import Data"**
9. Confirm if using Replace mode
10. Wait for import to complete
11. Review import report

### Validation Rules

Before importing, the system validates:
- ✅ File format (JSON or Excel)
- ✅ Required fields present
- ✅ Data types correct
- ✅ Enum values valid (e.g., income type, loan status)
- ✅ No invalid user_id values

### Import Safety

- ❌ **Never** imports `user_id` from file
- ✅ **Always** uses current user's ID
- ✅ **Always** respects RLS policies
- ✅ **Always** validates before importing
- ✅ **Always** shows confirmation for destructive operations

## Data Fields

### Income
- `id`, `amount`, `type`, `source`, `date`
- `recurringFrequency` (optional), `notes` (optional)

### Expenses
- `id`, `amount`, `category`, `date`, `paymentMethod`
- `notes` (optional)

### Loans
- `id`, `name`, `type`, `principal`, `interestRate`
- `interestType`, `tenure`, `emi`, `outstandingBalance`
- `startDate`, `status`, `notes` (optional)

### Savings Goals
- `id`, `name`, `targetAmount`, `targetDate`, `currentSavings`
- `priority`, `status` (optional)
- `monthlySavingRequired` (optional), `feasibilityScore` (optional)

### Profile
- `id`, `name`, `currency`, `monthlyIncome`, `riskLevel`

## Error Handling

### Common Errors

1. **Invalid File Format**
   - Solution: Use JSON or Excel files only

2. **Missing Required Fields**
   - Solution: Ensure all required fields are present

3. **Invalid Data Types**
   - Solution: Check that numbers are numbers, dates are strings, etc.

4. **Import Failed**
   - Solution: Check network connection and try again
   - Partial imports may have succeeded - check import report

### Import Report

After import, you'll see:
- ✅ Success/failure status
- 📊 Records imported per category
- ⚠️ Warnings (non-critical issues)
- ❌ Errors (failed records)

## Best Practices

1. **Regular Backups**: Export data regularly (weekly/monthly)
2. **Test Imports**: Test import on a test account first
3. **Keep Exports**: Store exports in a safe location
4. **Use Merge Mode**: Prefer merge mode unless you need a clean slate
5. **Verify After Import**: Check that data imported correctly

## Technical Details

### File Locations

- Export utilities: `src/utils/export/`
- Import utilities: `src/utils/import/`
- Import service: `src/services/importService.ts`
- UI component: `src/components/DataBackup.tsx`

### Dependencies

- `xlsx` - Excel file handling
- Supabase - Database operations (with RLS)

### Security Implementation

1. **User ID Sanitization**: All imported data has `user_id` stripped
2. **RLS Enforcement**: Database operations automatically filter by user
3. **Validation**: Data validated before any database operations
4. **Confirmation**: Destructive operations require explicit confirmation

## Troubleshooting

### Export not working
- Check browser download settings
- Ensure you have data to export
- Try a different browser

### Import not working
- Verify file format matches export structure
- Check file isn't corrupted
- Review validation errors in preview
- Ensure you're logged in

### Data not appearing after import
- Refresh the page
- Check import report for errors
- Verify import mode (merge vs replace)
- Check browser console for errors

## Support

For issues or questions:
1. Check import/export report for specific errors
2. Review browser console for technical errors
3. Verify file format matches documentation
4. Ensure Supabase connection is working

---

**Note**: This feature is production-ready and follows all security best practices. All operations are user-scoped and cannot affect other users' data.
