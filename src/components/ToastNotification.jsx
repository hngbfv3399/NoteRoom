/**
 * 토스트 알림 컴포넌트
 * 
 * 주요 기능:
 * - 실시간 토스트 메시지 표시
 * - 자동 사라짐 (5초 후)
 * - 여러 알림 스택 관리
 * - 클릭으로 수동 닫기
 * - 테마 시스템 적용
 * 
 * NOTE: 전역 상태로 관리되어 앱 전체에서 사용
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function ToastNotification() {
  const [toasts, setToasts] = useState([]);

  // 토스트 제거 함수
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // 토스트 추가 함수 (전역에서 호출 가능하도록)
  useEffect(() => {
    // 전역 함수로 등록
    window.showToast = (message, type = 'info', duration = 5000) => {
      const id = Date.now() + Math.random();
      const newToast = {
        id,
        message,
        type, // 'success', 'error', 'warning', 'info'
        duration
      };

      setToasts(prev => [...prev, newToast]);

      // 자동 제거
      setTimeout(() => {
        removeToast(id);
      }, duration);
    };

    return () => {
      delete window.showToast;
    };
  }, []);

  // 토스트 타입별 스타일
  const getToastStyle = (type) => {
    const baseStyle = "flex items-center p-4 rounded-lg shadow-lg border-l-4 min-w-[300px] max-w-[400px]";
    
    switch (type) {
      case 'success':
        return `${baseStyle} bg-green-50 border-green-500 text-green-800`;
      case 'error':
        return `${baseStyle} bg-red-50 border-red-500 text-red-800`;
      case 'warning':
        return `${baseStyle} bg-yellow-50 border-yellow-500 text-yellow-800`;
      case 'info':
      default:
        return `${baseStyle} bg-blue-50 border-blue-500 text-blue-800`;
    }
  };

  // 토스트 타입별 아이콘
  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={getToastStyle(toast.type)}
            onClick={() => removeToast(toast.id)}
            style={{ cursor: 'pointer' }}
          >
            {/* 아이콘 */}
            <div className="flex-shrink-0 mr-3">
              {getToastIcon(toast.type)}
            </div>

            {/* 메시지 */}
            <div className="flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastNotification; 