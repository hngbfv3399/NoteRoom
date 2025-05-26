/**
 * 애플리케이션 라우트 상수
 */

// 일반 라우트
export const ROUTES = {
  HOME: '/',
  WRITE: '/write',
  THREAD: '/thread',
  EMOTION: '/emotion',
  ANNOUNCEMENT: '/announcement',
  SETTING: '/setting',
  SEARCH: '/search',
  NOTE: '/note',
  PROFILE: '/profile',
  MY_REPORTS: '/my-reports',
};

// 관리자 라우트
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin',
  ANNOUNCEMENT: '/admin/announcement',
};

// 인증 라우트
export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
};

// 라우트 헬퍼 함수들
export const getProfileRoute = (userId) => `${ROUTES.PROFILE}/${userId}`;
export const getNoteRoute = (noteId) => `${ROUTES.NOTE}/${noteId}`;
export const getSearchRoute = (searchParam) => `${ROUTES.SEARCH}/${searchParam}`; 