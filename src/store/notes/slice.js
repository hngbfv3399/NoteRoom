import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  filterCategory: null,   
  sortType: 'new',        
};

const noteSlice = createSlice({
  name: 'noteData',
  initialState,
  reducers: {
    // 클라이언트가 어떤 카테고리를 선택 했는지 바꿔 주는 함수
    setFilterCategory(state, action) {
      state.filterCategory = action.payload;
    },
    //이것도 비슷한데 이건 인기노트 최신노트를 정렬해주는 함수임
    setSortType(state, action) {
      state.sortType = action.payload;
      
    },
  },
});

export const { setFilterCategory, setSortType } = noteSlice.actions;
export default noteSlice.reducer;
