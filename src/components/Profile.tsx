import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateProfile, loadProfile } from '../store/slices/profileSlice';
import type { Profile as ProfileType, RiskLevel } from '../types';

const Profile = () => {
  const dispatch = useAppDispatch();
  const { profile, loading } = useAppSelector((state) => state.profile);
  const [formData, setFormData] = useState<ProfileType>({
    id: 'default',
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
    }
  }, [profile]);

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
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

