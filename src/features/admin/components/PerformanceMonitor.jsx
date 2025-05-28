/**
 * 실제 성능 모니터링 컴포넌트
 * 진짜 시스템 성능 지표를 실시간으로 측정하고 표시합니다.
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiCpu, 
  FiHardDrive, 
  FiWifi, 
  FiUsers,
  FiActivity,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiDatabase,
  FiGlobe
} from 'react-icons/fi';
import { collectPerformanceMetrics, incrementRequestCount, logError } from '@/utils/performanceUtils';

function PerformanceMonitor() {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [history, setHistory] = useState([]);

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // 실제 성능 데이터 수집
  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);
      incrementRequestCount(); // 요청 카운터 증가
      
      const performanceData = await collectPerformanceMetrics();
      
      if (performanceData) {
        setMetrics(performanceData);
        setLastUpdate(new Date());
        
        // 히스토리에 추가 (최근 20개만 유지)
        setHistory(prev => {
          const newHistory = [...prev, performanceData];
          return newHistory.slice(-20);
        });
      }
    } catch (error) {
      console.error('성능 데이터 로드 실패:', error);
      logError(error, 'loadPerformanceData');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPerformanceData();
    
    // 30초마다 자동 새로고침
    const interval = setInterval(loadPerformanceData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 상태에 따른 색상 반환
  const getStatusColor = (value, type) => {
    switch (type) {
      case 'cpu':
        if (value > 80) return 'text-red-500';
        if (value > 60) return 'text-yellow-500';
        return 'text-green-500';
      case 'memory':
        if (value > 85) return 'text-red-500';
        if (value > 70) return 'text-yellow-500';
        return 'text-green-500';
      case 'responseTime':
        if (value > 1000) return 'text-red-500';
        if (value > 500) return 'text-yellow-500';
        return 'text-green-500';
      case 'errorRate':
        if (value > 1) return 'text-red-500';
        if (value > 0.5) return 'text-yellow-500';
        return 'text-green-500';
      case 'network':
        if (value > 100) return 'text-red-500';
        if (value > 50) return 'text-yellow-500';
        return 'text-green-500';
      default:
        return 'text-blue-500';
    }
  };

  // 상태 텍스트 반환
  const getStatusText = (value, type) => {
    const color = getStatusColor(value, type);
    if (color.includes('red')) return '위험';
    if (color.includes('yellow')) return '주의';
    return '양호';
  };

  // 트렌드 계산 (최근 3개 데이터 포인트 비교)
  const getTrend = (currentValue, type) => {
    if (history.length < 3) return 'stable';
    
    const recent = history.slice(-3);
    const values = recent.map(h => {
      switch (type) {
        case 'cpu': return h.cpu;
        case 'memory': return h.memory?.percentage || 0;
        case 'responseTime': return h.firebase?.responseTime || 0;
        case 'errorRate': return h.errorRate;
        default: return 0;
      }
    });
    
    const trend = values[2] - values[0];
    if (Math.abs(trend) < 5) return 'stable';
    return trend > 0 ? 'up' : 'down';
  };

  if (isLoading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <FiAlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className={`text-lg font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
          성능 데이터를 불러올 수 없습니다
        </h3>
        <p className={`text-sm mt-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
          잠시 후 다시 시도해주세요.
        </p>
        <button
          onClick={loadPerformanceData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 성능 카드 데이터
  const performanceCards = [
    {
      title: 'CPU 사용률',
      value: `${metrics.cpu}%`,
      icon: FiCpu,
      color: getStatusColor(metrics.cpu, 'cpu'),
      trend: getTrend(metrics.cpu, 'cpu'),
      status: getStatusText(metrics.cpu, 'cpu'),
      description: 'JavaScript 실행 부하'
    },
    {
      title: '메모리 사용률',
      value: metrics.memory ? `${metrics.memory.percentage}%` : 'N/A',
      icon: FiHardDrive,
      color: metrics.memory ? getStatusColor(metrics.memory.percentage, 'memory') : 'text-gray-500',
      trend: metrics.memory ? getTrend(metrics.memory.percentage, 'memory') : 'stable',
      status: metrics.memory ? getStatusText(metrics.memory.percentage, 'memory') : '측정불가',
      description: metrics.memory ? `${metrics.memory.used}MB / ${metrics.memory.limit}MB` : '브라우저 지원 안함'
    },
    {
      title: 'Firebase 응답시간',
      value: metrics.firebase.responseTime ? `${metrics.firebase.responseTime}ms` : 'N/A',
      icon: FiDatabase,
      color: metrics.firebase.responseTime ? getStatusColor(metrics.firebase.responseTime, 'responseTime') : 'text-red-500',
      trend: metrics.firebase.responseTime ? getTrend(metrics.firebase.responseTime, 'responseTime') : 'stable',
      status: metrics.firebase.isConnected ? getStatusText(metrics.firebase.responseTime, 'responseTime') : '연결실패',
      description: 'Firestore 쿼리 응답시간'
    },
    {
      title: '활성 사용자',
      value: metrics.system.activeUsers.toLocaleString(),
      icon: FiUsers,
      color: 'text-purple-500',
      trend: 'stable',
      status: '실시간',
      description: '최근 5분 내 활동'
    },
    {
      title: '네트워크 RTT',
      value: metrics.network?.rtt ? `${metrics.network.rtt}ms` : 'N/A',
      icon: FiWifi,
      color: metrics.network?.rtt ? getStatusColor(metrics.network.rtt, 'network') : 'text-gray-500',
      trend: 'stable',
      status: metrics.network?.effectiveType || '측정불가',
      description: metrics.network ? `${metrics.network.effectiveType} (${metrics.network.downlink}Mbps)` : '네트워크 정보 없음'
    },
    {
      title: '에러율',
      value: `${metrics.errorRate}%`,
      icon: FiAlertTriangle,
      color: getStatusColor(metrics.errorRate, 'errorRate'),
      trend: getTrend(metrics.errorRate, 'errorRate'),
      status: getStatusText(metrics.errorRate, 'errorRate'),
      description: '최근 1시간 기준'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
            실시간 성능 모니터링
          </h2>
          <p className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
            실제 시스템 성능 지표 (자동 새로고침: 30초)
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadPerformanceData}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              isLoading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : `${currentTheme?.inputBg || 'bg-gray-100'} ${currentTheme?.textColor || 'text-gray-700'} hover:bg-gray-200`
            }`}
          >
            <FiActivity className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? '측정 중...' : '새로고침'}</span>
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
              마지막 업데이트: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* 성능 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {performanceCards.map((card, index) => (
          <div
            key={index}
            className={`p-6 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gray-100`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div className="flex items-center space-x-1">
                {card.trend === 'up' && <FiTrendingUp className="w-4 h-4 text-red-500" />}
                {card.trend === 'down' && <FiTrendingDown className="w-4 h-4 text-green-500" />}
                {card.trend === 'stable' && <div className="w-4 h-4" />}
              </div>
            </div>

            {/* 제목 */}
            <h3 className={`text-sm font-medium mb-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
              {card.title}
            </h3>

            {/* 값 */}
            <div className={`text-2xl font-bold mb-1 ${card.color}`}>
              {card.value}
            </div>

            {/* 상태 */}
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded-full ${card.color} bg-opacity-10`}>
                {card.status}
              </span>
              <span className={`text-xs ${currentTheme?.textColor || 'text-gray-500'}`}>
                {card.description}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 상세 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시스템 정보 */}
        <div className={`p-6 rounded-xl border shadow-sm ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${currentTheme?.textColor || 'text-gray-900'}`}>
            시스템 정보
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>전체 사용자</span>
              <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                {metrics.system.totalUsers.toLocaleString()}명
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>전체 노트</span>
              <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                {metrics.system.totalNotes.toLocaleString()}개
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>활성 사용자</span>
              <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                {metrics.system.activeUsers}명
              </span>
            </div>
            {metrics.memory && (
              <div className="flex justify-between">
                <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>메모리 사용량</span>
                <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {metrics.memory.used}MB / {metrics.memory.limit}MB
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 페이지 로드 성능 */}
        <div className={`p-6 rounded-xl border shadow-sm ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${currentTheme?.textColor || 'text-gray-900'}`}>
            페이지 로드 성능
          </h3>
          {metrics.pageLoad ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>DOM 로드 완료</span>
                <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {metrics.pageLoad.domContentLoaded}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>전체 로드 완료</span>
                <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {metrics.pageLoad.loadComplete}ms
                </span>
              </div>
              {metrics.pageLoad.firstPaint && (
                <div className="flex justify-between">
                  <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>First Paint</span>
                  <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                    {metrics.pageLoad.firstPaint}ms
                  </span>
                </div>
              )}
              {metrics.pageLoad.firstContentfulPaint && (
                <div className="flex justify-between">
                  <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>First Contentful Paint</span>
                  <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                    {metrics.pageLoad.firstContentfulPaint}ms
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <FiClock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                페이지 로드 데이터를 사용할 수 없습니다
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 연결 상태 */}
      <div className={`p-4 rounded-xl border ${
        metrics.firebase.isConnected 
          ? 'border-green-200 bg-green-50' 
          : 'border-red-200 bg-red-50'
      }`}>
        <div className="flex items-center space-x-3">
          {metrics.firebase.isConnected ? (
            <FiCheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <FiAlertTriangle className="w-5 h-5 text-red-600" />
          )}
          <div>
            <p className={`font-medium ${
              metrics.firebase.isConnected ? 'text-green-800' : 'text-red-800'
            }`}>
              Firebase 연결 상태: {metrics.firebase.isConnected ? '정상' : '연결 실패'}
            </p>
            <p className={`text-sm ${
              metrics.firebase.isConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.firebase.isConnected 
                ? `응답시간: ${metrics.firebase.responseTime}ms` 
                : '데이터베이스에 연결할 수 없습니다'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PerformanceMonitor; 