import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SavingsGoal, GoalStatus } from '../../types';
import { dbGetAll, dbPut, dbDelete } from '../../utils/indexedDB';

interface SavingsGoalState {
  goals: SavingsGoal[];
  loading: boolean;
  error: string | null;
}

const initialState: SavingsGoalState = {
  goals: [],
  loading: false,
  error: null,
};

// Calculate feasibility and required monthly savings
export const calculateGoalFeasibility = (
  goal: SavingsGoal,
  monthlyIncome: number,
  monthlyExpenses: number
): { monthlySavingRequired: number; feasibilityScore: number; status: GoalStatus } => {
  const targetDate = new Date(goal.targetDate);
  const today = new Date();
  const monthsRemaining = Math.max(
    1,
    (targetDate.getFullYear() - today.getFullYear()) * 12 +
      (targetDate.getMonth() - today.getMonth())
  );

  const amountNeeded = goal.targetAmount - goal.currentSavings;
  const monthlySavingRequired = amountNeeded / monthsRemaining;

  const availableIncome = monthlyIncome - monthlyExpenses;
  const feasibilityScore = availableIncome > 0 ? (availableIncome / monthlySavingRequired) * 100 : 0;

  let status: GoalStatus;
  if (feasibilityScore >= 100) {
    status = 'Achievable';
  } else if (feasibilityScore >= 50) {
    status = 'Achievable with cuts';
  } else {
    status = 'Unrealistic';
  }

  return { monthlySavingRequired, feasibilityScore, status };
};

const savingsGoalSlice = createSlice({
  name: 'savingsGoal',
  initialState,
  reducers: {
    setGoals: (state, action: PayloadAction<SavingsGoal[]>) => {
      state.goals = action.payload;
    },
    addGoal: (state, action: PayloadAction<SavingsGoal>) => {
      state.goals.push(action.payload);
    },
    updateGoal: (state, action: PayloadAction<SavingsGoal>) => {
      const index = state.goals.findIndex((g) => g.id === action.payload.id);
      if (index !== -1) {
        state.goals[index] = action.payload;
      }
    },
    removeGoal: (state, action: PayloadAction<string>) => {
      state.goals = state.goals.filter((g) => g.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setGoals, addGoal, updateGoal, removeGoal, setLoading, setError } =
  savingsGoalSlice.actions;

export const loadGoals = () => async (dispatch: any) => {
  dispatch(setLoading(true));
  try {
    const goals = await dbGetAll<SavingsGoal>('savingsGoals');
    dispatch(setGoals(goals));
  } catch (error) {
    dispatch(setError('Failed to load savings goals'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const saveGoal = (goal: SavingsGoal) => async (dispatch: any, getState: any) => {
  dispatch(setLoading(true));
  try {
    await dbPut('savingsGoals', goal);
    const existingIndex = getState().savingsGoal.goals.findIndex(
      (g: SavingsGoal) => g.id === goal.id
    );
    if (existingIndex !== -1) {
      dispatch(updateGoal(goal));
    } else {
      dispatch(addGoal(goal));
    }
  } catch (error) {
    dispatch(setError('Failed to save savings goal'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const deleteGoal = (id: string) => async (dispatch: any) => {
  dispatch(setLoading(true));
  try {
    await dbDelete('savingsGoals', id);
    dispatch(removeGoal(id));
  } catch (error) {
    dispatch(setError('Failed to delete savings goal'));
  } finally {
    dispatch(setLoading(false));
  }
};

export default savingsGoalSlice.reducer;

