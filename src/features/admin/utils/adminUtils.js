/**
 * 관리자 기능 유틸리티 함수들
 * - 시스템 통계 데이터 조회
 * - 실시간 알림 관리
 * - 빠른 액션 생성
 */

import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  getCountFromServer 
} from 'firebase/firestore';
import { db } from '@/services/firebase';

/**
 * 향상된 시스템 통계 데이터 조회
 */
export async function getEnhancedSystemStats() {
  try {
    const [
      usersSnapshot,
      notesSnapshot,
      reportsSnapshot,
      activeUsersSnapshot
    ] = await Promise.all([
      getCountFromServer(collection(db, 'users')),
      getCountFromServer(collection(db, 'notes')),
      getCountFromServer(collection(db, 'reports')),
      getCountFromServer(query(
        collection(db, 'users'),
        where('lastActive', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
      ))
    ]);

    // 오늘 가입한 사용자 수
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todaySignupsSnapshot = await getCountFromServer(query(
      collection(db, 'users'),
      where('createdAt', '>=', todayStart)
    ));

    // 대기 중인 신고 수
    const pendingReportsSnapshot = await getCountFromServer(query(
      collection(db, 'reports'),
      where('status', '==', 'pending')
    ));

    // 시스템 상태 계산 (간단한 로직)
    const totalUsers = usersSnapshot.data().count;
    const activeUsers = activeUsersSnapshot.data().count;
    const pendingReports = pendingReportsSnapshot.data().count;
    
    let systemHealth = 'good';
    if (pendingReports > 50) {
      systemHealth = 'critical';
    } else if (pendingReports > 20) {
      systemHealth = 'warning';
    } else if (activeUsers / Math.max(totalUsers, 1) > 0.7) {
      systemHealth = 'excellent';
    }

    return {
      totalUsers,
      activeUsers,
      totalNotes: notesSnapshot.data().count,
      totalReports: reportsSnapshot.data().count,
      securityAlerts: Math.floor(Math.random() * 5), // 실제 구현 필요
      pendingReports: pendingReports,
      todaySignups: todaySignupsSnapshot.data().count,
      systemHealth
    };
  } catch (error) {
    console.error('시스템 통계 조회 실패:', error);
    throw new Error('시스템 통계를 불러올 수 없습니다.');
  }
}

/**
 * 실시간 알림 데이터 조회
 */
export async function getRealtimeAlerts() {
  try {
    // 최근 1시간 내 중요한 이벤트들 조회
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const alertsQuery = query(
      collection(db, 'systemLogs'),
      where('level', 'in', ['warning', 'error', 'critical']),
      where('timestamp', '>=', oneHourAgo),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const alertsSnapshot = await getDocs(alertsQuery);
    
    return alertsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }));
  } catch (error) {
    console.error('실시간 알림 조회 실패:', error);
    // 에러 시 빈 배열 반환
    return [];
  }
}

/**
 * 빠른 액션 목록 생성
 */
export async function getQuickActions() {
  try {
    // 대기 중인 신고 수 조회
    const pendingReportsSnapshot = await getCountFromServer(query(
      collection(db, 'reports'),
      where('status', '==', 'pending')
    ));

    // 최근 보안 알림 수 조회
    const recentSecurityAlertsSnapshot = await getCountFromServer(query(
      collection(db, 'securityLogs'),
      where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
    ));

    const actions = [];

    // 대기 중인 신고가 있으면 빠른 액션 추가
    if (pendingReportsSnapshot.data().count > 0) {
      actions.push({
        id: 'review-reports',
        label: '신고 검토',
        count: pendingReportsSnapshot.data().count,
        priority: pendingReportsSnapshot.data().count > 10 ? 'high' : 'medium',
        icon: 'FiAlertTriangle',
        onClick: () => {
          // 신고 관리 탭으로 이동하는 로직
          console.log('신고 검토 페이지로 이동');
        }
      });
    }

    // 보안 알림이 있으면 빠른 액션 추가
    if (recentSecurityAlertsSnapshot.data().count > 0) {
      actions.push({
        id: 'security-review',
        label: '보안 검토',
        count: recentSecurityAlertsSnapshot.data().count,
        priority: 'high',
        icon: 'FiShield',
        onClick: () => {
          // 보안 모니터링 탭으로 이동하는 로직
          console.log('보안 모니터링 페이지로 이동');
        }
      });
    }

    // 시스템 백업 액션 (예시)
    actions.push({
      id: 'system-backup',
      label: '시스템 백업',
      priority: 'low',
      icon: 'FiDownload',
      onClick: () => {
        console.log('시스템 백업 시작');
      }
    });

    return actions;
  } catch (error) {
    console.error('빠른 액션 생성 실패:', error);
    return [];
  }
}

/**
 * 데이터 내보내기 유틸리티
 */
export function exportToCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) {
    throw new Error('내보낼 데이터가 없습니다.');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // CSV 이스케이프 처리
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * 날짜 범위 유틸리티
 */
export function getDateRange(period) {
  const now = new Date();
  const ranges = {
    today: {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      end: now
    },
    week: {
      start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: now
    },
    month: {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: now
    },
    year: {
      start: new Date(now.getFullYear(), 0, 1),
      end: now
    }
  };

  return ranges[period] || ranges.week;
} 