/**
 * 알림 벨 컴포넌트
 * 
 * 주요 기능:
 * - 읽지 않은 알림 개수 표시
 * - 알림 목록 드롭다운
 * - 실시간 알림 업데이트
 * - 알림 읽음 처리
 * - 테마 시스템 적용
 * 
 * NOTE: 헤더에 배치되어 전역적으로 사용
 * TODO: 푸시 알림 연동, 알림 설정 페이지
 */

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { auth } from '@/services/firebase';
import { 
  getUserNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '@/utils/notificationUtils';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  // 테마 상태
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // 현재 사용자
  const currentUser = auth.currentUser;

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 알림 데이터 로딩
  const loadNotifications = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const [notificationList, count] = await Promise.all([
        getUserNotifications(currentUser.uid, 10), // 최근 10개
        getUnreadNotificationCount(currentUser.uid)
      ]);

      setNotifications(notificationList);
      setUnreadCount(count);
    } catch (error) {
      console.error('알림 로딩 실패:', error);
      
      // 인덱스 빌드 중인 경우 사용자에게 알림
      if (error.code === 'failed-precondition' || error.message.includes('index is currently building')) {
        // 토스트는 이미 notificationUtils에서 표시되므로 여기서는 조용히 처리
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 알림 로딩
  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  // 주기적으로 알림 업데이트 (30초마다)
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // 알림 클릭 핸들러
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error);
      }
    }

    // 알림 드롭다운 닫기
    setIsOpen(false);

    // 알림 타입에 따른 페이지 이동
    if (notification.noteId) {
      // 새 노트 알림이거나 노트 ID가 있는 알림인 경우
      window.location.href = `/note/${notification.noteId}`;
    } else if (notification.contentId && notification.contentType === 'note') {
      // 댓글, 멘션 등 노트 관련 알림인 경우
      window.location.href = `/note/${notification.contentId}`;
    } else if (notification.fromUser && (notification.type === 'follow' || notification.type === 'like')) {
      // 팔로우, 좋아요 등 사용자 관련 알림인 경우만 프로필로 이동
      window.location.href = `/profile/${notification.fromUser}`;
    } else {
      // 기본적으로 홈으로 이동
      window.location.href = '/';
    }
  };

  // 모든 알림 삭제
  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0) return;

    try {
      const result = await markAllNotificationsAsRead(currentUser.uid);
      if (result.success) {
        // 알림 목록 비우기
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('모든 알림 삭제 실패:', error);
    }
  };

  // 알림 벨 클릭 핸들러
  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifications(); // 드롭다운 열 때 최신 알림 로딩
    }
  };

  // 알림 시간 포맷팅
  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return notificationTime.toLocaleDateString('ko-KR');
  };

  // 알림 타입별 아이콘
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment':
        return '💬';
      case 'reply':
        return '↩️';
      case 'mention':
        return '📢';
      case 'new_note':
        return '📝';
      case 'like':
        return '❤️';
      case 'follow':
        return '👥';
      default:
        return '🔔';
    }
  };

  // 로그인하지 않은 경우 표시하지 않음
  if (!currentUser) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 알림 벨 버튼 */}
      <button
        onClick={handleBellClick}
        className={`
          relative p-2 rounded-full transition-all duration-200
          ${currentTheme?.buttonBg || 'bg-gray-100'} 
          ${currentTheme?.buttonText || 'text-gray-700'}
          hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500
        `}
      >
        {/* 벨 아이콘 */}
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>

        {/* 읽지 않은 알림 개수 배지 */}
        {unreadCount > 0 && (
          <div
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* 알림 드롭다운 */}
      <AnimatePresence>
        {isOpen && (
          <div
            className={`
              absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto
              ${currentTheme?.modalBgColor || 'bg-white'} 
              rounded-lg shadow-xl border border-gray-200 z-50
            `}
          >
            {/* 헤더 */}
            <div className={`p-4 border-b border-gray-200 ${currentTheme?.textPrimary || 'text-gray-900'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">알림</h3>
                  {notifications.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      총 {notifications.length}개의 알림 (읽지 않음: {unreadCount}개)
                    </p>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className={`text-sm ${currentTheme?.linkColor || 'text-red-600'} hover:underline`}
                  >
                    모두 삭제
                  </button>
                )}
              </div>
            </div>

            {/* 알림 목록 */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">알림을 불러오는 중...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-2">🔔</div>
                  <p className={`text-sm ${currentTheme?.textSecondary || 'text-gray-500'}`}>
                    새로운 알림이 없습니다
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      p-4 border-b border-gray-100 cursor-pointer transition-colors
                      ${notification.isRead 
                        ? 'hover:bg-gray-50' 
                        : `${currentTheme?.highlightBg || 'bg-blue-50'} hover:bg-blue-100`
                      }
                    `}
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                  >
                    <div className="flex items-start space-x-3">
                      {/* 알림 아이콘 */}
                      <div className="text-lg flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* 알림 내용 */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* 읽지 않음 표시 */}
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 푸터 */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: 알림 설정 페이지로 이동
                  }}
                  className={`text-sm ${currentTheme?.linkColor || 'text-blue-600'} hover:underline`}
                >
                  모든 알림 보기
                </button>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationBell; 