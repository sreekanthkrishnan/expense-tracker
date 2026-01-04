import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Expense } from '../../types';
import * as expensesService from '../../services/expensesService';

interface ExpenseState {
  expenses: Expense[];
  categories: string[];
  loading: boolean;
  error: string | null;
}

const initialState: ExpenseState = {
  expenses: [],
  categories: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Other'],
  loading: false,
  error: null,
};

const expenseSlice = createSlice({
  name: 'expense',
  initialState,
  reducers: {
    setExpenses: (state, action: PayloadAction<Expense[]>) => {
      state.expenses = action.payload;
    },
    addExpense: (state, action: PayloadAction<Expense>) => {
      state.expenses.push(action.payload);
      // Auto-add category if new
      if (!state.categories.includes(action.payload.category)) {
        state.categories.push(action.payload.category);
      }
    },
    updateExpense: (state, action: PayloadAction<Expense>) => {
      const index = state.expenses.findIndex((e) => e.id === action.payload.id);
      if (index !== -1) {
        state.expenses[index] = action.payload;
      }
    },
    removeExpense: (state, action: PayloadAction<string>) => {
      state.expenses = state.expenses.filter((e) => e.id !== action.payload);
    },
    addCategory: (state, action: PayloadAction<string>) => {
      if (!state.categories.includes(action.payload)) {
        state.categories.push(action.payload);
      }
    },
    removeCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter((c) => c !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setExpenses,
  addExpense,
  updateExpense,
  removeExpense,
  addCategory,
  removeCategory,
  setLoading,
  setError,
} = expenseSlice.actions;

export const loadExpenses = () => async (dispatch: any) => {
  dispatch(setLoading(true));
  try {
    const expenses = await expensesService.fetchExpenses();
    dispatch(setExpenses(expenses));
  } catch (error) {
    dispatch(setError('Failed to load expenses'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const saveExpense = (expense: Expense) => async (dispatch: any, getState: any) => {
  dispatch(setLoading(true));
  try {
    let updatedExpense: Expense;
    const existingIndex = getState().expense.expenses.findIndex(
      (e: Expense) => e.id === expense.id
    );
    
    if (existingIndex !== -1) {
      // Update existing expense
      updatedExpense = await expensesService.updateExpense(expense);
      dispatch(updateExpense(updatedExpense));
    } else {
      // Create new expense
      const { id, ...expenseData } = expense;
      updatedExpense = await expensesService.createExpense(expenseData);
      dispatch(addExpense(updatedExpense));
    }
  } catch (error) {
    dispatch(setError('Failed to save expense'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const deleteExpense = (id: string) => async (dispatch: any) => {
  dispatch(setLoading(true));
  try {
    await expensesService.deleteExpense(id);
    dispatch(removeExpense(id));
  } catch (error) {
    dispatch(setError('Failed to delete expense'));
  } finally {
    dispatch(setLoading(false));
  }
};

export default expenseSlice.reducer;

