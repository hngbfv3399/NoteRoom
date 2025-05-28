/**
 * 관리자 데이터 관리 훅
 * - 시스템 통계 데이터 관리
 * - 실시간 업데이트
 * - 에러 처리 및 재시도 로직
 */

import { useState, useEffect, useCallback } from 'react';
import { getEnhancedSystemStats, getRealtimeAlerts, getQuickActions } from '../utils/adminUtils';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function useAdminData() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const isOnline = useNetworkStatus();

  // 대시보드 데이터 로드
  const loadDashboardData = useCallback(async () => {
    if (!isOnline) {
      setError('인터넷 연결을 확인해주세요.');
      return;
    }

    try {
      setError(null);
      const [systemStats, realtimeAlerts, actions] = await Promise.all([
        getEnhancedSystemStats(),
        getRealtimeAlerts(),
        getQuickActions()
      ]);
      
      setStats(systemStats);
      setAlerts(realtimeAlerts);
      setQuickActions(actions);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      
      // 실패 시 기본값 설정
      if (!stats) {
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
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, stats]);

  // 데이터 새로고침
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  // 초기 로드 및 주기적 업데이트
  useEffect(() => {
    loadDashboardData();
    
    // 30초마다 자동 새로고침 (온라인 상태일 때만)
    const interval = setInterval(() => {
      if (isOnline && !refreshing) {
        loadDashboardData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadDashboardData, isOnline, refreshing]);

  return {
    stats,
    alerts,
    quickActions,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh,
    reload: loadDashboardData
  };
} 