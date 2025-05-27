import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './theme/slice'
import noteReducer from './notes/slice'
import toastReducer from './toast/slice'

const store = configureStore({
  reducer: {
    theme: themeReducer,        
    noteData: noteReducer,
    toast: toastReducer
  },
});

export default store;