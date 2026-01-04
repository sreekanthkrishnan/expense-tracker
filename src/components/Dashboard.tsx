import { useMemo, useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { Icon } from './common/Icon';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const { profile } = useAppSelector((state) => state.profile);
  const { incomes } = useAppSelector((state) => state.income);
  const { expenses } = useAppSelector((state) => state.expense);
  const { loans } = useAppSelector((state) => state.loan);
  const { goals } = useAppSelector((state) => state.savingsGoal);

  // Get theme colors from CSS variables (updates when theme changes)
  const [themeColors, setThemeColors] = useState({
    income: '#FFCC00',
    expense: '#FF018F',
    savings: '#FFCC00',
    primary: '#FFCC00',
    active: '#2D0C62',
    warning: '#FF018F',
  });

  // Update theme colors when CSS variables change (optimized)
  useEffect(() => {
    const updateThemeColors = () => {
      const root = getComputedStyle(document.documentElement);
      const newColors = {
        income: root.getPropertyValue('--color-income').trim() || '#FFCC00',
        expense: root.getPropertyValue('--color-expense').trim() || '#FF018F',
        savings: root.getPropertyValue('--color-savings').trim() || '#FFCC00',
        primary: root.getPropertyValue('--color-primary').trim() || '#FFCC00',
        active: root.getPropertyValue('--color-active').trim() || '#2D0C62',
        warning: root.getPropertyValue('--color-warning').trim() || '#FF018F',
      };
      
      // Only update if colors actually changed
      setThemeColors((prev) => {
        if (
          prev.income === newColors.income &&
          prev.expense === newColors.expense &&
          prev.savings === newColors.savings &&
          prev.primary === newColors.primary &&
          prev.active === newColors.active &&
          prev.warning === newColors.warning
        ) {
          return prev; // No change, return previous to prevent re-render
        }
        return newColors;
      });
    };

    // Initial load
    updateThemeColors();

    // Listen for theme changes via MutationObserver (only on style attribute changes)
    const observer = new MutationObserver((mutations) => {
      // Only update if style attribute actually changed
      const hasStyleChange = mutations.some(
        (mutation) => mutation.type === 'attributes' && mutation.attributeName === 'style'
      );
      if (hasStyleChange) {
        // Debounce to avoid rapid updates
        setTimeout(updateThemeColors, 100);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
      subtree: false,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const currency = profile?.currency || 'USD';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency;

  // Calculate monthly income
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyIncome = useMemo(() => {
    const oneTime = incomes
      .filter((income) => {
        const date = new Date(income.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, i) => sum + i.amount, 0);

    const recurring = incomes
      .filter((income) => income.type === 'recurring')
      .reduce((sum, income) => {
        if (income.recurringFrequency === 'monthly') return sum + income.amount;
        if (income.recurringFrequency === 'yearly') return sum + income.amount / 12;
        return sum;
      }, 0);

    return oneTime + recurring;
  }, [incomes, currentMonth, currentYear]);

  // Calculate monthly expenses
  const monthlyExpenses = useMemo(() => {
    return expenses
      .filter((expense) => {
        const date = new Date(expense.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, currentMonth, currentYear]);

  // Calculate total EMI
  const totalEMI = useMemo(() => {
    return loans
      .filter((loan) => loan.status === 'Active' && loan.type === 'taken')
      .reduce((sum, loan) => sum + loan.emi, 0);
  }, [loans]);

  // Calculate net income
  const netIncome = monthlyIncome - monthlyExpenses - totalEMI;

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const categoryMap = expenses
      .filter((expense) => {
        const date = new Date(expense.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [expenses, currentMonth, currentYear]);

  // Last 6 months trend
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthIncome = incomes
        .filter((income) => {
          const incomeDate = new Date(income.date);
          return (
            incomeDate.getMonth() === date.getMonth() &&
            incomeDate.getFullYear() === date.getFullYear() &&
            income.type === 'one-time'
          );
        })
        .reduce((sum, i) => sum + i.amount, 0) +
        incomes
          .filter((income) => income.type === 'recurring')
          .reduce((sum, income) => {
            if (income.recurringFrequency === 'monthly') return sum + income.amount;
            if (income.recurringFrequency === 'yearly') return sum + income.amount / 12;
            return sum;
          }, 0);

      const monthExpenses = expenses
        .filter((expense) => {
          const expenseDate = new Date(expense.date);
          return (
            expenseDate.getMonth() === date.getMonth() &&
            expenseDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, e) => sum + e.amount, 0);

      months.push({
        month: monthName,
        income: monthIncome,
        expenses: monthExpenses,
        savings: monthIncome - monthExpenses,
      });
    }
    return months;
  }, [incomes, expenses, currentMonth, currentYear]);

  // Chart colors using theme colors (theme-aware) - memoized to prevent recalculation
  const CHART_COLORS = useMemo(() => [
    themeColors.income,
    themeColors.expense,
    themeColors.active,
    themeColors.primary,
    themeColors.savings,
    themeColors.warning,
  ], [themeColors.income, themeColors.expense, themeColors.active, themeColors.primary, themeColors.savings, themeColors.warning]);

  // Savings goals progress
  const goalsProgress = useMemo(() => {
    return goals.map((goal) => ({
      name: goal.name,
      current: goal.currentSavings,
      target: goal.targetAmount,
      progress: (goal.currentSavings / goal.targetAmount) * 100,
    }));
  }, [goals]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-sm text-gray-600">Overview of your financial health</p>
      </div>

      {/* Summary Cards - Improved mobile layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="card group cursor-default">
          <p className="text-xs sm:text-sm text-gray-600 mb-1.5">Monthly Income</p>
          <p className="text-money-lg status-income">
            {currencySymbol}
            {monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card group cursor-default">
          <p className="text-xs sm:text-sm text-gray-600 mb-1.5">Monthly Expenses</p>
          <p className="text-money-lg status-expense">
            {currencySymbol}
            {monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card group cursor-default">
          <p className="text-xs sm:text-sm text-gray-600 mb-1.5">Total EMI</p>
          <p className="text-money-lg status-loan">
            {currencySymbol}
            {totalEMI.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card group cursor-default col-span-2 lg:col-span-1">
          <p className="text-xs sm:text-sm text-gray-600 mb-1.5">Net Income</p>
          <p className={`text-money-lg ${netIncome >= 0 ? 'status-income' : 'status-expense'}`}>
            {currencySymbol}
            {netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Charts Grid - Improved mobile responsiveness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Monthly Trend */}
        <div className="card">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Income vs Expenses (Last 6 Months)</h3>
          <div className="w-full" style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={60} />
                <Tooltip 
                  formatter={(value: number | undefined) => value !== undefined ? `${currencySymbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="income" stroke={themeColors.income} strokeWidth={2.5} name="Income" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="expenses" stroke={themeColors.expense} strokeWidth={2.5} name="Expenses" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="savings" stroke={themeColors.savings} strokeWidth={2.5} name="Savings" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Expense by Category (This Month)</h3>
          {categoryData.length > 0 ? (
            <div className="w-full" style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent !== undefined && percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    outerRadius={70}
                    innerRadius={30}
                    fill={themeColors.primary}
                    dataKey="value"
                    paddingAngle={2}
                    isAnimationActive={true}
                    animationBegin={0}
                    animationDuration={400}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number | undefined) => value !== undefined ? `${currencySymbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state" style={{ height: '280px' }}>
              <Icon name="BarChart2" size={48} className="text-gray-400 opacity-50" />
              <p className="empty-state-text">No expenses this month</p>
            </div>
          )}
        </div>
      </div>

      {/* Savings Goals Progress */}
      {goalsProgress.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Savings Goals Progress</h3>
          <div className="space-y-4">
            {goalsProgress.map((goal) => (
              <div key={goal.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{goal.name}</span>
                  <span className="text-sm text-gray-600 text-money">
                    {currencySymbol}
                    {goal.current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {currencySymbol}
                    {goal.target.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${Math.min(100, Math.max(0, goal.progress))}%`,
                      backgroundColor: 'var(--color-savings)'
                    }}
                    role="progressbar"
                    aria-valuenow={goal.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${goal.name} progress: ${goal.progress.toFixed(0)}%`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Bar Chart - Mobile optimized */}
      {categoryData.length > 0 && (
        <div className="card">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Expense Breakdown by Category</h3>
          <div className="w-full" style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 12 }} width={60} />
                <Tooltip 
                  formatter={(value: number | undefined) => value !== undefined ? `${currencySymbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="value" fill={themeColors.expense} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

