/**
 * 관리자 대시보드 탭 네비게이션 컴포넌트
 * 다양한 관리 기능을 탭으로 구성하여 제공합니다.
 */

import React, { useState, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiBarChart2, 
  FiUsers, 
  FiFileText, 
  FiSettings,
  FiShield,
  FiActivity
} from 'react-icons/fi';
import LoadingSpinner from '@/components/LoadingSpinner';

// Lazy load 탭 컴포넌트들 (실제로 존재하는 것들만)
const PerformanceMonitor = React.lazy(() => import('./PerformanceMonitor'));
const UserManagement = React.lazy(() => import('@/components/admin/UserManagement'));
const ContentManagement = React.lazy(() => import('@/components/admin/ContentManagement'));
const SystemSettings = React.lazy(() => import('@/components/admin/SystemSettings'));
const SecurityMonitoring = React.lazy(() => import('@/components/admin/SecurityMonitoring'));
const Analytics = React.lazy(() => import('@/components/admin/Analytics'));

function DashboardTabs() {
  const [activeTab, setActiveTab] = useState('performance');

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // 탭 설정 (실제로 존재하는 컴포넌트들만)
  const tabs = [
    {
      id: 'performance',
      label: '성능 모니터링',
      icon: FiBarChart2,
      component: PerformanceMonitor,
      description: '시스템 성능 지표 및 분석'
    },
    {
      id: 'analytics',
      label: '분석 대시보드',
      icon: FiActivity,
      component: Analytics,
      description: '사용자 활동 및 시스템 분석'
    },
    {
      id: 'users',
      label: '사용자 관리',
      icon: FiUsers,
      component: UserManagement,
      description: '사용자 계정 및 권한 관리'
    },
    {
      id: 'content',
      label: '콘텐츠 관리',
      icon: FiFileText,
      component: ContentManagement,
      description: '노트 및 게시물 관리'
    },
    {
      id: 'security',
      label: '보안 모니터링',
      icon: FiShield,
      component: SecurityMonitoring,
      description: '보안 설정 및 위협 관리'
    },
    {
      id: 'settings',
      label: '시스템 설정',
      icon: FiSettings,
      component: SystemSettings,
      description: '전체 시스템 설정'
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={`rounded-xl border shadow-sm ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
      {/* 탭 네비게이션 */}
      <div className={`border-b ${currentTheme?.inputBorder || 'border-gray-200'}`}>
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : `border-transparent ${currentTheme?.textColor || 'text-gray-500'} hover:text-gray-700 hover:border-gray-300`
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 탭 설명 */}
      {activeTabData && (
        <div className={`px-6 py-3 border-b ${currentTheme?.inputBorder || 'border-gray-200'} ${currentTheme?.inputBg || 'bg-gray-50'}`}>
          <div className="flex items-center space-x-2">
            <activeTabData.icon className="w-4 h-4 text-blue-500" />
            <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
              {activeTabData.description}
            </span>
          </div>
        </div>
      )}

      {/* 탭 컨텐츠 */}
      <div className="p-6">
        <Suspense 
          fallback={
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="large" message={`${activeTabData?.label} 로딩 중...`} />
            </div>
          }
        >
          {activeTabData && (
            <activeTabData.component />
          )}
        </Suspense>
      </div>
    </div>
  );
}

export default DashboardTabs; 