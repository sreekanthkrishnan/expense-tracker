# Bank Statement Import Guide

## Overview

The expense tracker now supports **importing bank statements** from CSV and Excel files. This feature allows users to bulk import transactions instead of entering them manually, saving time and reducing errors.

## Supported File Formats

### ✅ Required Formats
- **CSV** (`.csv`) - Comma-separated values
- **Excel** (`.xlsx`, `.xls`) - Microsoft Excel spreadsheets
- **PDF** (`.pdf`) - Portable Document Format (including password-protected PDFs)

### 📋 Expected File Structure

Bank statements should contain columns for:
- **Date** - Transaction date (various formats supported)
- **Description/Narration** - Transaction description
- **Debit** - Withdrawal amount (optional)
- **Credit** - Deposit amount (optional)
- **Amount** - Single amount column (optional, if debit/credit not available)
- **Reference** - Transaction reference ID (optional)

## Import Flow

### Step 1: Upload File
1. Go to **Expenses** tab
2. Click **"Import Bank Statement"** button
3. Select CSV, Excel, or PDF file
4. File is validated automatically

### Step 1a: Password-Protected PDFs (if applicable)
- If the PDF is password-protected, a password prompt will appear
- Enter the password to unlock the file
- Password is used only for parsing and is never stored
- Maximum 3 retry attempts for incorrect passwords

### Step 2: Parsing
- System extracts transactions from file
- Handles various date formats
- Identifies debit/credit columns
- Normalizes transaction data

### Step 3: Preview & Review
- **Summary Statistics**: Total found, selected, duplicates
- **Preview Table**: All transactions with details
- **Editable Categories**: Change category for expenses
- **Include/Exclude**: Select which transactions to import
- **Duplicate Detection**: Highlights potential duplicates

### Step 4: Duplicate Handling
- System compares against existing records
- Matches by: amount + date + description similarity
- Option to skip duplicates automatically
- Visual indicators for duplicate entries

### Step 5: Confirmation
- Review summary before import
- See exactly what will be imported
- Confirm or cancel

### Step 6: Import
- Selected transactions are imported
- Income → added to income records
- Expenses → added to expense records
- Results shown with success/failure counts

## Transaction Mapping

### Income Transactions
- **Type**: Automatically set to "one-time"
- **Source**: Uses description from statement
- **Amount**: Credit amount or positive amount
- **Date**: Parsed from statement
- **Notes**: Includes reference if available

### Expense Transactions
- **Category**: Defaults to "Uncategorized" (user can edit)
- **Amount**: Debit amount or negative amount
- **Date**: Parsed from statement
- **Payment Method**: Set to "Bank Transfer"
- **Notes**: Includes reference if available

## Duplicate Detection

### Matching Criteria
- ✅ **Exact amount match** (within $0.01)
- ✅ **Same date**
- ✅ **Description similarity** (70% threshold)

### Duplicate Handling
- **Skip automatically**: Option to exclude duplicates
- **Visual indicators**: Yellow highlighting for duplicates
- **User control**: Can include duplicates if needed

## File Format Examples

### CSV Format
```csv
Date,Description,Debit,Credit,Reference
2024-01-15,Salary Credit,0,5000.00,REF123
2024-01-16,Grocery Store,150.50,0,REF124
2024-01-17,ATM Withdrawal,200.00,0,REF125
```

### Excel Format
- First row should contain headers
- Date column required
- Debit/Credit or Amount column required
- Description column recommended

## Safety Features

✅ **No Auto-Import**: All imports require user confirmation  
✅ **Preview Required**: Always shows data before importing  
✅ **Selective Import**: Users choose which transactions to import  
✅ **Duplicate Detection**: Prevents accidental duplicates  
✅ **Validation**: Checks data before import  
✅ **User-Scoped**: Only imports to current user's account  
✅ **RLS Protected**: All operations respect Supabase RLS  
✅ **Password Security**: PDF passwords are never stored, logged, or sent to servers  
✅ **Password Protection**: Maximum retry attempts prevent brute force attacks  

## Best Practices

1. **Review Before Import**: Always check preview table
2. **Edit Categories**: Assign proper categories to expenses
3. **Check Duplicates**: Review duplicate warnings carefully
4. **Selective Import**: Unselect transactions you don't want
5. **Verify Results**: Check import report after completion

## Troubleshooting

### "No valid transactions found"
- Check file format matches expected structure
- Ensure date column is present and valid
- Verify amount columns are numeric

### "Invalid date format"
- Try different date formats in your file
- Common formats: YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY

### "Could not find date column"
- Ensure header row contains "date" or "transaction date"
- Check file encoding (should be UTF-8)

### Transactions not importing
- Check if transactions are selected (checkbox)
- Verify duplicates aren't being skipped
- Review import report for errors

## Technical Details

### Parsing Logic
- **CSV**: Handles comma-separated values with header detection
- **Excel**: Uses xlsx library to read sheets
- **Date Parsing**: Supports multiple date formats
- **Amount Parsing**: Handles currency symbols and formatting

### Duplicate Detection Algorithm
1. Exact amount match (within $0.01)
2. Same date
3. String similarity on description (70% threshold)
4. Word overlap calculation

### Import Process
1. Validate each transaction
2. Check for duplicates
3. Insert into Supabase (with user_id)
4. Batch operations for efficiency
5. Error handling per transaction

## Files Created

- `src/utils/bankImport/types.ts` - Type definitions
- `src/utils/bankImport/parseCSV.ts` - CSV parser
- `src/utils/bankImport/parseExcel.ts` - Excel parser
- `src/utils/bankImport/parseProtectedPDF.ts` - PDF parser (with password support)
- `src/utils/bankImport/detectProtectedPDF.ts` - PDF password detection
- `src/utils/bankImport/normalizeTransactions.ts` - Data normalization
- `src/utils/bankImport/detectStatementDuplicates.ts` - Duplicate detection
- `src/components/BankStatementImport.tsx` - UI component
- `src/components/PasswordPrompt.tsx` - Password input modal

## Future Enhancements

Potential improvements:
- PDF parsing for structured statements
- Auto-category suggestion based on description
- Bank-specific templates
- AI-based transaction classification
- Bulk category assignment
- Import history tracking

---

**Note**: This feature is production-ready and follows all security best practices. All imports are user-scoped and require explicit confirmation.
