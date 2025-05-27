/**
 * Redux Selectors
 * 메모이제이션된 selector들을 정의하여 불필요한 리렌더링을 방지합니다.
 */

import { createSelector } from '@reduxjs/toolkit';

// 🚀 메모이제이션된 테마 셀렉터
export const selectThemeState = (state) => state.theme || {};
export const selectAuthState = (state) => state.auth || {};

export const selectCurrentTheme = createSelector(
  [selectThemeState],
  (themeState) => themeState.themes?.[themeState.current] || {}
);

export const selectThemeClass = createSelector(
  [selectCurrentTheme],
  (currentTheme) => {
    if (!currentTheme) return '';
    
    return [
      currentTheme.bgColor,
      currentTheme.textColor,
      currentTheme.cardBg,
      currentTheme.inputBg,
      currentTheme.inputBorder
    ].filter(Boolean).join(' ');
  }
);

// 개별 테마 속성 selector들 - primitive 값만 반환
export const selectTextColor = createSelector(
  [selectCurrentTheme],
  (currentTheme) => currentTheme.textColor
);

export const selectInputBorder = createSelector(
  [selectCurrentTheme],
  (currentTheme) => currentTheme.inputBorder
);

export const selectModalBgColor = createSelector(
  [selectCurrentTheme],
  (currentTheme) => currentTheme.modalBgColor
);

export const selectInputBgColor = createSelector(
  [selectCurrentTheme],
  (currentTheme) => currentTheme.inputBgColor
);

export const selectButtonBg = createSelector(
  [selectCurrentTheme],
  (currentTheme) => currentTheme.buttonBg
);

export const selectButtonText = createSelector(
  [selectCurrentTheme],
  (currentTheme) => currentTheme.buttonText
);

export const selectButtonHover = createSelector(
  [selectCurrentTheme],
  (currentTheme) => currentTheme.buttonHover
);

// 🚀 메모이제이션된 사용자 셀렉터
export const selectUserState = (state) => state.user || {};

export const selectUser = createSelector(
  [selectAuthState],
  (authState) => authState.user
);

export const selectCurrentUser = createSelector(
  [selectUserState],
  (userState) => userState.currentUser
);

export const selectIsAuthenticated = createSelector(
  [selectCurrentUser],
  (currentUser) => !!currentUser
);

// 관리자 권한 selector
export const selectIsAdmin = createSelector(
  [selectUser],
  (user) => user?.isAdmin === true
);

// 🚀 노트 관련 selector들 - 성능 최적화
const selectNoteDataState = (state) => state.noteData || {};

// 필터링 상태 selector들 - primitive 값 반환
export const selectFilterCategory = createSelector(
  [selectNoteDataState],
  (noteDataState) => noteDataState.filterCategory
);

export const selectSortType = createSelector(
  [selectNoteDataState],
  (noteDataState) => noteDataState.sortType
);

// UI 상태 selector들
export const selectNoteUI = createSelector(
  [selectNoteDataState],
  (noteDataState) => noteDataState.ui || {}
);

export const selectIsNoteLoading = createSelector(
  [selectNoteUI],
  (ui) => ui.isLoading
);

export const selectNoteError = createSelector(
  [selectNoteUI],
  (ui) => ui.error
);

export const selectLastRefresh = createSelector(
  [selectNoteUI],
  (ui) => ui.lastRefresh
);

// 성능 모니터링 selector들
export const selectNotePerformance = createSelector(
  [selectNoteDataState],
  (noteDataState) => noteDataState.performance || {}
);

export const selectTotalQueries = createSelector(
  [selectNotePerformance],
  (performance) => performance.totalQueries
);

export const selectCacheHits = createSelector(
  [selectNotePerformance],
  (performance) => performance.cacheHits
);

export const selectCacheHitRate = createSelector(
  [selectTotalQueries, selectCacheHits],
  (totalQueries, cacheHits) => {
    if (totalQueries === 0) return 0;
    return Math.round((cacheHits / totalQueries) * 100);
  }
);

// 🔥 복합 selector - React Query 캐시 키용
export const selectNoteQueryKey = createSelector(
  [selectFilterCategory, selectSortType],
  (filterCategory, sortType) => {
    const key = ["notes", filterCategory, sortType];
    console.log('🔑 [Selector] Query Key 생성:', key);
    return key;
  }
);

// 📊 성능 통계 selector
export const selectPerformanceStats = createSelector(
  [selectNotePerformance],
  (performance) => ({
    totalQueries: performance.totalQueries || 0,
    cacheHits: performance.cacheHits || 0,
    lastQueryTime: performance.lastQueryTime,
    cacheHitRate: performance.totalQueries > 0 
      ? Math.round((performance.cacheHits / performance.totalQueries) * 100)
      : 0
  })
);

// 🚀 메모이제이션된 토스트 셀렉터
export const selectToastState = (state) => state.toast;

export const selectActiveToasts = createSelector(
  [selectToastState],
  (toastState) => toastState.toasts.filter(toast => toast.isVisible)
);

// 🚀 메모이제이션된 UI 상태 셀렉터
export const selectUIState = (state) => state.ui || {};

export const selectSidebarOpen = createSelector(
  [selectUIState],
  (uiState) => uiState.sidebarOpen || false
);

export const selectModalState = createSelector(
  [selectUIState],
  (uiState) => uiState.modal || { isOpen: false, type: null, data: null }
);

// 🚀 메모이제이션된 검색 상태 셀렉터
export const selectSearchState = (state) => state.search || {};

export const selectSearchQuery = createSelector(
  [selectSearchState],
  (searchState) => searchState.query || ''
);

export const selectSearchFilters = createSelector(
  [selectSearchState],
  (searchState) => searchState.filters || {}
);

// 🚀 복합 셀렉터들
export const selectThemeWithClass = createSelector(
  [selectCurrentTheme, selectThemeClass],
  (theme, themeClass) => ({
    theme,
    themeClass
  })
);

export const selectUserWithAuth = createSelector(
  [selectCurrentUser, selectIsAuthenticated],
  (user, isAuthenticated) => ({
    user,
    isAuthenticated
  })
); 