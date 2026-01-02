import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { initDB } from './utils/indexedDB';
import { useAppDispatch } from './store/hooks';
import { loadProfile } from './store/slices/profileSlice';
import { loadIncomes } from './store/slices/incomeSlice';
import { loadExpenses } from './store/slices/expenseSlice';
import { loadLoans } from './store/slices/loanSlice';
import { loadGoals } from './store/slices/savingsGoalSlice';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import IncomeModule from './components/IncomeModule';
import ExpenseModule from './components/ExpenseModule';
import LoanModule from './components/LoanModule';
import SavingsGoalModule from './components/SavingsGoalModule';
import ExpenseReduction from './components/ExpenseReduction';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbInitialized, setDbInitialized] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
        setDbInitialized(true);
        dispatch(loadProfile());
        dispatch(loadIncomes());
        dispatch(loadExpenses());
        dispatch(loadLoans());
        dispatch(loadGoals());
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbInitialized(true); // Continue with LocalStorage fallback
        dispatch(loadProfile());
        dispatch(loadIncomes());
        dispatch(loadExpenses());
        dispatch(loadLoans());
        dispatch(loadGoals());
      }
    };
    initialize();
  }, [dispatch]);

  if (!dbInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" role="status" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Initializing...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'income', label: 'Income', icon: '💰' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'loans', label: 'Loans', icon: '🏦' },
    { id: 'goals', label: 'Savings Goals', icon: '🎯' },
    { id: 'reduction', label: 'Reduce Expenses', icon: '💡' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-6">
      {/* Desktop Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-blue-600">💰 Finance Tracker</h1>
              {/* Desktop tabs */}
              <div className="hidden lg:ml-8 lg:flex lg:space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2 text-base" aria-hidden="true">{tab.icon}</span>
                    <span className="hidden xl:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Mobile menu - horizontal scroll */}
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="flex overflow-x-auto hide-scrollbar px-2 py-2 space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className={`inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 min-h-[44px] flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2 text-base" aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6" role="main">
        <div className="animate-in">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'profile' && <Profile />}
          {activeTab === 'income' && <IncomeModule />}
          {activeTab === 'expenses' && <ExpenseModule />}
          {activeTab === 'loans' && <LoanModule />}
          {activeTab === 'goals' && <SavingsGoalModule />}
          {activeTab === 'reduction' && <ExpenseReduction />}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
