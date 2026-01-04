import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadExpenses, saveExpense, deleteExpense, addCategory } from '../store/slices/expenseSlice';
import type { Expense } from '../types';
import Modal from './Modal';
import { Icon } from './common/Icon';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const ExpenseModule = () => {
  const dispatch = useAppDispatch();
  const { expenses, categories } = useAppSelector((state) => state.expense);
  const { profile } = useAppSelector((state) => state.profile);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [formData, setFormData] = useState<Partial<Expense>>({
    amount: 0,
    category: categories[0] || '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes: '',
  });

  useEffect(() => {
    dispatch(loadExpenses());
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expense: Expense = {
      id: editingExpense?.id || `expense-${Date.now()}`,
      amount: formData.amount || 0,
      category: formData.category || categories[0],
      date: formData.date || new Date().toISOString().split('T')[0],
      paymentMethod: formData.paymentMethod || 'Cash',
      notes: formData.notes,
    };
    dispatch(saveExpense(expense));
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      amount: 0,
      category: categories[0] || '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      notes: '',
    });
    setEditingExpense(null);
    setShowForm(false);
    setNewCategory('');
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData(expense);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      dispatch(deleteExpense(id));
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      dispatch(addCategory(newCategory.trim()));
      setFormData({ ...formData, category: newCategory.trim() });
      setNewCategory('');
    }
  };

  const currency = profile?.currency || 'USD';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency;

  const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI', 'Other'];

  // Calculate monthly total
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTotal = expenses
    .filter((expense) => {
      const date = new Date(expense.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown
  const categoryTotals = useMemo(() => {
    return expenses
      .filter((expense) => {
        const date = new Date(expense.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [expenses, currentMonth, currentYear]);

  // Chart data for visualization
  const categoryChartData = useMemo(() => {
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [categoryTotals]);

  // Chart colors
  const CHART_COLORS = [
    'var(--color-expense)',
    'var(--color-primary)',
    'var(--color-active)',
    'var(--color-warning)',
    'var(--color-income)',
    'var(--color-savings)',
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Expenses</h2>
          <p className="text-sm text-gray-600">Track your spending</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary w-full sm:w-auto"
          aria-label="Add new expense"
        >
          <span className="mr-2">+</span> Add Expense
        </button>
      </div>

      {/* Summary Card */}
      <div className="card mb-6">
        <p className="text-xs sm:text-sm text-gray-600 mb-1.5">Monthly Expenses</p>
        <p className="text-money-lg status-expense">
          {currencySymbol}
          {monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Category Breakdown */}
      {categoryChartData.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Category Breakdown (This Month)</h3>
          
          {/* Bar Chart */}
          <div className="mb-6">
            <div className="w-full" style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }} 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} width={60} />
                  <Tooltip 
                    formatter={(value: number | undefined) => value !== undefined ? `${currencySymbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="var(--color-expense)" 
                    radius={[8, 8, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={400}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category List with Details */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Category Details</h4>
            {categoryChartData.map((item, index) => {
              const percentage = (item.value / monthlyTotal) * 100;
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                      <span className="text-sm text-money status-expense font-semibold">
                        {currencySymbol}
                        {item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                      }}
                      role="progressbar"
                      aria-valuenow={percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="expense-amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                id="expense-amount"
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
            <label htmlFor="expense-category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="expense-category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input mb-2"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Add new category"
                className="input flex-1"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="btn-secondary"
                disabled={!newCategory.trim()}
              >
                Add
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="expense-date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              id="expense-date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
              required
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="expense-payment" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              id="expense-payment"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="input"
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="expense-notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="expense-notes"
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
              {editingExpense ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Expense List - Mobile card view, Desktop table view */}
      {expenses.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Icon name="TrendingDown" size={48} className="text-gray-400 opacity-50" />
            <p className="empty-state-text mb-2">No expenses yet</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
              Add Your First Expense
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {[...expenses]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((expense) => (
                <div key={expense.id} className="card">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{expense.category}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(expense.date).toLocaleDateString()} • {expense.paymentMethod}
                      </p>
                    </div>
                    <p className="text-money status-expense ml-2">
                      {currencySymbol}
                      {expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  {expense.notes && (
                    <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-100">{expense.notes}</p>
                  )}
                  <div className="flex justify-end space-x-3 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium min-h-[44px] min-w-[44px] flex items-center"
                      aria-label={`Edit ${expense.category} expense`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium min-h-[44px] min-w-[44px] flex items-center"
                      aria-label={`Delete ${expense.category} expense`}
                    >
                      Delete
                    </button>
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
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...expenses]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {expense.category}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-money status-expense">
                        {currencySymbol}
                        {expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {expense.paymentMethod}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-700 font-medium min-h-[44px] min-w-[44px]"
                          aria-label={`Edit ${expense.category} expense`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-700 font-medium min-h-[44px] min-w-[44px]"
                          aria-label={`Delete ${expense.category} expense`}
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

export default ExpenseModule;

