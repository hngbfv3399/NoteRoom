import React, { useState, useEffect } from 'react';
import { checkFirebaseConnection } from '@/services/firebase';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowAlert(false);
      // 온라인 상태가 되면 Firebase 연결 확인
      checkFirebaseConnection()
        .then(setIsFirebaseConnected)
        .catch(() => setIsFirebaseConnected(false));
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsFirebaseConnected(false);
      setShowAlert(true);
    };

    // 네트워크 상태 이벤트 리스너
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 주기적으로 Firebase 연결 상태 확인 (30초마다)
    const checkConnection = async () => {
      if (navigator.onLine) {
        try {
          const connected = await checkFirebaseConnection();
          setIsFirebaseConnected(connected);
          
          // Firebase 연결이 끊어진 경우에만 알림 표시
          if (!connected && isFirebaseConnected) {
            setShowAlert(true);
          } else if (connected && !isFirebaseConnected) {
            setShowAlert(false);
          }
        } catch (error) {
          console.warn('Firebase 연결 확인 중 오류:', error);
          setIsFirebaseConnected(false);
        }
      }
    };

    // 초기 연결 상태 확인
    checkConnection();

    // 30초마다 연결 상태 확인
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isFirebaseConnected]);

  // 알림 자동 숨김 (5초 후)
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  if (!showAlert || (isOnline && isFirebaseConnected)) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
        <span className="text-sm font-medium">
          {!isOnline 
            ? '인터넷 연결을 확인해주세요' 
            : '서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.'
          }
        </span>
      </div>
    </div>
  );
};

export default NetworkStatus; 