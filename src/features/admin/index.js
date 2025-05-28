/**
 * 관리자 기능 모듈 진입점
 * - Lazy loading 지원
 * - 코드 분할 최적화
 */

import { lazy } from 'react';

// 관리자 대시보드 컴포넌트들을 lazy loading으로 분할
export const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
export const SecurityMonitoring = lazy(() => import('./components/SecurityMonitoring'));
export const UserManagement = lazy(() => import('./components/UserManagement'));
export const ContentManagement = lazy(() => import('./components/ContentManagement'));
export const SystemSettings = lazy(() => import('./components/SystemSettings'));
export const Analytics = lazy(() => import('./components/Analytics'));

// 관리자 유틸리티 및 훅
export { default as useAdminAuth } from './hooks/useAdminAuth';
export { default as useAdminData } from './hooks/useAdminData';
export { default as useRealTimeNotifications } from './hooks/useRealTimeNotifications';

// 관리자 상수 및 설정
export * from './constants/adminConstants';
export * from './utils/adminUtils'; 