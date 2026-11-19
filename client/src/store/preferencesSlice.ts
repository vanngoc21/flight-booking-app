import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AppLanguage = 'vi' | 'en';

type PreferencesState = {
  currency: 'VND' | 'USD';
  preferredCabin: 'economy' | 'business';
  notificationsEnabled: boolean;
  language: AppLanguage;
};
const initialState: PreferencesState = {
  currency: 'VND',
  preferredCabin: 'economy',
  notificationsEnabled: true,
  language: 'vi',
};
const preferencesSlice = createSlice({
  name: 'preferences', initialState,
  reducers: {
    setCurrency(state, action: PayloadAction<'VND' | 'USD'>) { state.currency = action.payload; },
    setPreferredCabin(state, action: PayloadAction<'economy' | 'business'>) { state.preferredCabin = action.payload; },
    setNotificationsEnabled(state, action: PayloadAction<boolean>) { state.notificationsEnabled = action.payload; },
    setLanguage(state, action: PayloadAction<AppLanguage>) { state.language = action.payload; },
  },
});
export const {
  setCurrency,
  setPreferredCabin,
  setNotificationsEnabled,
  setLanguage,
} = preferencesSlice.actions;
export default preferencesSlice.reducer;
