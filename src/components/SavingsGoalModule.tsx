import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadGoals, saveGoal, deleteGoal, calculateGoalFeasibility } from '../store/slices/savingsGoalSlice';
import type { SavingsGoal, GoalPriority, GoalStatus } from '../types';
import Modal from './Modal';

const SavingsGoalModule = () => {
  const dispatch = useAppDispatch();
  const { goals } = useAppSelector((state) => state.savingsGoal);
  const { expenses } = useAppSelector((state) => state.expense);
  const { profile } = useAppSelector((state) => state.profile);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [formData, setFormData] = useState<Partial<SavingsGoal>>({
    name: '',
    targetAmount: 0,
    targetDate: '',
    currentSavings: 0,
    priority: 'Medium',
  });

  useEffect(() => {
    dispatch(loadGoals());
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monthlyIncome = profile?.monthlyIncome || 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyExpenses = expenses
      .filter((e) => {
        const date = new Date(e.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const goal: SavingsGoal = {
      id: editingGoal?.id || `goal-${Date.now()}`,
      name: formData.name || '',
      targetAmount: formData.targetAmount || 0,
      targetDate: formData.targetDate || '',
      currentSavings: formData.currentSavings || 0,
      priority: formData.priority || 'Medium',
    };

    const feasibility = calculateGoalFeasibility(goal, monthlyIncome, monthlyExpenses);
    goal.monthlySavingRequired = feasibility.monthlySavingRequired;
    goal.feasibilityScore = feasibility.feasibilityScore;
    goal.status = feasibility.status;

    dispatch(saveGoal(goal));
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: 0,
      targetDate: '',
      currentSavings: 0,
      priority: 'Medium',
    });
    setEditingGoal(null);
    setShowForm(false);
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData(goal);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      dispatch(deleteGoal(id));
    }
  };

  const currency = profile?.currency || 'USD';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency;

  const getStatusColor = (status?: GoalStatus) => {
    switch (status) {
      case 'Achievable':
        return 'bg-green-100 text-green-800';
      case 'Achievable with cuts':
        return 'bg-yellow-100 text-yellow-800';
      case 'Unrealistic':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Savings Goals</h2>
          <p className="text-sm text-gray-600">Set and track your financial goals</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary w-full sm:w-auto"
          aria-label="Add new savings goal"
        >
          <span className="mr-2">+</span> Add Goal
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.length === 0 ? (
          <div className="col-span-full card">
            <div className="empty-state">
              <div className="empty-state-icon">🎯</div>
              <p className="empty-state-text mb-2">No savings goals yet</p>
              <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
                Create Your First Goal
              </button>
            </div>
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    goal.status
                  )}`}
                >
                  {goal.status || 'Calculating...'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ease-out ${
                      (goal.currentSavings / goal.targetAmount) * 100 >= 100
                        ? 'bg-green-500'
                        : (goal.currentSavings / goal.targetAmount) * 100 >= 50
                        ? 'bg-blue-500'
                        : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(100, (goal.currentSavings / goal.targetAmount) * 100)}%` }}
                    role="progressbar"
                    aria-valuenow={goal.currentSavings}
                    aria-valuemin={0}
                    aria-valuemax={goal.targetAmount}
                    aria-label={`${goal.name} progress: ${((goal.currentSavings / goal.targetAmount) * 100).toFixed(0)}%`}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{((goal.currentSavings / goal.targetAmount) * 100).toFixed(0)}% Complete</span>
                  <span>{new Date(goal.targetDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Target:</span>
                  <span className="text-sm font-semibold text-gray-900 text-money">
                    {currencySymbol}
                    {goal.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Current:</span>
                  <span className="text-sm font-semibold text-gray-900 text-money">
                    {currencySymbol}
                    {goal.currentSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Remaining:</span>
                  <span className="text-sm font-semibold status-expense text-money">
                    {currencySymbol}
                    {(goal.targetAmount - goal.currentSavings).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {goal.monthlySavingRequired && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600">Monthly Required:</span>
                      <span className="text-sm font-semibold status-savings text-money">
                        {currencySymbol}
                        {goal.monthlySavingRequired.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {goal.feasibilityScore !== undefined && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-600">Feasibility:</span>
                          <span className="text-xs font-medium text-gray-900">
                            {goal.feasibilityScore.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              goal.feasibilityScore >= 100
                                ? 'bg-green-500'
                                : goal.feasibilityScore >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, goal.feasibilityScore))}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(goal)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium min-h-[44px] min-w-[44px]"
                  aria-label={`Edit ${goal.name} goal`}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium min-h-[44px] min-w-[44px]"
                  aria-label={`Delete ${goal.name} goal`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingGoal ? 'Edit Savings Goal' : 'Add Savings Goal'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="goal-name" className="block text-sm font-medium text-gray-700 mb-2">
              Goal Name
            </label>
            <input
              type="text"
              id="goal-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Emergency Fund, Vacation"
              required
              aria-required="true"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="goal-target" className="block text-sm font-medium text-gray-700 mb-2">
                Target Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  id="goal-target"
                  value={formData.targetAmount || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })
                  }
                  className="input pl-8"
                  required
                  min="0"
                  step="0.01"
                  aria-required="true"
                />
              </div>
            </div>
            <div>
              <label htmlFor="goal-current" className="block text-sm font-medium text-gray-700 mb-2">
                Current Savings
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  id="goal-current"
                  value={formData.currentSavings || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, currentSavings: parseFloat(e.target.value) || 0 })
                  }
                  className="input pl-8"
                  required
                  min="0"
                  step="0.01"
                  aria-required="true"
                />
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="goal-date" className="block text-sm font-medium text-gray-700 mb-2">
              Target Date
            </label>
            <input
              type="date"
              id="goal-date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              className="input"
              required
              aria-required="true"
            />
          </div>
          <div>
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-3">
                Priority
              </legend>
              <div className="grid grid-cols-3 gap-3">
                {(['Low', 'Medium', 'High'] as GoalPriority[]).map((priority) => (
                  <label
                    key={priority}
                    className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      formData.priority === priority
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={priority}
                      checked={formData.priority === priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value as GoalPriority })
                      }
                      className="sr-only"
                      aria-label={`Priority: ${priority}`}
                    />
                    <span className={`text-sm font-medium ${formData.priority === priority ? 'text-blue-700' : 'text-gray-700'}`}>
                      {priority}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
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
              {editingGoal ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SavingsGoalModule;

