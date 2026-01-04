/**
 * Admin Guard Component
 * 
 * Protects admin routes - only allows access to users with admin role.
 * Redirects non-admin users to the main app.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { isAdmin } from '../services/profileService';
import { Icon } from '../components/common/Icon';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const navigate = useNavigate();
  const { user, initialized } = useAppSelector((state) => state.auth);
  const [checking, setChecking] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!initialized) {
        return; // Wait for auth to initialize
      }

      if (!user) {
        // Not logged in - redirect to login
        navigate('/');
        return;
      }

      // Check if user is admin
      const adminStatus = await isAdmin();
      setIsUserAdmin(adminStatus);
      setChecking(false);

      if (!adminStatus) {
        // Not an admin - redirect to main app
        console.warn('Access denied: User is not an admin');
        navigate('/');
      }
    };

    checkAdminAccess();
  }, [user, initialized, navigate]);

  if (!initialized || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Icon name="Loader" size={32} className="animate-spin mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Icon name="AlertTriangle" size={48} className="mx-auto mb-4 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You do not have permission to access this area.</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go to Main App
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
