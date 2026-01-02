import OpenAI from 'openai';
import type { Expense, SavingsGoal } from '../types';
import type { SpendingAnalysis } from './expenseReduction';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

export const getAIAdvice = async (
  _expenses: Expense[],
  goals: SavingsGoal[],
  monthlyIncome: number,
  spendingAnalysis: SpendingAnalysis[]
): Promise<string> => {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    return 'OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.';
  }

  try {
    const topCategories = spendingAnalysis
      .slice(0, 5)
      .map((a) => `${a.category}: $${a.totalAmount.toFixed(2)} (${a.count} transactions)`)
      .join('\n');

    const goalsSummary = goals
      .map(
        (g) =>
          `${g.name}: $${g.targetAmount} by ${new Date(g.targetDate).toLocaleDateString()} (Current: $${g.currentSavings})`
      )
      .join('\n');

    const prompt = `You are a personal finance advisor. Help the user reduce expenses to achieve their savings goals.

Monthly Income: $${monthlyIncome.toFixed(2)}

Top Spending Categories:
${topCategories}

Savings Goals:
${goalsSummary}

Provide clear, actionable advice in 2-3 paragraphs on:
1. Which categories to focus on for reduction
2. Specific strategies to reduce spending
3. How to prioritize cuts to meet savings goals

Be practical and empathetic.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate advice.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'Failed to fetch AI advice. Please check your API key and try again.';
  }
};

