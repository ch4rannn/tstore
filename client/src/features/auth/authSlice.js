// Auth Slice — manages user session state
import { createSlice } from '@reduxjs/toolkit';

const loadState = () => {
  try {
    const user = JSON.parse(localStorage.getItem('thrief_user'));
    const accessToken = localStorage.getItem('thrief_access_token');
    const refreshToken = localStorage.getItem('thrief_refresh_token');
    return { user, accessToken, refreshToken, isAuthenticated: !!accessToken && !!user };
  } catch {
    return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
  }
};

const initialState = {
  ...loadState(),
  otpUserId: null,
  otpContactType: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      localStorage.setItem('thrief_user', JSON.stringify(user));
      localStorage.setItem('thrief_access_token', accessToken);
      localStorage.setItem('thrief_refresh_token', refreshToken);
    },
    setTokens: (state, action) => {
      const { accessToken, refreshToken } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      localStorage.setItem('thrief_access_token', accessToken);
      localStorage.setItem('thrief_refresh_token', refreshToken);
    },
    setOtpState: (state, action) => {
      state.otpUserId = action.payload.userId;
      state.otpContactType = action.payload.contactType;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('thrief_user', JSON.stringify(state.user));
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.otpUserId = null;
      localStorage.removeItem('thrief_user');
      localStorage.removeItem('thrief_access_token');
      localStorage.removeItem('thrief_refresh_token');
    },
  },
});

export const { setCredentials, setTokens, setOtpState, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
