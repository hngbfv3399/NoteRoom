/**
 * Lazy Loading 라우트 설정
 * - 코드 분할 최적화
 * - 번들 크기 감소
 * - 초기 로딩 성능 향상
 */

import { lazy } from 'react';

// 메인 페이지들
export const MainHome = lazy(() => import('@/pages/MainHome'));
export const WritePage = lazy(() => import('@/pages/WritePage'));
export const ThreadPage = lazy(() => import('@/pages/ThreadPage'));
export const MemoDetail = lazy(() => import('@/pages/MemoDetail'));
export const SearchPage = lazy(() => import('@/pages/SearchPage'));

// 사용자 관련 페이지들
export const UserProfile = lazy(() => import('@/pages/UserProfile'));
export const SettingPage = lazy(() => import('@/pages/SettingPage'));
export const MyReportsPage = lazy(() => import('@/pages/MyReportsPage'));

// 관리자 페이지들
export const AdminPage = lazy(() => import('@/pages/AdminPage'));
export const AdminAnnouncementPage = lazy(() => import('@/pages/AdminAnnouncementPage'));

// 기타 페이지들
export const AnnouncementPage = lazy(() => import('@/pages/AnnouncementPage'));
export const EmotionTrackingPage = lazy(() => import('@/pages/EmotionTrackingPage'));
export const TestPage = lazy(() => import('@/pages/TestPage'));

// 인증 페이지들
export const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
export const SignupPage = lazy(() => import('@/pages/auth/SignupPage'));
export const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));

// 에러 페이지들
export const NotFound = lazy(() => import('@/pages/NotFound'));

// 라우트 그룹별 프리로딩 함수들
export const preloadMainRoutes = () => {
  import('@/pages/MainHome');
  import('@/pages/WritePage');
  import('@/pages/ThreadPage');
};

export const preloadUserRoutes = () => {
  import('@/pages/UserProfile');
  import('@/pages/SettingPage');
  import('@/pages/MyReportsPage');
};

export const preloadAdminRoutes = () => {
  import('@/pages/AdminPage');
  import('@/pages/AdminAnnouncementPage');
};

// 중요한 페이지들 미리 로딩
export const preloadCriticalRoutes = () => {
  // 사용자가 자주 방문하는 페이지들을 미리 로딩
  setTimeout(() => {
    preloadMainRoutes();
  }, 2000); // 2초 후 프리로딩 시작
}; 