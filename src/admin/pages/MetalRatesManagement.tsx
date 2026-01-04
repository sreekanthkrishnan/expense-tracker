/**
 * Metal Rates Management Page
 * 
 * Admin can add, edit, and delete gold/silver rates for any date.
 */

import { useEffect, useState } from 'react';
import {
  getAllAdminRates,
  createAdminRate,
  updateAdminRate,
  deleteAdminRate,
  checkRateExists,
  type MetalRate,
  type CreateMetalRateInput,
} from '../../services/metalRateService';
import { Icon } from '../../components/common/Icon';
import Modal from '../../components/Modal';

const MetalRatesManagement = () => {
  const [rates, setRates] = useState<MetalRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRate, setEditingRate] = useState<MetalRate | null>(null);
  const [formData, setFormData] = useState<CreateMetalRateInput>({
    metal: 'gold',
    purity: '24k',
    price_per_gram: 0,
    date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setLoading(true);
      const data = await getAllAdminRates();
      setRates(data);
    } catch (error) {
      console.error('Error loading rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRate(null);
    setFormData({
      metal: 'gold',
      purity: '24k',
      price_per_gram: 0,
      date: new Date().toISOString().split('T')[0],
    });
    setError(null);
    setShowAddModal(true);
  };

  const handleEdit = (rate: MetalRate) => {
    setEditingRate(rate);
    setFormData({
      metal: rate.metal,
      purity: rate.purity,
      price_per_gram: rate.price_per_gram,
      date: rate.date,
    });
    setError(null);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rate?')) {
      return;
    }

    try {
      await deleteAdminRate(id);
      await loadRates();
    } catch (error) {
      console.error('Error deleting rate:', error);
      alert('Failed to delete rate. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Check if rate already exists (for new rates)
      if (!editingRate) {
        const exists = await checkRateExists(
          formData.metal,
          formData.purity,
          formData.date
        );
        if (exists) {
          setError(`A rate already exists for ${formData.metal} ${formData.purity} on ${formData.date}. Please edit the existing rate instead.`);
          return;
        }
      }

      if (editingRate) {
        await updateAdminRate(editingRate.id, formData);
      } else {
        await createAdminRate(formData);
      }

      setShowAddModal(false);
      await loadRates();
    } catch (error: any) {
      setError(error.message || 'Failed to save rate. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader" size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Metal Rates Management</h1>
        <button
          onClick={handleAdd}
          className="btn-primary flex items-center gap-2"
        >
          <Icon name="Plus" size={16} />
          Add Rate
        </button>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Admin rates override API rates:</strong> When an admin rate exists for a specific date,
          it will be used instead of the API rate. This allows you to manually control rates when needed.
        </p>
        <p className="mt-2 text-xs text-blue-700">
          If no admin rate exists for today, the system will automatically use API rates.
        </p>
      </div>

      {/* Rates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Metal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price/Gram
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rates.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No admin rates found. Click "Add Rate" to create one.
                </td>
              </tr>
            ) : (
              rates.map((rate) => (
                <tr key={rate.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(rate.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {rate.metal}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 uppercase">
                    {rate.purity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ₹{rate.price_per_gram.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {rate.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(rate.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(rate)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rate.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setError(null);
        }}
        title={editingRate ? 'Edit Metal Rate' : 'Add Metal Rate'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metal
            </label>
            <select
              value={formData.metal}
              onChange={(e) => setFormData({ ...formData, metal: e.target.value as 'gold' | 'silver' })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purity
            </label>
            <select
              value={formData.purity}
              onChange={(e) => setFormData({ ...formData, purity: e.target.value as '24k' | '22k' | '999' })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="24k">24K</option>
              <option value="22k">22K</option>
              <option value="999">999 (Silver)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price per Gram (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price_per_gram}
              onChange={(e) => setFormData({ ...formData, price_per_gram: parseFloat(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date (can be past, present, or future)
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              {editingRate ? 'Update Rate' : 'Add Rate'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setError(null);
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MetalRatesManagement;
