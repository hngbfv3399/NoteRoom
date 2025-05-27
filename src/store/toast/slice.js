import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  toasts: []
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: (state, action) => {
      const { message, type = 'info', duration = 5000 } = action.payload;
      const id = Date.now() + Math.random();
      
      const newToast = {
        id,
        message,
        type, // 'success', 'error', 'warning', 'info'
        duration,
        timestamp: Date.now()
      };

      state.toasts.push(newToast);
    },
    
    removeToast: (state, action) => {
      const id = action.payload;
      state.toasts = state.toasts.filter(toast => toast.id !== id);
    },
    
    clearAllToasts: (state) => {
      state.toasts = [];
    }
  }
});

export const { showToast, removeToast, clearAllToasts } = toastSlice.actions;
export default toastSlice.reducer; 