import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Income } from '../../types';
import { dbGetAll, dbPut, dbDelete } from '../../utils/indexedDB';

interface IncomeState {
  incomes: Income[];
  loading: boolean;
  error: string | null;
}

const initialState: IncomeState = {
  incomes: [],
  loading: false,
  error: null,
};

const incomeSlice = createSlice({
  name: 'income',
  initialState,
  reducers: {
    setIncomes: (state, action: PayloadAction<Income[]>) => {
      state.incomes = action.payload;
    },
    addIncome: (state, action: PayloadAction<Income>) => {
      state.incomes.push(action.payload);
    },
    updateIncome: (state, action: PayloadAction<Income>) => {
      const index = state.incomes.findIndex((i) => i.id === action.payload.id);
      if (index !== -1) {
        state.incomes[index] = action.payload;
      }
    },
    removeIncome: (state, action: PayloadAction<string>) => {
      state.incomes = state.incomes.filter((i) => i.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setIncomes, addIncome, updateIncome, removeIncome, setLoading, setError } =
  incomeSlice.actions;

export const loadIncomes = () => async (dispatch: any) => {
  dispatch(setLoading(true));
  try {
    const incomes = await dbGetAll<Income>('income');
    dispatch(setIncomes(incomes));
  } catch (error) {
    dispatch(setError('Failed to load incomes'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const saveIncome = (income: Income) => async (dispatch: any, getState: any) => {
  dispatch(setLoading(true));
  try {
    await dbPut('income', income);
    const existingIndex = getState().income.incomes.findIndex(
      (i: Income) => i.id === income.id
    );
    if (existingIndex !== -1) {
      dispatch(updateIncome(income));
    } else {
      dispatch(addIncome(income));
    }
  } catch (error) {
    dispatch(setError('Failed to save income'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const deleteIncome = (id: string) => async (dispatch: any) => {
  dispatch(setLoading(true));
  try {
    await dbDelete('income', id);
    dispatch(removeIncome(id));
  } catch (error) {
    dispatch(setError('Failed to delete income'));
  } finally {
    dispatch(setLoading(false));
  }
};

export default incomeSlice.reducer;

