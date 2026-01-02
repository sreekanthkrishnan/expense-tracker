import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadExpenses, saveExpense, deleteExpense, addCategory } from '../store/slices/expenseSlice';
import type { Expense } from '../types';
import Modal from './Modal';

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
  const categoryTotals = expenses
    .filter((expense) => {
      const date = new Date(expense.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

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
      {Object.keys(categoryTotals).length > 0 && (
        <div className="card mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Category Breakdown (This Month)</h3>
          <div className="space-y-3">
            {[...Object.entries(categoryTotals)]
              .sort(([, a], [, b]) => b - a)
              .map(([category, total]) => (
                <div key={category} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-medium text-gray-700">{category}</span>
                  <span className="text-sm text-money status-expense">
                    {currencySymbol}
                    {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
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
            <div className="empty-state-icon">💸</div>
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

