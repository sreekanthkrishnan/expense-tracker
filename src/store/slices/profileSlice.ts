import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Profile } from '../../types';
import { dbPut, dbGetAll } from '../../utils/indexedDB';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<Profile>) => {
      state.profile = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setProfile, setLoading, setError } = profileSlice.actions;

export const loadProfile = () => async (dispatch: any) => {
  dispatch(setLoading(true));
  try {
    const profiles = await dbGetAll<Profile>('profile');
    if (profiles.length > 0) {
      dispatch(setProfile(profiles[0]));
    } else {
      // Create default profile
      const defaultProfile: Profile = {
        id: 'default',
        name: '',
        currency: 'USD',
        monthlyIncome: 0,
        riskLevel: 'Medium',
      };
      await dbPut('profile', defaultProfile);
      dispatch(setProfile(defaultProfile));
    }
  } catch (error) {
    dispatch(setError('Failed to load profile'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateProfile = (profile: Profile) => async (dispatch: any) => {
  dispatch(setLoading(true));
  try {
    await dbPut('profile', profile);
    dispatch(setProfile(profile));
  } catch (error) {
    dispatch(setError('Failed to update profile'));
  } finally {
    dispatch(setLoading(false));
  }
};

export default profileSlice.reducer;

