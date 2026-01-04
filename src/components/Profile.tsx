import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateProfile, loadProfile } from '../store/slices/profileSlice';
import { useTheme } from '../hooks/useTheme';
import { Icon } from './common/Icon';
import DataBackup from './DataBackup';
import DataCleanup from './DataCleanup';
import type { Profile as ProfileType, RiskLevel } from '../types';
import type { ThemeKey } from '../theme/themes';

const Profile = () => {
  const dispatch = useAppDispatch();
  const { profile, loading } = useAppSelector((state) => state.profile);
  const { user } = useAppSelector((state) => state.auth);
  const { currentThemeKey, setTheme, availableThemes } = useTheme();
  const [formData, setFormData] = useState<ProfileType>({
    id: user?.id || '',
    name: '',
    currency: 'USD',
    monthlyIncome: 0,
    riskLevel: 'Medium',
  });

  useEffect(() => {
    dispatch(loadProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    } else if (user) {
      // Update formData with user ID when user is available
      setFormData((prev) => ({ ...prev, id: user.id }));
    }
  }, [profile, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateProfile(formData));
  };

  const currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'];

  return (
    <div>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Profile & Preferences</h2>
          <p className="text-sm text-gray-600">Manage your personal information and settings</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="Enter your name"
                aria-required="false"
              />
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="input"
                aria-label="Select currency"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Income (Expected)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : formData.currency === 'INR' ? '₹' : formData.currency}
                </span>
                <input
                  type="number"
                  id="monthlyIncome"
                  value={formData.monthlyIncome || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyIncome: parseFloat(e.target.value) || 0 })
                  }
                  className="input pl-8"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  aria-label="Monthly income"
                />
              </div>
            </div>

            <div>
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-3">
                  Risk Level
                </legend>
                <div className="grid grid-cols-3 gap-3">
                  {(['Low', 'Medium', 'High'] as RiskLevel[]).map((level) => (
                    <label
                      key={level}
                      className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        formData.riskLevel === level
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="riskLevel"
                        value={level}
                        checked={formData.riskLevel === level}
                        onChange={(e) =>
                          setFormData({ ...formData, riskLevel: e.target.value as RiskLevel })
                        }
                        className="sr-only"
                        aria-label={`Risk level: ${level}`}
                      />
                      <span className={`text-sm font-medium ${formData.riskLevel === level ? 'text-blue-700' : 'text-gray-700'}`}>
                        {level}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                aria-label={loading ? 'Saving profile' : 'Save profile'}
              >
                {loading ? (
                  <span className="flex items-center">
                    <Icon name="Loader" size={16} className="animate-spin -ml-1 mr-2 text-white" />
                    Saving...
                  </span>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Theme Settings */}
        <div className="card mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Theme Settings</h3>
            <p className="text-sm text-gray-600">Choose your preferred color theme</p>
          </div>

          <div className="space-y-3">
            {Object.entries(availableThemes).map(([key, theme]) => (
              <label
                key={key}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  currentThemeKey === key
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={key}
                  checked={currentThemeKey === key}
                  onChange={() => setTheme(key as ThemeKey)}
                  className="mr-3"
                  aria-label={`Select ${theme.name}`}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{theme.name}</span>
                    {currentThemeKey === key && (
                      <span className="text-xs text-yellow-600 font-medium">Active</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: theme.colors.primary }}
                      aria-hidden="true"
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: theme.colors.secondary }}
                      aria-hidden="true"
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: theme.colors.accent }}
                      aria-hidden="true"
                    />
                    <span className="text-xs text-gray-500 ml-2">Preview colors</span>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> The app background is always white. Themes affect cards, accents, buttons, and highlights only.
            </p>
          </div>
        </div>

        {/* Data Backup Section */}
        <div className="mt-6">
          <DataBackup />
        </div>

        {/* Data Cleanup Section */}
        <div className="mt-6">
          <DataCleanup />
        </div>
      </div>
    </div>
  );
};

export default Profile;

