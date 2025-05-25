// src/store/noteSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notes: [],              // 노트 데이터 배열 추가
  filterCategory: "", //현재 카테고리 상태
  sortType: 'new', // 'new' | 'hot'
};

const noteSlice = createSlice({
  name: 'noteData',
  initialState,
  reducers: {
    setFilterCategory(state, action) {
      state.filterCategory = action.payload;
    },
    setSortType(state, action) {
      state.sortType = action.payload;
    },
  },
});

export const { setFilterCategory, setSortType } = noteSlice.actions;
export default noteSlice.reducer;
