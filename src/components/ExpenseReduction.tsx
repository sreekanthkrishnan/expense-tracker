import { useEffect, useState } from 'react';
import { Icon } from './common/Icon';
import { useAppSelector } from '../store/hooks';
import { generateReductionSuggestions, analyzeSpending } from '../utils/expenseReduction';
import type { ExpenseReductionSuggestion } from '../types';
import { getAIAdvice } from '../utils/openai';

const ExpenseReduction = () => {
  const { expenses } = useAppSelector((state) => state.expense);
  const { goals } = useAppSelector((state) => state.savingsGoal);
  const { profile } = useAppSelector((state) => state.profile);
  const [suggestions, setSuggestions] = useState<ExpenseReductionSuggestion[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const monthlyIncome = profile?.monthlyIncome || 0;
    const newSuggestions = generateReductionSuggestions(expenses, goals, monthlyIncome);
    setSuggestions(newSuggestions);
  }, [expenses, goals, profile]);

  useEffect(() => {
    const fetchAIAdvice = async () => {
      if (expenses.length > 0 && goals.length > 0) {
        setLoadingAI(true);
        const monthlyIncome = profile?.monthlyIncome || 0;
        const analysis = analyzeSpending(expenses);
        const advice = await getAIAdvice(expenses, goals, monthlyIncome, analysis);
        setAiAdvice(advice);
        setLoadingAI(false);
      }
    };
    fetchAIAdvice();
  }, [expenses, goals, profile]);

  const currency = profile?.currency || 'USD';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const totalPotentialSavings = suggestions.reduce(
    (sum, s) => sum + s.suggestedReduction,
    0
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Expense Reduction Suggestions</h2>
        <p className="text-sm text-gray-600">AI-powered insights to help you save more</p>
      </div>

      {/* Summary Card */}
      <div className="card mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Potential Monthly Savings</h3>
        <p className="text-money-lg status-savings mb-2">
          {currencySymbol}
          {totalPotentialSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-sm text-gray-600">
          By following the suggestions below, you could save this amount monthly.
        </p>
      </div>

      {/* AI Advice */}
      {aiAdvice && (
        <div className="card mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-2" aria-hidden="true">🤖</span>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">AI-Powered Advice</h3>
          </div>
          {loadingAI ? (
            <div className="flex items-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2" aria-hidden="true"></div>
              <p className="text-sm text-gray-600">Generating advice...</p>
            </div>
          ) : (
            <p className="text-sm sm:text-base text-gray-700 whitespace-pre-line leading-relaxed">{aiAdvice}</p>
          )}
        </div>
      )}

      {/* Suggestions List */}
      <div className="space-y-4">
        {suggestions.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <Icon name="MessageCircle" size={48} className="text-gray-400 opacity-50" />
              <p className="empty-state-text mb-2">No suggestions available</p>
              <p className="text-xs text-gray-500">Add some expenses to get personalized recommendations!</p>
            </div>
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`card border-l-4 ${getPriorityColor(suggestion.priority)} slide-up`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">{suggestion.category}</h3>
                  <p className="text-sm text-gray-600">{suggestion.reason}</p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full self-start sm:self-auto ${getPriorityColor(
                    suggestion.priority
                  )}`}
                >
                  {suggestion.priority} Priority
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Current Monthly Spending</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 text-money">
                    {currencySymbol}
                    {suggestion.currentSpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Potential Monthly Savings</p>
                  <p className="text-lg sm:text-xl font-bold status-savings text-money">
                    {currencySymbol}
                    {suggestion.suggestedReduction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {suggestion.steps.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Action Steps:
                  </h4>
                  <ul className="space-y-2">
                    {suggestion.steps.map((step, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <span className="text-blue-600 mr-2 mt-0.5">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExpenseReduction;

