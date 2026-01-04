/**
 * Authentication Redux Slice
 * 
 * Manages authentication state and user session.
 * Integrates with Supabase Auth for user management.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: false,
  error: null,
  initialized: false,
};

// Initialize auth state from existing session
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  }
);

// Sign up with email and password
export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ email, password, name }: { email: string; password: string; name?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
        },
      },
    });
    if (error) throw error;
    return data;
  }
);

// Sign in with email and password
export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }
);

// Sign out
export const signOut = createAsyncThunk('auth/signOut', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setSession: (state, action) => {
      state.session = action.payload;
      state.user = action.payload?.user ?? null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Initialize auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload;
        state.user = action.payload?.user ?? null;
        state.initialized = true;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to initialize auth';
        state.initialized = true;
      });

    // Sign up
    builder
      .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload.session;
        state.user = action.payload.user;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to sign up';
      });

    // Sign in
    builder
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload.session;
        state.user = action.payload.user;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to sign in';
      });

    // Sign out
    builder
      .addCase(signOut.pending, (state) => {
        state.loading = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.session = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to sign out';
      });
  },
});

export const { setUser, setSession, clearError } = authSlice.actions;
export default authSlice.reducer;
