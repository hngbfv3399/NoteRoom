import { configureStore } from '@reduxjs/toolkit';
import themeReducer from '../features/themeSlice'
import noteDataReducer from '../features/noteDataSlice'
const store = configureStore({
  reducer: {
    theme: themeReducer,
    noteData : noteDataReducer
  },
});

export default store;