import type { Expense, ExpenseReductionSuggestion, SavingsGoal } from '../types';

export interface SpendingAnalysis {
  category: string;
  totalAmount: number;
  count: number;
  averageAmount: number;
  frequency: 'high' | 'medium' | 'low';
  isSubscription: boolean;
  isImpulse: boolean;
}

export const analyzeSpending = (expenses: Expense[]): SpendingAnalysis[] => {
  const categoryMap = new Map<string, { amounts: number[]; dates: string[] }>();

  expenses.forEach((expense) => {
    if (!categoryMap.has(expense.category)) {
      categoryMap.set(expense.category, { amounts: [], dates: [] });
    }
    const data = categoryMap.get(expense.category)!;
    data.amounts.push(expense.amount);
    data.dates.push(expense.date);
  });

  const analyses: SpendingAnalysis[] = [];

  categoryMap.forEach((data, category) => {
    const totalAmount = data.amounts.reduce((sum, amt) => sum + amt, 0);
    const count = data.amounts.length;
    const averageAmount = totalAmount / count;

    // Check for subscription-like pattern (similar amounts, regular intervals)
    const sortedDates = data.dates
      .map((d) => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

    let isSubscription = false;
    if (count >= 3) {
      const amounts = data.amounts;
      const avg = averageAmount;
      const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / count;
      const stdDev = Math.sqrt(variance);
      // Low variance suggests subscription
      isSubscription = stdDev / avg < 0.2;

      // Check for regular intervals (monthly pattern)
      if (sortedDates.length >= 3) {
        const intervals: number[] = [];
        for (let i = 1; i < sortedDates.length; i++) {
          const diff = sortedDates[i].getTime() - sortedDates[i - 1].getTime();
          intervals.push(diff / (1000 * 60 * 60 * 24)); // days
        }
        const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
        const intervalVariance =
          intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
        // Regular monthly intervals (25-35 days)
        if (avgInterval >= 25 && avgInterval <= 35 && intervalVariance < 50) {
          isSubscription = true;
        }
      }
    }

    // Check for impulse buys (high amount, low frequency, non-essential categories)
    const impulseCategories = ['Shopping', 'Entertainment', 'Food'];
    const isImpulse =
      impulseCategories.includes(category) &&
      count <= 2 &&
      averageAmount > 100 &&
      !isSubscription;

    // Determine frequency
    let frequency: 'high' | 'medium' | 'low';
    if (count >= 10) frequency = 'high';
    else if (count >= 5) frequency = 'medium';
    else frequency = 'low';

    analyses.push({
      category,
      totalAmount,
      count,
      averageAmount,
      frequency,
      isSubscription,
      isImpulse,
    });
  });

  return analyses.sort((a, b) => b.totalAmount - a.totalAmount);
};

export const generateReductionSuggestions = (
  expenses: Expense[],
  goals: SavingsGoal[],
  monthlyIncome: number
): ExpenseReductionSuggestion[] => {
  const analysis = analyzeSpending(expenses);
  const suggestions: ExpenseReductionSuggestion[] = [];

  // Calculate total monthly expenses
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlyExpenses = expenses
    .filter((e) => {
      const date = new Date(e.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  // Calculate total savings needed
  const totalSavingsNeeded = goals.reduce((sum, goal) => {
    const targetDate = new Date(goal.targetDate);
    const monthsRemaining = Math.max(
      1,
      (targetDate.getFullYear() - currentYear) * 12 + (targetDate.getMonth() - currentMonth)
    );
    const amountNeeded = goal.targetAmount - goal.currentSavings;
    return sum + amountNeeded / monthsRemaining;
  }, 0);

  const savingsGap = totalSavingsNeeded - (monthlyIncome - monthlyExpenses);

  analysis.forEach((item) => {
    if (item.totalAmount === 0) return;

    let suggestedReduction = 0;
    let reason = '';
    const steps: string[] = [];
    let priority: 'High' | 'Medium' | 'Low' = 'Medium';

    // Subscription detection
    if (item.isSubscription) {
      suggestedReduction = item.totalAmount * 0.3; // Suggest 30% reduction
      reason = `Recurring subscription detected in ${item.category}. Consider canceling unused subscriptions or finding cheaper alternatives.`;
      steps.push(`Review all ${item.category} subscriptions`);
      steps.push('Cancel any unused or rarely used services');
      steps.push('Look for bundle deals or family plans');
      steps.push('Consider annual plans for better rates');
      priority = 'High';
    }
    // Impulse buys
    else if (item.isImpulse) {
      suggestedReduction = item.totalAmount * 0.5; // Suggest 50% reduction
      reason = `Impulse purchases detected in ${item.category}. These can be reduced with better planning.`;
      steps.push('Implement a 24-hour waiting period before purchases');
      steps.push('Create a monthly budget for this category');
      steps.push('Track spending in this category weekly');
      priority = 'High';
    }
    // High frequency spending
    else if (item.frequency === 'high' && item.averageAmount > 50) {
      suggestedReduction = item.totalAmount * 0.2; // Suggest 20% reduction
      reason = `High-frequency spending in ${item.category}. Small reductions can add up significantly.`;
      steps.push(`Set a monthly limit for ${item.category}`);
      steps.push('Track daily spending in this category');
      steps.push('Look for bulk purchase discounts');
      steps.push('Compare prices before buying');
      priority = savingsGap > item.totalAmount * 0.2 ? 'High' : 'Medium';
    }
    // High amount categories
    else if (item.totalAmount > monthlyIncome * 0.2) {
      suggestedReduction = item.totalAmount * 0.15; // Suggest 15% reduction
      reason = `${item.category} represents a significant portion of your income.`;
      steps.push(`Review all ${item.category} expenses`);
      steps.push('Negotiate better rates or prices');
      steps.push('Look for alternatives or substitutes');
      priority = 'High';
    }
    // Medium priority suggestions
    else if (item.totalAmount > 100) {
      suggestedReduction = item.totalAmount * 0.1; // Suggest 10% reduction
      reason = `Moderate spending in ${item.category} that could be optimized.`;
      steps.push(`Review ${item.category} expenses`);
      steps.push('Look for cost-saving opportunities');
      priority = 'Medium';
    }

    if (suggestedReduction > 0) {
      suggestions.push({
        id: `suggestion-${item.category}`,
        category: item.category,
        currentSpending: item.totalAmount,
        suggestedReduction,
        reason,
        steps,
        priority,
      });
    }
  });

  // Sort by priority and potential savings
  return suggestions.sort((a, b) => {
    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.suggestedReduction - a.suggestedReduction;
  });
};

