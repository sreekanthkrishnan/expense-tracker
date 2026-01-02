export type RiskLevel = 'Low' | 'Medium' | 'High';
export type IncomeType = 'recurring' | 'one-time';
export type LoanType = 'taken' | 'given';
export type LoanInterestType = 'flat' | 'reducing';
export type LoanStatus = 'Active' | 'Closed';
export type GoalPriority = 'Low' | 'Medium' | 'High';
export type GoalStatus = 'Achievable' | 'Achievable with cuts' | 'Unrealistic';

export interface Profile {
  id: string;
  name: string;
  currency: string;
  monthlyIncome: number;
  riskLevel: RiskLevel;
}

export interface Income {
  id: string;
  amount: number;
  type: IncomeType;
  source: string;
  date: string; // ISO date string
  recurringFrequency?: 'monthly' | 'yearly';
  notes?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string; // ISO date string
  paymentMethod: string;
  notes?: string;
}

export interface Loan {
  id: string;
  name: string;
  type: LoanType;
  principal: number;
  interestRate: number;
  interestType: LoanInterestType;
  tenure: number; // in months
  emi: number;
  outstandingBalance: number;
  startDate: string; // ISO date string
  status: LoanStatus;
  notes?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string; // ISO date string
  currentSavings: number;
  priority: GoalPriority;
  status?: GoalStatus;
  monthlySavingRequired?: number;
  feasibilityScore?: number;
}

export interface ExpenseReductionSuggestion {
  id: string;
  category: string;
  currentSpending: number;
  suggestedReduction: number;
  reason: string;
  steps: string[];
  priority: 'High' | 'Medium' | 'Low';
}

