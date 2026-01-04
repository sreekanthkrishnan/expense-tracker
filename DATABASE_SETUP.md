# Database Setup - Quick Fix

## Error: "Could not find the table 'public.incomes'"

This error means the database tables haven't been created in your Supabase project yet.

## Solution: Run the Migration

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Run the Migration

1. Open the file: `supabase/migrations/001_initial_schema.sql`
2. Copy **ALL** the contents of that file
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** (or press Cmd/Ctrl + Enter)

### Step 3: Verify Tables Created

After running the migration, verify tables exist:

1. Go to **"Table Editor"** in Supabase dashboard
2. You should see these tables:
   - `incomes`
   - `expenses`
   - `loans`
   - `savings`
   - `users_profile`

### Step 4: Verify RLS is Enabled

For each table, ensure Row Level Security (RLS) is enabled:

1. In **Table Editor**, click on each table
2. Check that **"Enable RLS"** toggle is **ON** (green)
3. If not, click the toggle to enable it

## Quick SQL Check

You can also verify tables exist by running this in SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('incomes', 'expenses', 'loans', 'savings', 'users_profile');
```

This should return 5 rows (one for each table).

## Common Issues

### Issue: "relation already exists"
- **Solution**: Tables already exist. This is fine - the migration uses `CREATE TABLE IF NOT EXISTS`

### Issue: "permission denied"
- **Solution**: Make sure you're using the SQL Editor (not trying to run via API)
- You need to be logged in as the project owner

### Issue: Tables created but RLS not enabled
- **Solution**: Manually enable RLS in Table Editor for each table
- Or re-run the RLS policy sections from the migration file

## After Migration

Once the migration is complete:
1. Refresh your app
2. Try creating an income/expense again
3. The error should be gone!

## Need Help?

If you still see errors after running the migration:
1. Check browser console for specific error messages
2. Verify your Supabase credentials in `.env` file
3. Check Supabase dashboard → Logs for database errors
