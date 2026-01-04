import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import incomeReducer from './slices/incomeSlice';
import expenseReducer from './slices/expenseSlice';
import loanReducer from './slices/loanSlice';
import savingsGoalReducer from './slices/savingsGoalSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    income: incomeReducer,
    expense: expenseReducer,
    loan: loanReducer,
    savingsGoal: savingsGoalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

