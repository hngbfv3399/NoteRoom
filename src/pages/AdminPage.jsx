/**
 * 관리자 페이지
 * - Lazy loading 적용
 * - 에러 바운더리 포함
 * - 로딩 상태 관리
 */

import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorFallback from '@/components/ErrorFallback';

// 관리자 대시보드를 lazy loading으로 불러오기
const AdminDashboard = React.lazy(() => import('@/features/admin/components/AdminDashboard'));

function AdminPage() {
  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('관리자 페이지 오류:', error, errorInfo);
      }}
    >
      <Suspense 
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <LoadingSpinner size="large" message="관리자 대시보드 로딩 중..." />
          </div>
        }
      >
        <AdminDashboard />
      </Suspense>
    </ErrorBoundary>
  );
}

export default AdminPage; 