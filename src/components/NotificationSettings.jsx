/**
 * 알림 설정 컴포넌트
 * 사용자가 푸시 알림 권한 및 설정을 관리할 수 있습니다.
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  getNotificationPermission, 
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  registerServiceWorker
} from '@/utils/pushNotificationUtils';

function NotificationSettings() {
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 테마 상태
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // 컴포넌트 마운트 시 현재 상태 확인
  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    // Service Worker 등록 상태 확인
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.pushManager) {
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }
      } catch (error) {
        console.error('구독 상태 확인 실패:', error);
      }
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    
    try {
      // Service Worker 등록
      await registerServiceWorker();
      
      // 알림 권한 요청
      const granted = await requestNotificationPermission();
      
      if (granted) {
        // 푸시 구독 생성
        const subscription = await subscribeToPush();
        if (subscription) {
          setIsSubscribed(true);
          setPermission('granted');
          
          // 성공 알림
          if (typeof window !== 'undefined' && window.showToast) {
            window.showToast('푸시 알림이 활성화되었습니다! 🔔', 'success');
          }
        }
      } else {
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast('알림 권한이 거부되었습니다.', 'error');
        }
      }
    } catch (error) {
      console.error('알림 활성화 실패:', error);
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('알림 설정 중 오류가 발생했습니다.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    
    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
        
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast('푸시 알림이 비활성화되었습니다.', 'info');
        }
      }
    } catch (error) {
      console.error('알림 비활성화 실패:', error);
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('알림 설정 중 오류가 발생했습니다.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionText = () => {
    switch (permission) {
      case 'granted':
        return '허용됨';
      case 'denied':
        return '거부됨';
      case 'default':
        return '설정되지 않음';
      case 'not-supported':
        return '지원되지 않음';
      default:
        return '알 수 없음';
    }
  };

  const getPermissionColor = () => {
    switch (permission) {
      case 'granted':
        return 'text-green-600';
      case 'denied':
        return 'text-red-600';
      case 'default':
        return 'text-yellow-600';
      case 'not-supported':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (permission === 'not-supported') {
    return (
      <div className={`p-4 rounded-lg border ${currentTheme?.borderColor || 'border-gray-200'} ${currentTheme?.cardBg || 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-2 ${currentTheme?.textColor || 'text-gray-900'}`}>
          푸시 알림
        </h3>
        <p className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'}`}>
          이 브라우저는 푸시 알림을 지원하지 않습니다.
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${currentTheme?.borderColor || 'border-gray-200'} ${currentTheme?.cardBg || 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${currentTheme?.textColor || 'text-gray-900'}`}>
        푸시 알림 설정
      </h3>
      
      {/* 현재 상태 표시 */}
      <div className="mb-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'}`}>
            알림 권한:
          </span>
          <span className={`text-sm font-medium ${getPermissionColor()}`}>
            {getPermissionText()}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'}`}>
            푸시 구독:
          </span>
          <span className={`text-sm font-medium ${isSubscribed ? 'text-green-600' : 'text-gray-600'}`}>
            {isSubscribed ? '활성화됨' : '비활성화됨'}
          </span>
        </div>
      </div>

      {/* 설명 */}
      <div className={`mb-4 p-3 rounded-lg ${currentTheme?.highlightBg || 'bg-blue-50'}`}>
        <p className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'}`}>
          푸시 알림을 활성화하면 새로운 댓글, 멘션, 노트 등의 알림을 실시간으로 받을 수 있습니다.
          브라우저가 닫혀있어도 알림을 받을 수 있습니다.
        </p>
      </div>

      {/* 알림 타입별 설명 */}
      <div className="mb-4">
        <h4 className={`text-sm font-medium mb-2 ${currentTheme?.textColor || 'text-gray-900'}`}>
          받을 수 있는 알림:
        </h4>
        <ul className={`text-sm space-y-1 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
          <li>• 💬 새로운 댓글</li>
          <li>• ↩️ 답글 알림</li>
          <li>• 📢 멘션 알림</li>
          <li>• 📝 구독한 사용자의 새 노트</li>
        </ul>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        {permission === 'granted' && !isSubscribed && (
          <button
            onClick={handleEnableNotifications}
            disabled={isLoading}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${currentTheme?.primaryBg || 'bg-blue-600'} 
              ${currentTheme?.primaryText || 'text-white'}
              hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isLoading ? '설정 중...' : '푸시 알림 활성화'}
          </button>
        )}
        
        {permission !== 'granted' && (
          <button
            onClick={handleEnableNotifications}
            disabled={isLoading}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${currentTheme?.primaryBg || 'bg-blue-600'} 
              ${currentTheme?.primaryText || 'text-white'}
              hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isLoading ? '설정 중...' : '알림 권한 요청'}
          </button>
        )}
        
        {isSubscribed && (
          <button
            onClick={handleDisableNotifications}
            disabled={isLoading}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors border
              ${currentTheme?.borderColor || 'border-gray-300'}
              ${currentTheme?.textColor || 'text-gray-700'}
              hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isLoading ? '설정 중...' : '푸시 알림 비활성화'}
          </button>
        )}
        
        <button
          onClick={checkNotificationStatus}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-colors border
            ${currentTheme?.borderColor || 'border-gray-300'}
            ${currentTheme?.textColor || 'text-gray-700'}
            hover:bg-gray-50
          `}
        >
          상태 새로고침
        </button>
      </div>

      {/* 권한이 거부된 경우 안내 */}
      {permission === 'denied' && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">
            알림 권한이 거부되었습니다. 브라우저 설정에서 알림 권한을 허용해주세요.
          </p>
          <p className="text-xs text-red-600 mt-1">
            Chrome: 주소창 왼쪽 자물쇠 아이콘 → 알림 → 허용
          </p>
        </div>
      )}
    </div>
  );
}

export default NotificationSettings; 