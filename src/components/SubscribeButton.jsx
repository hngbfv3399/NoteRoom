/**
 * 구독 버튼 컴포넌트
 * 
 * 주요 기능:
 * - 사용자 구독/구독취소
 * - 구독 상태 실시간 표시
 * - 구독자 수 표시
 * - 로딩 상태 및 애니메이션
 * - 테마 시스템 적용
 * 
 * NOTE: 자신의 프로필에서는 표시되지 않음
 * TODO: 구독자 목록 모달 추가
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { auth } from '@/services/firebase';
import { 
  subscribeToUser, 
  unsubscribeFromUser, 
  checkSubscriptionStatus 
} from '@/utils/subscriptionUtils';

function SubscribeButton({ targetUserId, targetUserName, subscriberCount = 0, onSubscriptionChange }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSubscriberCount, setCurrentSubscriberCount] = useState(subscriberCount);
  
  // 테마 상태
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // 현재 사용자
  const currentUser = auth.currentUser;
  const isOwnProfile = currentUser?.uid === targetUserId;

  // 구독 상태 확인
  useEffect(() => {
    const checkStatus = async () => {
      if (!currentUser || isOwnProfile) return;

      try {
        const status = await checkSubscriptionStatus(currentUser.uid, targetUserId);
        setIsSubscribed(status);
      } catch (error) {
        console.error('구독 상태 확인 실패:', error);
      }
    };

    checkStatus();
  }, [currentUser, targetUserId, isOwnProfile]);

  // 구독/구독취소 핸들러
  const handleSubscriptionToggle = async () => {
    if (!currentUser || isOwnProfile || isLoading) return;

    setIsLoading(true);

    try {
      if (isSubscribed) {
        // 구독 취소
        await unsubscribeFromUser(currentUser.uid, targetUserId);
        setIsSubscribed(false);
        setCurrentSubscriberCount(prev => Math.max(0, prev - 1));
        
        // 부모 컴포넌트에 변경 알림
        onSubscriptionChange?.(false, currentSubscriberCount - 1);
      } else {
        // 구독
        await subscribeToUser(currentUser.uid, targetUserId);
        setIsSubscribed(true);
        setCurrentSubscriberCount(prev => prev + 1);
        
        // 부모 컴포넌트에 변경 알림
        onSubscriptionChange?.(true, currentSubscriberCount + 1);
      }
    } catch (error) {
      console.error('구독 처리 실패:', error);
      alert('구독 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 자신의 프로필이거나 로그인하지 않은 경우 표시하지 않음
  if (isOwnProfile || !currentUser) {
    return null;
  }

  return (
    <motion.div
      className="flex flex-col items-center space-y-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 구독 버튼 */}
      <motion.button
        onClick={handleSubscriptionToggle}
        disabled={isLoading}
        className={`
          relative px-6 py-3 rounded-full font-semibold text-sm
          transition-all duration-200 transform
          ${isSubscribed 
            ? `${currentTheme?.buttonSecondaryBg || 'bg-gray-500'} ${currentTheme?.buttonSecondaryText || 'text-white'} hover:bg-gray-600` 
            : `${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:bg-blue-600`
          }
          ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
          shadow-lg hover:shadow-xl
          disabled:transform-none disabled:hover:scale-100
        `}
        whileHover={{ scale: isLoading ? 1 : 1.05 }}
        whileTap={{ scale: isLoading ? 1 : 0.95 }}
      >
        {/* 로딩 스피너 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* 버튼 텍스트 */}
        <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
          {isSubscribed ? (
            <>
              <span className="mr-1">✓</span>
              구독 중
            </>
          ) : (
            <>
              <span className="mr-1">➕</span>
              구독하기
            </>
          )}
        </span>
      </motion.button>

      {/* 구독자 수 표시 */}
      <motion.div
        className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'} text-center`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="font-medium">구독자</span>
        <span className="ml-1 font-bold text-lg">
          {currentSubscriberCount.toLocaleString()}
        </span>
        <span className="ml-1">명</span>
      </motion.div>

      {/* 구독 상태 메시지 */}
      {isSubscribed && (
        <motion.div
          className={`text-xs ${currentTheme?.textSecondary || 'text-gray-500'} text-center`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {targetUserName}님의 새 노트를 알림으로 받아보세요
        </motion.div>
      )}
    </motion.div>
  );
}

SubscribeButton.propTypes = {
  targetUserId: PropTypes.string.isRequired,
  targetUserName: PropTypes.string.isRequired,
  subscriberCount: PropTypes.number,
  onSubscriptionChange: PropTypes.func,
};

export default SubscribeButton; 