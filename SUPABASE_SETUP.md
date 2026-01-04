# Supabase Integration Setup Guide

This guide will help you set up Supabase as the backend for your expense tracker application.

## 📋 Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed
3. Your expense tracker project cloned locally

## 🚀 Step-by-Step Setup

### 1. Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: expense-tracker (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait for setup (2-3 minutes)

### 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   ⚠️ **Important**: Only use the `anon` key, never the `service_role` key in frontend code!

### 4. Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL editor
5. Click "Run" (or press Cmd/Ctrl + Enter)

This will create:
- All necessary tables (incomes, expenses, loans, savings, users_profile)
- Row Level Security (RLS) policies for data isolation
- Indexes for performance
- Triggers for automatic timestamp updates

### 5. Verify RLS is Enabled

1. Go to **Table Editor** in Supabase dashboard
2. Check each table (incomes, expenses, loans, savings, users_profile)
3. Ensure "Enable RLS" is checked (should be green)
4. If not, click the toggle to enable it

### 6. Test the Application

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open the app in your browser
4. You should see the login/signup page
5. Create a new account and test the app!

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS policies that ensure:
- Users can only **view** their own data
- Users can only **insert** their own data
- Users can only **update** their own data
- Users can only **delete** their own data

The `user_id` is automatically set from `auth.uid()` - never accept it from client input!

### Authentication Flow

1. **Signup**: Creates a new user in Supabase Auth
2. **Login**: Authenticates with email/password
3. **Session**: Automatically persisted and refreshed
4. **Logout**: Clears session and redirects to login

## 📊 Database Schema

### Tables Created

- **users_profile**: User profile information
- **incomes**: Income records
- **expenses**: Expense records
- **loans**: Loan records
- **savings**: Savings goals

All tables include:
- `user_id` UUID (references `auth.users`)
- `created_at` and `updated_at` timestamps
- Proper indexes for performance

## 🛠️ Troubleshooting

### "Missing Supabase environment variables" error

- Check that `.env` file exists
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart your dev server after changing `.env`

### "Failed to fetch" errors

- Verify RLS is enabled on all tables
- Check that SQL migration ran successfully
- Ensure you're using the correct Supabase URL and anon key

### "User not authenticated" errors

- Check that user is logged in
- Verify session is valid in Supabase dashboard (Authentication → Users)
- Try logging out and back in

### Data not showing up

- Check browser console for errors
- Verify RLS policies are correct
- Ensure `user_id` matches the authenticated user's ID

## 📝 Next Steps

1. **Customize RLS policies** if needed (in Supabase dashboard → Authentication → Policies)
2. **Add email verification** (optional, in Supabase dashboard → Authentication → Settings)
3. **Set up backups** (Supabase automatically backs up, but you can configure schedules)
4. **Monitor usage** (Supabase dashboard → Settings → Usage)

## 🎯 Production Deployment

Before deploying to production:

1. Update `.env` with production Supabase credentials
2. Ensure RLS is enabled on all tables
3. Test authentication flow thoroughly
4. Set up proper error monitoring
5. Configure CORS if needed (Supabase dashboard → Settings → API)

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)

---

**Need Help?** Check the Supabase dashboard logs or the browser console for detailed error messages.
