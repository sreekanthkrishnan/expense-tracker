import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Profile } from '../../types';
import * as profileService from '../../services/profileService';

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

export const loadProfile = () => async (dispatch: any, getState: any) => {
  dispatch(setLoading(true));
  try {
    const userId = getState().auth.user?.id;
    if (!userId) {
      dispatch(setError('User not authenticated'));
      dispatch(setLoading(false));
      return;
    }

    let profile = await profileService.fetchProfile(userId);
    
    if (!profile) {
      // Create default profile
      profile = {
        id: userId,
        name: '',
        currency: 'USD',
        monthlyIncome: 0,
        riskLevel: 'Medium',
      };
      profile = await profileService.upsertProfile(profile);
    }
    
    dispatch(setProfile(profile));
  } catch (error) {
    dispatch(setError('Failed to load profile'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateProfile = (profile: Profile) => async (dispatch: any) => {
  dispatch(setLoading(true));
  try {
    const updatedProfile = await profileService.upsertProfile(profile);
    dispatch(setProfile(updatedProfile));
  } catch (error) {
    dispatch(setError('Failed to update profile'));
  } finally {
    dispatch(setLoading(false));
  }
};

export default profileSlice.reducer;

