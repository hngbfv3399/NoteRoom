/**
 * 사용자 기능 모듈 진입점
 * - Lazy loading 지원
 * - 코드 분할 최적화
 */

import { lazy } from 'react';

// 사용자 관련 페이지들을 lazy loading으로 분할
export const UserProfile = lazy(() => import('./components/UserProfile'));
export const SettingPage = lazy(() => import('./components/SettingPage'));
export const MyReportsPage = lazy(() => import('./components/MyReportsPage'));
export const EmotionTrackingPage = lazy(() => import('./components/EmotionTrackingPage'));

// 사용자 관련 컴포넌트들
export const ProfileInfoCard = lazy(() => import('./components/ProfileInfoCard'));
export const NotificationSettings = lazy(() => import('./components/NotificationSettings'));
export const SubscribeButton = lazy(() => import('./components/SubscribeButton'));

// 사용자 관련 훅
export { default as useUserProfile } from './hooks/useUserProfile';
export { default as useSettings } from './hooks/useSettings';
export { default as useEmotionTracking } from './hooks/useEmotionTracking';

// 사용자 유틸리티
export * from './utils/userUtils'; 