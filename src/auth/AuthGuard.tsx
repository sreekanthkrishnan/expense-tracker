/**
 * AuthGuard Component
 * 
 * Protects routes that require authentication.
 * Redirects unauthenticated users to the login page.
 * 
 * SECURITY: This component ensures only authenticated users can access
 * the main application and their data.
 */

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { initializeAuth, setSession } from '../store/slices/authSlice';
import { supabase } from '../lib/supabaseClient';
import Login from './Login';
import Signup from './Signup';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const dispatch = useAppDispatch();
  const { user, initialized } = useAppSelector((state) => state.auth);
  const [showSignup, setShowSignup] = useState(false);

  console.log('user', user);

  useEffect(() => {
    // Initialize auth state on mount
    dispatch(initializeAuth());

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Update state immediately with session data
          if (session) {
            dispatch(setSession(session));
          }
          // Then reinitialize to ensure consistency
          dispatch(initializeAuth());
        } else if (event === 'SIGNED_OUT') {
          dispatch(initializeAuth());
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  // Show loading state while initializing
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 mx-auto" style={{ borderColor: 'var(--color-background-dark)', borderTopColor: 'var(--color-primary)' }} />
          <p className="mt-4 text-sm sm:text-base" style={{ color: 'var(--color-primary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth pages if user is not authenticated
  if (!user) {
    return (
      <>
        {showSignup ? (
          <div>
            <Signup />
            <div className="text-center mt-4">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setShowSignup(false)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        ) : (
          <div>
            <Login />
            <div className="text-center mt-4">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setShowSignup(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // User is authenticated, render the app
  return <>{children}</>;
};

export default AuthGuard;
