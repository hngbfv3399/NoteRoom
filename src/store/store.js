import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './theme/slice'
import noteReducer from './notes/slice'

const store = configureStore({
  reducer: {
    theme: themeReducer,        
    noteData: noteReducer       
  },
});

export default store;