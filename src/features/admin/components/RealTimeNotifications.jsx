/**
 * 실시간 알림 시스템 컴포넌트
 * 실제 Firebase 이벤트를 기반으로 알림을 표시합니다.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiUser, 
  FiFileText, 
  FiMessageCircle, 
  FiAlertTriangle,
  FiSettings,
  FiVolume2,
  FiVolumeX,
  FiX,
  FiClock,
  FiActivity,
  FiShield
} from 'react-icons/fi';
import { db } from '@/services/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot
} from 'firebase/firestore';

function RealTimeNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [lastActivity, setLastActivity] = useState(new Date());
  const audioRef = useRef(null);

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // Firebase 실시간 리스너 설정
  useEffect(() => {
    const unsubscribers = [];

    // 새로운 사용자 등록 감지
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const userData = change.doc.data();
          const now = new Date();
          const createdAt = userData.createdAt?.toDate() || now;
          
          // 최근 1분 내 생성된 사용자만 알림
          if (now - createdAt < 60000) {
            addNotification({
              id: `user-${change.doc.id}`,
              type: 'user',
              title: '새 사용자 등록',
              message: `${userData.displayName || '익명 사용자'}님이 가입했습니다`,
              timestamp: createdAt,
              priority: 'low'
            });
          }
        }
      });
    });

    // 새로운 노트 작성 감지
    const notesQuery = query(
      collection(db, 'notes'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const noteData = change.doc.data();
          const now = new Date();
          const createdAt = noteData.createdAt?.toDate() || now;
          
          // 최근 1분 내 생성된 노트만 알림
          if (now - createdAt < 60000) {
            addNotification({
              id: `note-${change.doc.id}`,
              type: 'note',
              title: '새 노트 작성',
              message: `"${noteData.title?.substring(0, 30) || '제목 없음'}..." 노트가 작성되었습니다`,
              timestamp: createdAt,
              priority: 'medium'
            });
          }
        }
      });
    });

    // 시스템 성능 모니터링 (5분마다)
    const performanceInterval = setInterval(() => {
      checkSystemPerformance();
    }, 5 * 60 * 1000);

    unsubscribers.push(unsubscribeUsers, unsubscribeNotes);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
      clearInterval(performanceInterval);
    };
  }, []);

  // 시스템 성능 체크
  const checkSystemPerformance = async () => {
    try {
      // 메모리 사용량 체크
      if ('memory' in performance) {
        const memory = performance.memory;
        const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (memoryUsage > 85) {
          addNotification({
            id: `memory-${Date.now()}`,
            type: 'warning',
            title: '메모리 사용량 경고',
            message: `메모리 사용량이 ${Math.round(memoryUsage)}%에 도달했습니다`,
            timestamp: new Date(),
            priority: 'high'
          });
        }
      }

      // Firebase 연결 상태 체크
      try {
        const testQuery = query(collection(db, 'notes'), limit(1));
        const startTime = performance.now();
        await new Promise((resolve, reject) => {
          const unsubscribe = onSnapshot(testQuery, 
            () => {
              unsubscribe();
              resolve();
            },
            (error) => {
              unsubscribe();
              reject(error);
            }
          );
        });
        const responseTime = performance.now() - startTime;

        if (responseTime > 2000) {
          addNotification({
            id: `firebase-slow-${Date.now()}`,
            type: 'warning',
            title: 'Firebase 응답 지연',
            message: `데이터베이스 응답시간이 ${Math.round(responseTime)}ms입니다`,
            timestamp: new Date(),
            priority: 'medium'
          });
        }
      } catch {
        addNotification({
          id: `firebase-error-${Date.now()}`,
          type: 'error',
          title: 'Firebase 연결 오류',
          message: '데이터베이스 연결에 문제가 발생했습니다',
          timestamp: new Date(),
          priority: 'high'
        });
      }
    } catch (error) {
      console.error('성능 체크 실패:', error);
    }
  };

  // 알림 추가
  const addNotification = (notification) => {
    setNotifications(prev => {
      // 중복 알림 방지
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;

      const newNotifications = [notification, ...prev].slice(0, 50); // 최대 50개 유지
      
      // 사운드 재생
      if (soundEnabled && notification.priority !== 'low') {
        playNotificationSound();
      }

      // 브라우저 알림 (권한이 있는 경우)
      if (Notification.permission === 'granted' && notification.priority === 'high') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }

      setLastActivity(new Date());
      return newNotifications;
    });
  };

  // 알림 사운드 재생
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  };

  // 알림 제거
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // 모든 알림 제거
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // 브라우저 알림 권한 요청
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  // 컴포넌트 마운트 시 알림 권한 요청
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // 알림 타입별 아이콘
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'user': return FiUser;
      case 'note': return FiFileText;
      case 'comment': return FiMessageCircle;
      case 'warning': return FiAlertTriangle;
      case 'error': return FiAlertTriangle;
      case 'system': return FiShield;
      default: return FiActivity;
    }
  };

  // 알림 타입별 색상
  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'text-red-600 bg-red-100';
    
    switch (type) {
      case 'user': return 'text-blue-600 bg-blue-100';
      case 'note': return 'text-green-600 bg-green-100';
      case 'comment': return 'text-purple-600 bg-purple-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'system': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    
    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className={`rounded-xl border shadow-sm ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <FiActivity className={`w-5 h-5 ${currentTheme?.textColor || 'text-gray-700'}`} />
              <h3 className={`font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
                실시간 활동
              </h3>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className={`text-xs ${currentTheme?.textColor || 'text-gray-500'}`}>
                실시간 연결됨
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 사운드 토글 */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled 
                  ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
                  : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
              }`}
              title={soundEnabled ? '사운드 끄기' : '사운드 켜기'}
            >
              {soundEnabled ? <FiVolume2 className="w-4 h-4" /> : <FiVolumeX className="w-4 h-4" />}
            </button>

            {/* 모두 지우기 */}
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
              >
                모두 지우기
              </button>
            )}

            {/* 확장/축소 */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 rounded-lg transition-colors ${currentTheme?.inputBg || 'bg-gray-100'} hover:bg-gray-200`}
            >
              <FiSettings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 마지막 활동 시간 */}
        <div className="flex items-center space-x-2 mt-2">
          <FiClock className="w-3 h-3 text-gray-400" />
          <span className={`text-xs ${currentTheme?.textColor || 'text-gray-500'}`}>
            마지막 활동: {formatTime(lastActivity)}
          </span>
        </div>
      </div>

      {/* 알림 목록 */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <FiActivity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className={`text-sm ${currentTheme?.textColor || 'text-gray-500'}`}>
                실시간 활동을 모니터링 중입니다...
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification.type, notification.priority);
                
                return (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-start space-x-3">
                      {/* 아이콘 */}
                      <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                            {notification.title}
                          </h4>
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-all"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </div>
                        <p className={`text-xs mt-1 ${currentTheme?.textColor || 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs ${currentTheme?.textColor || 'text-gray-500'}`}>
                            {formatTime(notification.timestamp)}
                          </span>
                          {notification.priority === 'high' && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
                              긴급
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 알림 사운드 */}
      <audio
        ref={audioRef}
        preload="auto"
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
      />
    </div>
  );
}

export default RealTimeNotifications; 