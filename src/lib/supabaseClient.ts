/**
 * Supabase Client Configuration
 * 
 * This file initializes the Supabase client using environment variables.
 * 
 * SECURITY NOTES:
 * - Only uses PUBLIC anon key (safe for frontend)
 * - Never use service_role key in frontend code
 * - Row Level Security (RLS) policies enforce data isolation
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

/**
 * Supabase client instance
 * 
 * This client is used for all database operations and authentication.
 * RLS policies automatically filter data based on the authenticated user.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
