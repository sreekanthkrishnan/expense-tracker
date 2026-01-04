/**
 * Admin Routes Component
 * 
 * Defines all admin routes with AdminGuard protection.
 */

import { Routes, Route } from 'react-router-dom';
import AdminGuard from './AdminGuard';
import AdminLayout from './AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import UsersManagement from './pages/UsersManagement';
import MetalRatesManagement from './pages/MetalRatesManagement';

const AdminRoutes = () => {
  return (
    <AdminGuard>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/users" element={<UsersManagement />} />
          <Route path="/metal-rates" element={<MetalRatesManagement />} />
        </Routes>
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminRoutes;
