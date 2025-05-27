import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // 🔥 필터링 상태 (React Query 캐시 키에 영향)
  filterCategory: null,   
  sortType: 'new',
  
  // 🚀 새로운 상태들 - UI 상태와 데이터 상태 분리
  ui: {
    isLoading: false,
    error: null,
    lastRefresh: null,
  },
  
  // 📊 성능 모니터링
  performance: {
    lastQueryTime: null,
    totalQueries: 0,
    cacheHits: 0,
  }
};

const noteSlice = createSlice({
  name: 'noteData',
  initialState,
  reducers: {
    // 🏷️ 카테고리 필터 변경 (React Query 캐시 무효화 트리거)
    setFilterCategory(state, action) {
      const newCategory = action.payload;
      
      // 같은 값이면 변경하지 않음 (불필요한 리렌더링 방지)
      if (state.filterCategory === newCategory) {
        console.log('🔄 [Redux] 카테고리 변경 없음:', newCategory);
        return;
      }
      
      console.log('🏷️ [Redux] 카테고리 변경:', {
        from: state.filterCategory,
        to: newCategory,
        timestamp: new Date().toISOString()
      });
      
      state.filterCategory = newCategory;
      state.ui.lastRefresh = Date.now();
      state.performance.totalQueries += 1;
    },
    
    // 🔥 정렬 타입 변경 (React Query 캐시 무효화 트리거)
    setSortType(state, action) {
      const newSortType = action.payload;
      
      // 같은 값이면 변경하지 않음 (불필요한 리렌더링 방지)
      if (state.sortType === newSortType) {
        console.log('🔄 [Redux] 정렬 변경 없음:', newSortType);
        return;
      }
      
      console.log('🔥 [Redux] 정렬 변경:', {
        from: state.sortType,
        to: newSortType,
        timestamp: new Date().toISOString()
      });
      
      state.sortType = newSortType;
      state.ui.lastRefresh = Date.now();
      state.performance.totalQueries += 1;
    },
    
    // 🚀 UI 상태 관리 (React Query와 독립적)
    setLoading(state, action) {
      state.ui.isLoading = action.payload;
    },
    
    setError(state, action) {
      state.ui.error = action.payload;
    },
    
    clearError(state) {
      state.ui.error = null;
    },
    
    // 📊 성능 모니터링
    recordQueryTime(state, action) {
      state.performance.lastQueryTime = action.payload;
    },
    
    incrementCacheHit(state) {
      state.performance.cacheHits += 1;
    },
    
    // 🔄 상태 초기화 (필요시)
    resetFilters(state) {
      console.log('🔄 [Redux] 필터 초기화');
      state.filterCategory = null;
      state.sortType = 'new';
      state.ui.lastRefresh = Date.now();
    },
    
    // 📈 성능 통계 초기화
    resetPerformance(state) {
      state.performance = {
        lastQueryTime: null,
        totalQueries: 0,
        cacheHits: 0,
      };
    }
  },
});

export const { 
  setFilterCategory, 
  setSortType,
  setLoading,
  setError,
  clearError,
  recordQueryTime,
  incrementCacheHit,
  resetFilters,
  resetPerformance
} = noteSlice.actions;

export default noteSlice.reducer;
