import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Loan } from '../../types';
import { dbGetAll, dbPut, dbDelete } from '../../utils/indexedDB';

interface LoanState {
  loans: Loan[];
  loading: boolean;
  error: string | null;
}

const initialState: LoanState = {
  loans: [],
  loading: false,
  error: null,
};

// Calculate EMI based on principal, rate, and tenure
export const calculateEMI = (
  principal: number,
  annualRate: number,
  tenureMonths: number,
  interestType: 'flat' | 'reducing'
): number => {
  if (interestType === 'flat') {
    const totalInterest = (principal * annualRate * tenureMonths) / (12 * 100);
    return (principal + totalInterest) / tenureMonths;
  } else {
    // Reducing balance
    const monthlyRate = annualRate / (12 * 100);
    if (monthlyRate === 0) return principal / tenureMonths;
    return (
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1)
    );
  }
};

const loanSlice = createSlice({
  name: 'loan',
  initialState,
  reducers: {
    setLoans: (state, action: PayloadAction<Loan[]>) => {
      state.loans = action.payload;
    },
    addLoan: (state, action: PayloadAction<Loan>) => {
      state.loans.push(action.payload);
    },
    updateLoan: (state, action: PayloadAction<Loan>) => {
      const index = state.loans.findIndex((l) => l.id === action.payload.id);
      if (index !== -1) {
        state.loans[index] = action.payload;
      }
    },
    removeLoan: (state, action: PayloadAction<string>) => {
      state.loans = state.loans.filter((l) => l.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setLoans, addLoan, updateLoan, removeLoan, setLoading, setError } =
  loanSlice.actions;

export const loadLoans = () => async (dispatch: any) => {
  dispatch(setLoading(true));
  try {
    const loans = await dbGetAll<Loan>('loans');
    dispatch(setLoans(loans));
  } catch (error) {
    dispatch(setError('Failed to load loans'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const saveLoan = (loan: Loan) => async (dispatch: any, getState: any) => {
  dispatch(setLoading(true));
  try {
    await dbPut('loans', loan);
    const existingIndex = getState().loan.loans.findIndex(
      (l: Loan) => l.id === loan.id
    );
    if (existingIndex !== -1) {
      dispatch(updateLoan(loan));
    } else {
      dispatch(addLoan(loan));
    }
  } catch (error) {
    dispatch(setError('Failed to save loan'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const deleteLoan = (id: string) => async (dispatch: any) => {
  dispatch(setLoading(true));
  try {
    await dbDelete('loans', id);
    dispatch(removeLoan(id));
  } catch (error) {
    dispatch(setError('Failed to delete loan'));
  } finally {
    dispatch(setLoading(false));
  }
};

export default loanSlice.reducer;

