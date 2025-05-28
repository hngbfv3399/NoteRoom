/**
 * 관리자 대시보드 통계 카드 컴포넌트
 * 실제 시스템 지표를 카드 형태로 표시합니다.
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiUsers, 
  FiFileText, 
  FiMessageCircle, 
  FiTrendingUp,
  FiActivity,
  FiAlertTriangle,
  FiShield,
  FiEye
} from 'react-icons/fi';
import { getSystemStats, collectPerformanceMetrics } from '@/utils/performanceUtils';

function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // 실제 통계 데이터 로드
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        
        // 시스템 통계와 성능 지표를 병렬로 수집
        const [systemStats, performanceData] = await Promise.all([
          getSystemStats(),
          collectPerformanceMetrics()
        ]);

        // 실제 데이터만 사용하는 통계 계산
        const calculatedStats = {
          totalUsers: systemStats.totalUsers,
          activeUsers: systemStats.activeUsers,
          totalNotes: systemStats.totalNotes,
          totalComments: systemStats.totalComments,
          // 실제 조회수는 별도 구현 필요, 현재는 표시하지 않음
          totalViews: 0, 
          pendingReports: 0, // 실제 신고 시스템 구현 시 업데이트
          systemHealth: calculateSystemHealth(performanceData),
          // 활동률은 실제 계산 가능
          activityRate: systemStats.totalUsers > 0 ? 
            Math.round((systemStats.activeUsers / systemStats.totalUsers) * 100 * 10) / 10 : 0,
          // 성장률은 이전 데이터가 없으므로 제거
          firebaseResponseTime: performanceData?.firebase?.responseTime || 0,
          errorRate: performanceData?.errorRate || 0
        };

        setStats(calculatedStats);
      } catch (error) {
        console.error('통계 데이터 로드 실패:', error);
        // 에러 시 기본값 설정
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          totalNotes: 0,
          totalComments: 0,
          totalViews: 0,
          pendingReports: 0,
          systemHealth: 'unknown',
          activityRate: 0,
          firebaseResponseTime: 0,
          errorRate: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    
    // 5분마다 자동 새로고침
    const interval = setInterval(loadStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 시스템 상태 계산
  const calculateSystemHealth = (performanceData) => {
    if (!performanceData) return 'unknown';
    
    const { cpu, memory, firebase, errorRate } = performanceData;
    
    // 각 지표별 점수 계산 (0-100)
    const cpuScore = Math.max(0, 100 - cpu);
    const memoryScore = memory ? Math.max(0, 100 - memory.percentage) : 50;
    const firebaseScore = firebase.isConnected ? 
      (firebase.responseTime < 500 ? 90 : firebase.responseTime < 1000 ? 70 : 50) : 0;
    const errorScore = Math.max(0, 100 - (errorRate * 20));
    
    const overallScore = (cpuScore + memoryScore + firebaseScore + errorScore) / 4;
    
    if (overallScore >= 80) return 'excellent';
    if (overallScore >= 60) return 'good';
    if (overallScore >= 40) return 'warning';
    return 'critical';
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // 통계 카드 데이터 (실제 데이터만 사용)
  const statCards = [
    {
      title: '전체 사용자',
      value: stats?.totalUsers || 0,
      icon: FiUsers,
      color: 'blue',
      description: '등록된 사용자 수'
    },
    {
      title: '활성 사용자',
      value: stats?.activeUsers || 0,
      icon: FiActivity,
      color: 'green',
      description: '최근 5분 내 활동'
    },
    {
      title: '전체 노트',
      value: stats?.totalNotes || 0,
      icon: FiFileText,
      color: 'purple',
      description: '작성된 글 수'
    },
    {
      title: '전체 댓글',
      value: stats?.totalComments || 0,
      icon: FiMessageCircle,
      color: 'orange',
      description: '작성된 댓글 수'
    },
    {
      title: '신고 대기',
      value: stats?.pendingReports || 0,
      icon: FiAlertTriangle,
      color: 'red',
      description: '처리 대기 중'
    },
    {
      title: '시스템 상태',
      value: stats?.systemHealth || 'unknown',
      icon: FiShield,
      color: 'emerald',
      description: '전체 시스템',
      isHealth: true
    },
    {
      title: '활동률',
      value: stats?.activityRate || 0,
      icon: FiTrendingUp,
      color: 'cyan',
      description: '활성 사용자 비율',
      isPercentage: true
    },
    {
      title: 'Firebase 응답시간',
      value: stats?.firebaseResponseTime || 0,
      icon: FiActivity,
      color: 'indigo',
      description: 'Firestore 응답시간 (ms)',
      isResponseTime: true
    }
  ];

  // 색상 매핑
  const getColorClasses = (color) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      purple: 'text-purple-600 bg-purple-100',
      orange: 'text-orange-600 bg-orange-100',
      indigo: 'text-indigo-600 bg-indigo-100',
      red: 'text-red-600 bg-red-100',
      emerald: 'text-emerald-600 bg-emerald-100',
      cyan: 'text-cyan-600 bg-cyan-100'
    };
    return colors[color] || colors.blue;
  };

  // 시스템 상태 텍스트
  const getHealthText = (health) => {
    switch (health) {
      case 'excellent': return '최적';
      case 'good': return '양호';
      case 'warning': return '주의';
      case 'critical': return '위험';
      default: return '알 수 없음';
    }
  };

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => (
        <div
          key={index}
          className={`p-6 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
        >
          {/* 아이콘과 제목 */}
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${getColorClasses(card.color)}`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>

          {/* 제목 */}
          <h3 className={`text-sm font-medium mb-1 ${currentTheme?.textColor || 'text-gray-600'}`}>
            {card.title}
          </h3>

          {/* 값 */}
          <div className={`text-2xl font-bold mb-1 ${currentTheme?.textColor || 'text-gray-900'}`}>
            {card.isHealth ? (
              <span className={`text-lg px-2 py-1 rounded-full ${getHealthColor(card.value)}`}>
                {getHealthText(card.value)}
              </span>
            ) : card.isPercentage ? (
              `${card.value}%`
            ) : card.isResponseTime ? (
              `${card.value}ms`
            ) : (
              card.value.toLocaleString()
            )}
          </div>

          {/* 설명 */}
          <p className={`text-xs ${currentTheme?.textColor || 'text-gray-500'}`}>
            {card.description}
          </p>
        </div>
      ))}
    </div>
  );
}

export default DashboardStats; 