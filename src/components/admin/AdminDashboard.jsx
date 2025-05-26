/**
 * 관리자 대시보드 메인 컴포넌트
 * 보안 모니터링, 사용자 관리, 콘텐츠 관리 등의 기능을 제공합니다.
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiShield, 
  FiUsers, 
  FiFileText, 
  FiSettings, 
  FiBarChart2, 
  FiAlertTriangle,
  FiActivity,
  FiLock,
  FiEye,
  FiFilter
} from 'react-icons/fi';
import { getThemeClass } from '@/utils/themeHelper';
import { ADMIN_TAB_IDS } from '@/constants/adminConstants';
import { getSystemStats } from '@/utils/adminUtils';
import SecurityMonitoring from './SecurityMonitoring';
import UserManagement from './UserManagement';
import ContentManagement from './ContentManagement';
import SystemSettings from './SystemSettings';
import Analytics from './Analytics';

const ADMIN_TABS = [
  {
    id: ADMIN_TAB_IDS.SECURITY,
    title: '보안 모니터링',
    icon: FiShield,
    description: '시스템 보안 상태 및 의심스러운 활동 모니터링',
    component: SecurityMonitoring
  },
  {
    id: ADMIN_TAB_IDS.USERS,
    title: '사용자 관리',
    icon: FiUsers,
    description: '사용자 계정 관리 및 권한 설정',
    component: UserManagement
  },
  {
    id: ADMIN_TAB_IDS.CONTENT,
    title: '콘텐츠 관리',
    icon: FiFileText,
    description: '신고된 콘텐츠 검토 및 처리',
    component: ContentManagement
  },
  {
    id: ADMIN_TAB_IDS.SETTINGS,
    title: '시스템 설정',
    icon: FiSettings,
    description: '시스템 전반 설정 및 구성 관리',
    component: SystemSettings
  },
  {
    id: ADMIN_TAB_IDS.ANALYTICS,
    title: '통계 및 분석',
    icon: FiBarChart2,
    description: '시스템 사용량 및 트렌드 분석',
    component: Analytics
  },
];

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(ADMIN_TAB_IDS.SECURITY);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalNotes: 0,
    totalReports: 0,
    securityAlerts: 0
  });

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const themeClass = getThemeClass(currentTheme);

  // 대시보드 통계 로드
  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // 실제 서버 데이터 사용
      const systemStats = await getSystemStats();
      setStats(systemStats);
    } catch (error) {
      console.error('대시보드 통계 로드 실패:', error);
      // 실패 시 기본값 설정
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalNotes: 0,
        totalReports: 0,
        securityAlerts: 0
      });
    }
  };

  const ActiveComponent = ADMIN_TABS.find(tab => tab.id === activeTab)?.component;

  return (
    <div className={`min-h-screen ${themeClass}`}>
      {/* 헤더 */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`sticky top-0 z-30 backdrop-blur-md border-b ${currentTheme?.modalBgColor || 'bg-white'}/90 ${currentTheme?.inputBorder || 'border-gray-200'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FiShield className="w-8 h-8 text-red-500" />
                <h1 className={`text-xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                  관리자 대시보드
                </h1>
              </div>
            </div>

            {/* 실시간 알림 */}
            <div className="flex items-center space-x-4">
              {stats.securityAlerts > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-700 rounded-full"
                >
                  <FiAlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {stats.securityAlerts}개의 보안 알림
                  </span>
                </motion.div>
              )}
              
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                  실시간 모니터링 중
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 빠른 통계 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
        >
          <div className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'} shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-600'}`}>
                  전체 사용자
                </p>
                <p className={`text-2xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {stats.totalUsers.toLocaleString()}
                </p>
              </div>
              <FiUsers className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'} shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-600'}`}>
                  활성 사용자
                </p>
                <p className={`text-2xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {stats.activeUsers.toLocaleString()}
                </p>
              </div>
              <FiActivity className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'} shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-600'}`}>
                  전체 노트
                </p>
                <p className={`text-2xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {stats.totalNotes.toLocaleString()}
                </p>
              </div>
              <FiFileText className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'} shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-600'}`}>
                  대기 중인 신고
                </p>
                <p className={`text-2xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {stats.totalReports}
                </p>
              </div>
              <FiEye className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'} shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-600'}`}>
                  보안 알림
                </p>
                <p className={`text-2xl font-bold ${stats.securityAlerts > 0 ? 'text-red-500' : currentTheme?.textColor || 'text-gray-900'}`}>
                  {stats.securityAlerts}
                </p>
              </div>
              <FiLock className={`w-8 h-8 ${stats.securityAlerts > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
          </div>
        </motion.div>

        {/* 탭 네비게이션 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="overflow-x-auto">
            <div className="flex space-x-1 min-w-max">
              {ADMIN_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? `${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} shadow-md`
                      : `${currentTheme?.inputBg || 'bg-gray-100'} ${currentTheme?.textColor || 'text-gray-700'} hover:bg-gray-200`
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.title}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 활성 탭 콘텐츠 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'} shadow-sm overflow-hidden`}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {ADMIN_TABS.find(tab => tab.id === activeTab)?.title}
                </h2>
                <p className={`text-sm mt-1 ${currentTheme?.textColor || 'text-gray-600'}`}>
                  {ADMIN_TABS.find(tab => tab.id === activeTab)?.description}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {ActiveComponent && (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ActiveComponent />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminDashboard; 