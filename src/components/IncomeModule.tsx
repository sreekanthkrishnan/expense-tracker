import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadIncomes, saveIncome, deleteIncome } from '../store/slices/incomeSlice';
import type { Income, IncomeType } from '../types';
import Modal from './Modal';
import { Icon } from './common/Icon';

const IncomeModule = () => {
  const dispatch = useAppDispatch();
  const { incomes } = useAppSelector((state) => state.income);
  const { profile } = useAppSelector((state) => state.profile);
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [formData, setFormData] = useState<Partial<Income>>({
    amount: 0,
    type: 'one-time',
    source: '',
    date: new Date().toISOString().split('T')[0],
    recurringFrequency: 'monthly',
  });

  useEffect(() => {
    dispatch(loadIncomes());
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const income: Income = {
      id: editingIncome?.id || `income-${Date.now()}`,
      amount: formData.amount || 0,
      type: formData.type || 'one-time',
      source: formData.source || '',
      date: formData.date || new Date().toISOString().split('T')[0],
      recurringFrequency: formData.type === 'recurring' ? formData.recurringFrequency : undefined,
      notes: formData.notes,
    };
    dispatch(saveIncome(income));
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      amount: 0,
      type: 'one-time',
      source: '',
      date: new Date().toISOString().split('T')[0],
      recurringFrequency: 'monthly',
    });
    setEditingIncome(null);
    setShowForm(false);
  };

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    setFormData(income);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this income?')) {
      dispatch(deleteIncome(id));
    }
  };

  const currency = profile?.currency || 'USD';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency;

  // Calculate monthly and yearly totals
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTotal = incomes
    .filter((income) => {
      const date = new Date(income.date);
      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear &&
        income.type === 'one-time'
      );
    })
    .reduce((sum, i) => sum + i.amount, 0);

  const recurringMonthly = incomes
    .filter((income) => income.type === 'recurring' && income.recurringFrequency === 'monthly')
    .reduce((sum, i) => sum + i.amount, 0);

  const yearlyTotal = incomes
    .filter((income) => {
      const date = new Date(income.date);
      return date.getFullYear() === currentYear && income.type === 'one-time';
    })
    .reduce((sum, i) => sum + i.amount, 0);

  const recurringYearly = incomes
    .filter((income) => income.type === 'recurring' && income.recurringFrequency === 'yearly')
    .reduce((sum, i) => sum + i.amount / 12, 0);

  const totalMonthly = monthlyTotal + recurringMonthly + recurringYearly;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Income</h2>
          <p className="text-sm text-gray-600">Track your income sources</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary w-full sm:w-auto"
          aria-label="Add new income"
        >
          <span className="mr-2">+</span> Add Income
        </button>
      </div>

      {/* Summary Cards - Improved mobile layout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-600 mb-1.5">Monthly Income</p>
          <p className="text-money-lg status-income">
            {currencySymbol}
            {totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-600 mb-1.5">Yearly Income</p>
          <p className="text-money-lg text-gray-900">
            {currencySymbol}
            {(yearlyTotal + recurringMonthly * 12 + recurringYearly * 12).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card">
          <p className="text-xs sm:text-sm text-gray-600 mb-1.5">Recurring Monthly</p>
          <p className="text-money-lg text-gray-900">
            {currencySymbol}
            {(recurringMonthly + recurringYearly).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingIncome ? 'Edit Income' : 'Add Income'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="income-source" className="block text-sm font-medium text-gray-700 mb-2">
              Source
            </label>
            <input
              type="text"
              id="income-source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="input"
              placeholder="e.g., Salary, Freelance"
              required
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="income-amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                id="income-amount"
                value={formData.amount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                className="input pl-8"
                placeholder="0.00"
                required
                min="0"
                step="0.01"
                aria-required="true"
              />
            </div>
          </div>
          <div>
            <label htmlFor="income-type" className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              id="income-type"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as IncomeType })
              }
              className="input"
            >
              <option value="one-time">One-time</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>
          {formData.type === 'recurring' && (
            <div>
              <label htmlFor="income-frequency" className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <select
                id="income-frequency"
                value={formData.recurringFrequency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    recurringFrequency: e.target.value as 'monthly' | 'yearly',
                  })
                }
                className="input"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}
          <div>
            <label htmlFor="income-date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              id="income-date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
              required
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="income-notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="income-notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {editingIncome ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Income List - Mobile card view, Desktop table view */}
      {incomes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Icon name="TrendingUp" size={48} className="text-gray-400 opacity-50" />
            <p className="empty-state-text mb-2">No income records yet</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
              Add Your First Income
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {[...incomes]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((income) => (
                <div key={income.id} className="card">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{income.source}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(income.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-money status-income ml-2">
                      {currencySymbol}
                      {income.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-600">
                      {income.type === 'recurring'
                        ? `🔄 Recurring (${income.recurringFrequency})`
                        : '📅 One-time'}
                    </span>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleEdit(income)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium min-h-[44px] min-w-[44px] flex items-center"
                        aria-label={`Edit ${income.source}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(income.id)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium min-h-[44px] min-w-[44px] flex items-center"
                        aria-label={`Delete ${income.source}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block card overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...incomes]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((income) => (
                    <tr key={income.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {income.source}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-money status-income">
                        {currencySymbol}
                        {income.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {income.type === 'recurring'
                          ? `🔄 Recurring (${income.recurringFrequency})`
                          : '📅 One-time'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(income.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleEdit(income)}
                          className="text-blue-600 hover:text-blue-700 font-medium min-h-[44px] min-w-[44px]"
                          aria-label={`Edit ${income.source}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(income.id)}
                          className="text-red-600 hover:text-red-700 font-medium min-h-[44px] min-w-[44px]"
                          aria-label={`Delete ${income.source}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default IncomeModule;

