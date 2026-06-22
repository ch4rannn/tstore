// UI Slice — global UI state
import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,
    mobileMenuOpen: false,
    searchOpen: false,
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload; },
    toggleMobileMenu: (state) => { state.mobileMenuOpen = !state.mobileMenuOpen; },
    setSearchOpen: (state, action) => { state.searchOpen = action.payload; },
  },
});

export const { toggleSidebar, setSidebarOpen, toggleMobileMenu, setSearchOpen } = uiSlice.actions;
export default uiSlice.reducer;
