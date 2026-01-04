# Admin Dashboard Setup Guide

This guide explains how to set up and use the Admin Dashboard for managing users and metal rates.

## 🗄️ Database Setup

### Step 1: Run the Admin Schema Migration

Run the SQL migration file in your Supabase SQL Editor:

```sql
-- File: supabase/migrations/003_admin_schema.sql
```

This creates:
- `profiles` table (for admin roles)
- `metal_rates` table (for admin-controlled rates)
- RLS policies for security
- Triggers for auto-creating profiles

### Step 2: Create Your First Admin User

After running the migration, you need to manually set a user as admin:

```sql
-- Replace 'USER_ID_HERE' with your actual user ID from auth.users
UPDATE profiles
SET role = 'admin'
WHERE id = 'USER_ID_HERE';
```

To find your user ID:
1. Sign up/login to the app
2. Check Supabase Dashboard → Authentication → Users
3. Copy the user ID
4. Run the UPDATE query above

## 🔐 Admin Authentication

### How It Works

1. **Role-Based Access**: Users have a `role` field in the `profiles` table
   - Default: `'user'`
   - Admin: `'admin'`

2. **Auto-Redirect**: When an admin logs in, they are automatically redirected to `/admin`

3. **Route Protection**: All `/admin/*` routes are protected by `AdminGuard`
   - Only users with `role = 'admin'` can access
   - Non-admins are redirected to the main app

## 👤 User Management

### Viewing Users

- Navigate to `/admin/users`
- See all registered users
- View their roles, names, and creation dates

### Editing Users

- Click "Edit" on any user
- Update name and role
- Changes are saved immediately

### Creating Users

**IMPORTANT**: User creation requires the Supabase service role key, which should NEVER be exposed to the frontend.

To create users, you need to:

1. **Option A: Use Supabase Dashboard**
   - Go to Authentication → Users → Add User
   - Manually create the user
   - Then update their profile role if needed

2. **Option B: Create a Secure Edge Function** (Recommended)
   - Create a Supabase Edge Function
   - Use the service role key server-side
   - Expose a secure endpoint for user creation
   - See `src/services/adminUserService.ts` for the interface

## 🪙 Metal Rates Management

### How Admin Rates Work

1. **Priority**: Admin rates override API rates
   - If an admin rate exists for a date → use admin rate
   - If no admin rate → fall back to API rate

2. **Date Flexibility**: Admin can add rates for:
   - Past dates (historical corrections)
   - Present date (override current API rate)
   - Future dates (planned estimates)

3. **Uniqueness**: One rate per:
   - Metal (gold/silver)
   - Purity (24k/22k/999)
   - Date

### Adding Rates

1. Navigate to `/admin/metal-rates`
2. Click "Add Rate"
3. Fill in:
   - Metal: Gold or Silver
   - Purity: 24K, 22K, or 999 (for silver)
   - Price per Gram: Enter in ₹ (or your currency)
   - Date: Select any date (past, present, or future)
4. Click "Add Rate"

### Editing Rates

- Click "Edit" on any rate
- Modify the values
- Click "Update Rate"

### Deleting Rates

- Click "Delete" on any rate
- Confirm deletion
- Rate is removed and API rate will be used instead

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS policies:

**profiles table:**
- Users can read their own profile
- Admins can read all profiles
- Admins can update all profiles
- Admins can insert profiles (for user creation)

**metal_rates table:**
- Everyone can read rates (users need to see them)
- Only admins can insert/update/delete rates

### Frontend Protection

- `AdminGuard` component checks admin role before rendering
- Non-admins are redirected automatically
- All admin operations use Supabase RLS for server-side validation

## 📋 Admin Routes

- `/admin` - Dashboard (overview)
- `/admin/users` - User management
- `/admin/metal-rates` - Metal rates management

## 🚨 Important Notes

1. **Service Role Key**: Never expose the Supabase service role key to the frontend. User creation must be done via a secure backend endpoint.

2. **Profile Tables**: There are two profile tables:
   - `profiles` - For admin roles (created by migration 003)
   - `users_profile` - For user settings (currency, income, etc.) - already exists

3. **Rate Override**: Admin rates completely override API rates for that specific date. If you delete an admin rate, the API rate will be used again.

4. **Date Format**: All dates are stored as `DATE` type (YYYY-MM-DD). The frontend handles timezone conversion.

## 🧪 Testing

1. **Create Admin User**:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';
   ```

2. **Login**: Login with the admin user account

3. **Verify Redirect**: You should be automatically redirected to `/admin`

4. **Test Routes**: Try accessing `/admin/users` and `/admin/metal-rates`

5. **Test Rate Override**: 
   - Add an admin rate for today
   - Check the main app's market rates
   - Should show the admin rate instead of API rate

## 🐛 Troubleshooting

### "Access Denied" Error

- Check if user has `role = 'admin'` in the `profiles` table
- Verify RLS policies are correctly set up
- Check browser console for errors

### Rates Not Showing

- Verify admin rate was created successfully
- Check the date format (should be YYYY-MM-DD)
- Verify RLS allows reading from `metal_rates` table

### User Creation Fails

- This is expected - user creation requires service role key
- Use Supabase Dashboard or create an edge function
- See `src/services/adminUserService.ts` for interface

## 📝 Next Steps

1. Run the migration: `supabase/migrations/003_admin_schema.sql`
2. Set your user as admin (see Step 2 above)
3. Login and verify redirect to `/admin`
4. Start managing users and rates!
