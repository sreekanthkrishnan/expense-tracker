import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadGoals, saveGoal, deleteGoal, calculateGoalFeasibility } from '../store/slices/savingsGoalSlice';
import type { SavingsGoal, GoalPriority, GoalStatus, InvestmentType } from '../types';
import { calculateInvestmentGrowth } from '../utils/market/calculateInvestmentGrowth';
import type { GrowthPrediction } from '../utils/market/types';
import Modal from './Modal';
import { Icon } from './common/Icon';
import MarketRates from './MarketRates';

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
    investmentType: undefined,
    investmentMeta: undefined,
  });
  const [growthPredictions, setGrowthPredictions] = useState<{ [goalId: string]: GrowthPrediction | null }>({});

  const currency = profile?.currency || 'USD';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency;

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
      investmentType: formData.investmentType,
      investmentMeta: formData.investmentMeta,
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
      investmentType: undefined,
      investmentMeta: undefined,
    });
    setEditingGoal(null);
    setShowForm(false);
  };

  // Load growth predictions for investment goals
  useEffect(() => {
    const loadPredictions = async () => {
      const predictions: { [goalId: string]: GrowthPrediction | null } = {};
      for (const goal of goals) {
        if (goal.investmentType) {
          try {
            const prediction = await calculateInvestmentGrowth(goal, currency);
            predictions[goal.id] = prediction;
          } catch (error) {
            console.warn(`Failed to calculate growth for goal ${goal.id}:`, error);
            predictions[goal.id] = null;
          }
        }
      }
      setGrowthPredictions(predictions);
    };

    if (goals.length > 0) {
      loadPredictions();
    }
  }, [goals, currency]);

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

  const getStatusColor = (status?: GoalStatus) => {
    switch (status) {
      case 'Achievable':
        return 'bg-brand-yellow bg-opacity-20 text-brand-dark-purple';
      case 'Achievable with cuts':
        return 'bg-brand-yellow bg-opacity-30 text-brand-dark-purple';
      case 'Unrealistic':
        return 'bg-brand-pink bg-opacity-20 text-brand-pink';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInvestmentTypeLabel = (type?: InvestmentType): string => {
    const labels: { [key in InvestmentType]: string } = {
      gold: '🟨 Gold',
      silver: '⚪ Silver',
      mutual_fund: '📈 Mutual Fund',
      fd: '🏦 Fixed Deposit',
      rd: '💰 Recurring Deposit',
      index_fund: '📊 Index Fund',
      custom: '⚙️ Custom',
    };
    return type ? labels[type] : 'Regular Savings';
  };

  const getRiskLevelColor = (riskLevel?: 'Low' | 'Medium' | 'High'): string => {
    switch (riskLevel) {
      case 'Low':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      {/* Market Rates Section */}
      <div className="mb-6">
        <MarketRates />
      </div>

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
              <Icon name="Target" size={48} className="text-gray-400 opacity-50" />
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
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                  {goal.investmentType && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {getInvestmentTypeLabel(goal.investmentType)}
                    </span>
                  )}
                </div>
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

              {/* Growth Prediction for Investment Goals */}
              {goal.investmentType && growthPredictions[goal.id] && (
                <div className="pt-4 border-t border-gray-200 mb-4">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-900">Growth Prediction</span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getRiskLevelColor(growthPredictions[goal.id]?.riskLevel)}`}>
                        {growthPredictions[goal.id]?.riskLevel || 'N/A'} Risk
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Predicted Value:</span>
                        <span className="font-semibold text-gray-900">
                          {currencySymbol}
                          {growthPredictions[goal.id]?.predictedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Growth:</span>
                        <span className="font-semibold text-green-600">
                          +{growthPredictions[goal.id]?.growthPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Annual Return:</span>
                        <span className="font-semibold text-gray-900">
                          {growthPredictions[goal.id]?.annualReturnRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 italic">
                      {growthPredictions[goal.id]?.disclaimer}
                    </p>
                  </div>
                </div>
              )}

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
            <label htmlFor="investment-type" className="block text-sm font-medium text-gray-700 mb-2">
              Investment Type (Optional)
            </label>
            <select
              id="investment-type"
              value={formData.investmentType || ''}
              onChange={(e) => {
                const type = e.target.value as InvestmentType | '';
                setFormData({
                  ...formData,
                  investmentType: type || undefined,
                  investmentMeta: type ? formData.investmentMeta : undefined,
                });
              }}
              className="input"
            >
              <option value="">Regular Savings</option>
              <option value="gold">🟨 Gold</option>
              <option value="silver">⚪ Silver</option>
              <option value="mutual_fund">📈 Mutual Fund</option>
              <option value="fd">🏦 Fixed Deposit</option>
              <option value="rd">💰 Recurring Deposit</option>
              <option value="index_fund">📊 Index Fund</option>
              <option value="custom">⚙️ Custom</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select an investment type to enable growth predictions based on market data
            </p>
          </div>

          {/* Investment Metadata Fields */}
          {formData.investmentType && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-4">
              <h4 className="text-sm font-semibold text-blue-900">Investment Details</h4>
              
              {(formData.investmentType === 'mutual_fund' || formData.investmentType === 'index_fund') && (
                <div>
                  <label htmlFor="fund-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Fund Name
                  </label>
                  <input
                    type="text"
                    id="fund-name"
                    value={formData.investmentMeta?.fundName || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        investmentMeta: {
                          ...formData.investmentMeta,
                          fundName: e.target.value,
                        },
                      })
                    }
                    className="input"
                    placeholder="e.g., HDFC Equity Fund"
                  />
                </div>
              )}

              {(formData.investmentType === 'fd' || formData.investmentType === 'rd') && (
                <div>
                  <label htmlFor="tenure-months" className="block text-sm font-medium text-gray-700 mb-2">
                    Tenure (Months)
                  </label>
                  <input
                    type="number"
                    id="tenure-months"
                    value={formData.investmentMeta?.tenureMonths || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        investmentMeta: {
                          ...formData.investmentMeta,
                          tenureMonths: parseInt(e.target.value) || undefined,
                        },
                      })
                    }
                    className="input"
                    placeholder="e.g., 12, 24, 36"
                    min="1"
                  />
                </div>
              )}

              {formData.investmentType === 'custom' && (
                <div>
                  <label htmlFor="expected-return" className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Annual Return Rate (%)
                  </label>
                  <input
                    type="number"
                    id="expected-return"
                    value={formData.investmentMeta?.expectedReturnRate || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        investmentMeta: {
                          ...formData.investmentMeta,
                          expectedReturnRate: parseFloat(e.target.value) || undefined,
                        },
                      })
                    }
                    className="input"
                    placeholder="e.g., 8.5"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              )}

              {(formData.investmentType === 'mutual_fund' || formData.investmentType === 'index_fund') && (
                <div>
                  <label htmlFor="expected-return-mf" className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Annual Return Rate (%) <span className="text-gray-500 text-xs">(Optional - will use fund's historical CAGR if available)</span>
                  </label>
                  <input
                    type="number"
                    id="expected-return-mf"
                    value={formData.investmentMeta?.expectedReturnRate || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        investmentMeta: {
                          ...formData.investmentMeta,
                          expectedReturnRate: parseFloat(e.target.value) || undefined,
                        },
                      })
                    }
                    className="input"
                    placeholder="e.g., 12.0"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              )}
            </div>
          )}

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

