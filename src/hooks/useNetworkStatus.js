/**
 * 네트워크 상태 모니터링 훅
 * - 온라인/오프라인 상태 감지
 * - 연결 품질 모니터링
 * - 재연결 시도 관리
 */

import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState('unknown');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionQuality('good');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
    };

    // 연결 품질 체크 (실험적 기능)
    const checkConnectionQuality = async () => {
      if (!navigator.onLine) {
        setConnectionQuality('offline');
        return;
      }

      try {
        const start = Date.now();
        await fetch('/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        const duration = Date.now() - start;
        
        if (duration < 200) {
          setConnectionQuality('excellent');
        } else if (duration < 500) {
          setConnectionQuality('good');
        } else if (duration < 1000) {
          setConnectionQuality('fair');
        } else {
          setConnectionQuality('poor');
        }
      } catch {
        setConnectionQuality('poor');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 주기적으로 연결 품질 체크 (5분마다)
    const qualityInterval = setInterval(checkConnectionQuality, 5 * 60 * 1000);
    
    // 초기 연결 품질 체크
    checkConnectionQuality();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(qualityInterval);
    };
  }, []);

  return { isOnline, connectionQuality };
}

// 기본 내보내기 (기존 코드와의 호환성)
export default function useNetworkStatusSimple() {
  const { isOnline } = useNetworkStatus();
  return isOnline;
} 