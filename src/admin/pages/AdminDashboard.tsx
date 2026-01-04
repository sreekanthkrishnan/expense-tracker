/**
 * Admin Dashboard Page
 * 
 * Main dashboard showing overview statistics.
 */

import { useEffect, useState } from 'react';
import { getAllUsers } from '../../services/adminUserService';
import { getAllAdminRates } from '../../services/metalRateService';
import { Icon } from '../../components/common/Icon';
import type { UserProfile } from '../../services/profileService';
import type { MetalRate } from '../../services/metalRateService';

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [rates, setRates] = useState<MetalRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, ratesData] = await Promise.all([
          getAllUsers(),
          getAllAdminRates(),
        ]);
        setUsers(usersData);
        setRates(ratesData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader" size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;
  const goldRates = rates.filter(r => r.metal === 'gold').length;
  const silverRates = rates.filter(r => r.metal === 'silver').length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <Icon name="User" size={32} className="text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
            </div>
            <Icon name="User" size={32} className="text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Regular Users</p>
              <p className="text-2xl font-bold text-gray-900">{userCount}</p>
            </div>
            <Icon name="User" size={32} className="text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admin Rates</p>
              <p className="text-2xl font-bold text-gray-900">{rates.length}</p>
            </div>
            <Icon name="Dollar" size={32} className="text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Metal Rates Breakdown</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Gold Rates</span>
              <span className="font-semibold">{goldRates}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Silver Rates</span>
              <span className="font-semibold">{silverRates}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <p className="text-sm text-gray-600">
            View detailed information in the Users and Metal Rates sections.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
