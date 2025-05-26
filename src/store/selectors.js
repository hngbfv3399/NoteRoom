/**
 * Redux Selectors
 * 메모이제이션된 selector들을 정의하여 불필요한 리렌더링을 방지합니다.
 */

import { createSelector } from '@reduxjs/toolkit';

// 기본 state selector들 - 안정적인 참조 반환
const selectThemeState = (state) => state.theme || {};
const selectAuthState = (state) => state.auth || {};

// 개별 테마 속성 selector들 - 각각 primitive 값 반환
const selectThemeCurrent = createSelector(
  [selectThemeState],
  (themeState) => themeState.current
);

const selectThemes = createSelector(
  [selectThemeState],
  (themeState) => themeState.themes || {}
);

// 메모이제이션된 현재 테마 selector
export const selectCurrentTheme = createSelector(
  [selectThemeCurrent, selectThemes],
  (current, themes) => themes[current] || {}
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

// 사용자 정보 selector
export const selectUser = createSelector(
  [selectAuthState],
  (authState) => authState.user
);

// 인증 상태 selector
export const selectIsAuthenticated = createSelector(
  [selectUser],
  (user) => !!user
);

// 관리자 권한 selector
export const selectIsAdmin = createSelector(
  [selectUser],
  (user) => user?.isAdmin === true
); 