/**
 * 관리자 대시보드 메인 컴포넌트
 * 보안 모니터링, 사용자 관리, 콘텐츠 관리 등의 기능을 제공합니다.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  FiFilter,
  FiBell,
  FiZap,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw
} from 'react-icons/fi';

import { ADMIN_TAB_IDS } from '@/constants/adminConstants';
import { getEnhancedSystemStats, getRealtimeAlerts, getQuickActions } from '@/utils/adminUtils';
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
    component: SecurityMonitoring,
    priority: 'high'
  },
  {
    id: ADMIN_TAB_IDS.CONTENT,
    title: '콘텐츠 관리',
    icon: FiFileText,
    description: '신고된 콘텐츠 검토 및 처리',
    component: ContentManagement,
    priority: 'high'
  },
  {
    id: ADMIN_TAB_IDS.USERS,
    title: '사용자 관리',
    icon: FiUsers,
    description: '사용자 계정 관리 및 권한 설정',
    component: UserManagement,
    priority: 'medium'
  },
  {
    id: ADMIN_TAB_IDS.ANALYTICS,
    title: '통계 및 분석',
    icon: FiBarChart2,
    description: '시스템 사용량 및 트렌드 분석',
    component: Analytics,
    priority: 'medium'
  },
  {
    id: ADMIN_TAB_IDS.SETTINGS,
    title: '시스템 설정',
    icon: FiSettings,
    description: '시스템 전반 설정 및 구성 관리',
    component: SystemSettings,
    priority: 'low'
  }
];

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(ADMIN_TAB_IDS.SECURITY);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalNotes: 0,
    totalReports: 0,
    securityAlerts: 0,
    pendingReports: 0,
    todaySignups: 0,
    systemHealth: 'good'
  });
  const [alerts, setAlerts] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // 대시보드 데이터 로드
  const loadDashboardData = useCallback(async () => {
    try {
      const [systemStats, realtimeAlerts, actions] = await Promise.all([
        getEnhancedSystemStats(),
        getRealtimeAlerts(),
        getQuickActions()
      ]);
      
      setStats(systemStats);
      setAlerts(realtimeAlerts);
      setQuickActions(actions);
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
      // 실패 시 기본값 설정
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalNotes: 0,
        totalReports: 0,
        securityAlerts: 0,
        pendingReports: 0,
        todaySignups: 0,
        systemHealth: 'unknown'
      });
      setAlerts([]);
      setQuickActions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 데이터 새로고침
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // 초기 로드 및 주기적 업데이트
  useEffect(() => {
    loadDashboardData();
    
    // 30초마다 자동 새로고침
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // 시스템 상태 색상
  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 통계 카드 데이터
  const statCards = [
    {
      title: '전체 사용자',
      value: stats.totalUsers,
      icon: FiUsers,
      color: 'blue',
      change: `+${stats.todaySignups} 오늘`,
      trend: 'up'
    },
    {
      title: '활성 사용자',
      value: stats.activeUsers,
      icon: FiActivity,
      color: 'green',
      change: `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% 활성률`,
      trend: 'up'
    },
    {
      title: '전체 노트',
      value: stats.totalNotes,
      icon: FiFileText,
      color: 'purple',
      change: '지속 증가',
      trend: 'up'
    },
    {
      title: '대기 중인 신고',
      value: stats.pendingReports,
      icon: FiAlertTriangle,
      color: stats.pendingReports > 10 ? 'red' : 'yellow',
      change: `총 ${stats.totalReports}건`,
      trend: stats.pendingReports > 0 ? 'attention' : 'stable'
    }
  ];

  const ActiveComponent = ADMIN_TABS.find(tab => tab.id === activeTab)?.component;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">관리자 대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme?.bgColor || 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
              관리자 대시보드
            </h1>
            <p className={`mt-2 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
              시스템 전반을 모니터링하고 관리합니다
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 시스템 상태 */}
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${getHealthColor(stats.systemHealth)}`}>
              시스템 상태: {stats.systemHealth === 'good' ? '양호' : stats.systemHealth}
            </div>
            
            {/* 새로고침 버튼 */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-2 rounded-lg ${currentTheme?.hoverBg || 'hover:bg-gray-100'} transition-colors`}
              title="새로고침"
            >
              <FiRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''} ${currentTheme?.textColor || 'text-gray-600'}`} />
            </button>
          </div>
        </div>

        {/* 실시간 알림 */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className={`p-4 rounded-xl border-l-4 border-red-500 ${currentTheme?.modalBgColor || 'bg-red-50'}`}>
              <div className="flex items-center space-x-2 mb-2">
                <FiBell className="w-5 h-5 text-red-500" />
                <h3 className={`font-semibold ${currentTheme?.textColor || 'text-red-800'}`}>
                  실시간 알림 ({alerts.length})
                </h3>
              </div>
              <div className="space-y-1">
                {alerts.slice(0, 3).map((alert, index) => (
                  <p key={index} className={`text-sm ${currentTheme?.textColor || 'text-red-700'}`}>
                    • {alert.message}
                  </p>
                ))}
                {alerts.length > 3 && (
                  <p className={`text-sm font-medium ${currentTheme?.textColor || 'text-red-700'}`}>
                    +{alerts.length - 3}개 더 보기
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-xl ${currentTheme?.modalBgColor || 'bg-white'} border ${currentTheme?.inputBorder || 'border-gray-200'} hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                    {card.title}
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${currentTheme?.textColor || 'text-gray-900'}`}>
                    {(card.value || 0).toLocaleString()}
                  </p>
                  <p className={`text-xs mt-1 ${
                    card.trend === 'up' ? 'text-green-600' : 
                    card.trend === 'attention' ? 'text-red-600' : 
                    'text-gray-500'
                  }`}>
                    {card.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-${card.color}-100`}>
                  <card.icon className={`w-6 h-6 text-${card.color}-600`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 빠른 액션 */}
        {quickActions.length > 0 && (
          <div className="mb-8">
            <h3 className={`text-lg font-semibold mb-4 ${currentTheme?.textColor || 'text-gray-900'}`}>
              빠른 액션
            </h3>
            <div className="flex flex-wrap gap-3">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={action.onClick}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    action.priority === 'high' 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : action.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  <action.icon className="w-4 h-4" />
                  <span>{action.label}</span>
                  {action.count && (
                    <span className="bg-white bg-opacity-50 px-2 py-1 rounded-full text-xs">
                      {action.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {ADMIN_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : `border-transparent ${currentTheme?.textSecondary || 'text-gray-500'} hover:text-gray-700 hover:border-gray-300`
                    }
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.title}</span>
                  {tab.priority === 'high' && (
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 활성 탭 컨텐츠 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {ActiveComponent && <ActiveComponent />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AdminDashboard; 