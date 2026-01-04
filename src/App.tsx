import { useEffect, useState, useRef } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { loadProfile } from './store/slices/profileSlice';
import { loadIncomes } from './store/slices/incomeSlice';
import { loadExpenses } from './store/slices/expenseSlice';
import { loadLoans } from './store/slices/loanSlice';
import { loadGoals } from './store/slices/savingsGoalSlice';
import { signOut } from './store/slices/authSlice';
import { useTheme } from './hooks/useTheme';
import { Icon } from './components/common/Icon';
import { isAdmin } from './services/profileService';
import AuthGuard from './auth/AuthGuard';
import AdminRoutes from './admin/AdminRoutes';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import IncomeModule from './components/IncomeModule';
import ExpenseModule from './components/ExpenseModule';
import LoanModule from './components/LoanModule';
import SavingsGoalModule from './components/SavingsGoalModule';
import ExpenseReduction from './components/ExpenseReduction';
import MigrationModal from './components/MigrationModal';
import { detectIndexedDBData } from './utils/migration/detectIndexedDBData';
import { getMigrationSummary } from './utils/migration/getMigrationSummary';
import { isMigrationDone } from './utils/migration/markMigrationDone';
import { getAllIndexedDBData } from './utils/migration/detectIndexedDBData';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationSummary, setMigrationSummary] = useState<any>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  // Initialize theme (applies theme on mount)
  useTheme();

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const adminStatus = await isAdmin();
        setIsUserAdmin(adminStatus);
      }
    };
    checkAdmin();
  }, [user]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  useEffect(() => {
    // Only load data if user is authenticated
    if (user) {
      const initialize = async () => {
        try {
          dispatch(loadProfile());
          dispatch(loadIncomes());
          dispatch(loadExpenses());
          dispatch(loadLoans());
          dispatch(loadGoals());
          setDataLoaded(true);

          // Check for IndexedDB data that needs migration
          const hasMigrated = isMigrationDone(user.id);
          if (!hasMigrated) {
            const dataSummary = await detectIndexedDBData();
            if (dataSummary.hasData) {
              // Get full data to generate summary
              const indexedDBData = await getAllIndexedDBData();
              const summary = getMigrationSummary(indexedDBData);
              setMigrationSummary(summary);
              setShowMigrationModal(true);
            }
          }
        } catch (error) {
          console.error('Failed to load data:', error);
          setDataLoaded(true);
        }
      };
      initialize();
    } else {
      setDataLoaded(false);
      setShowMigrationModal(false);
    }
  }, [dispatch, user]);

  const handleLogout = async () => {
    await dispatch(signOut());
  };

  if (!dataLoaded && user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }} role="status" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 mx-auto" style={{ borderColor: 'var(--color-background-dark)', borderTopColor: 'var(--color-primary)' }} aria-hidden="true"></div>
          <p className="mt-4 text-sm sm:text-base" style={{ color: 'var(--color-primary)' }}>Loading your data...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home' as const },
    // { id: 'profile', label: 'Profile', icon: 'User' as const },
    { id: 'income', label: 'Income', icon: 'TrendingUp' as const },
    { id: 'expenses', label: 'Expenses', icon: 'TrendingDown' as const },
    { id: 'loans', label: 'Loans', icon: 'CreditCard' as const },
    { id: 'goals', label: 'Savings Goals', icon: 'DollarSign' as const },
    { id: 'reduction', label: 'Reduce Expenses', icon: 'MessageCircle' as const },
  ];

  return (
    <div className="min-h-screen pb-20 sm:pb-6 bg-white">
      {/* Desktop Navigation */}
      <nav className="shadow-sm border-b sticky top-0 z-40 bg-white border-gray-200" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Icon name="DollarSign" size={24} className="text-gray-900" />
                Finance Tracker
              </h1>
              {/* Desktop tabs */}
              <div className="hidden lg:ml-8 lg:flex lg:space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] ${
                      activeTab === tab.id
                        ? 'border-2'
                        : 'text-gray-300 hover:bg-opacity-80'
                    }`}
                    style={activeTab === tab.id ? {
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-primary-text)',
                      borderColor: 'var(--color-primary)',
                    } : {
                      color: 'var(--color-surface)',
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.color = 'var(--color-primary)';
                        e.currentTarget.style.backgroundColor = 'var(--color-background-dark)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.color = 'var(--color-surface)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <Icon name={tab.icon} size={18} className="mr-2" aria-hidden="true" />
                    <span className="hidden xl:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* User Menu - Right side */}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  <Icon name="User" size={18} />
                  <Icon name="ChevronDown" size={14} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user.email}
                      </p>
                      {isUserAdmin && (
                        <p className="text-xs text-purple-600 mt-1">Administrator</p>
                      )}
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      {isUserAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Icon name="Dashboard" size={16} />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Icon name="User" size={16} />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Icon name="LogOut" size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Mobile menu - horizontal scroll */}
        <div className="lg:hidden border-t bg-white border-gray-200">
          <div className="flex overflow-x-auto hide-scrollbar px-2 py-2 space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className={`inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 min-h-[44px] flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'shadow-md'
                    : 'hover:bg-opacity-80'
                }`}
                style={activeTab === tab.id ? {
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-text)',
                } : {
                  backgroundColor: 'var(--color-background-dark)',
                  color: 'var(--color-surface)',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--color-surface)';
                  }
                }}
              >
                <Icon name={tab.icon} size={18} className="mr-2" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 bg-white rounded-t-2xl sm:rounded-none" role="main">
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

      {/* Migration Modal */}
      {user && migrationSummary && (
        <MigrationModal
          isOpen={showMigrationModal}
          onClose={() => setShowMigrationModal(false)}
          onSkip={() => setShowMigrationModal(false)}
          userId={user.id}
          summary={migrationSummary}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminRoutes />} />
        
        {/* Main App Routes */}
        <Route
          path="/*"
          element={
            <AuthGuard>
              <AppContent />
            </AuthGuard>
          }
        />
      </Routes>
    </Provider>
  );
}

export default App;
