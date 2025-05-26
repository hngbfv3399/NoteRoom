/**
 * 신고 버튼 컴포넌트
 * 콘텐츠에 신고 기능을 추가하기 위한 버튼입니다.
 */

import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { FiFlag } from 'react-icons/fi';
import ReportModal from './ReportModal';
import { selectTextColor, selectInputBorder } from '@/store/selectors';
import { auth } from '@/services/firebase';

function ReportButton({ 
  contentType, 
  contentId, 
  contentTitle,
  className = '',
  size = 'sm',
  variant = 'ghost' // 'ghost', 'outline', 'solid'
}) {
  const [showReportModal, setShowReportModal] = useState(false);
  
  // 개별 selector 사용으로 안정적인 참조 보장
  const textColor = useSelector(selectTextColor);
  const inputBorder = useSelector(selectInputBorder);

  // 신고 버튼 클릭 핸들러
  const handleReportClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Firebase Auth에서 직접 현재 사용자 확인
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    setShowReportModal(true);
  };

  // 크기별 스타일
  const sizeStyles = {
    xs: 'p-1 text-xs',
    sm: 'p-2 text-sm',
    md: 'p-3 text-base',
    lg: 'p-4 text-lg'
  };

  // 변형별 스타일 - useMemo로 메모이제이션
  const variantStyles = useMemo(() => ({
    ghost: `hover:bg-gray-100 ${textColor || 'text-gray-500'} hover:text-red-500`,
    outline: `border ${inputBorder || 'border-gray-300'} ${textColor || 'text-gray-600'} hover:border-red-500 hover:text-red-500 hover:bg-red-50`,
    solid: 'bg-red-100 text-red-600 hover:bg-red-200'
  }), [textColor, inputBorder]);

  return (
    <>
      <button
        onClick={handleReportClick}
        className={`
          inline-flex items-center justify-center rounded-lg transition-colors
          ${sizeStyles[size]}
          ${variantStyles[variant]}
          ${className}
        `}
        title="신고하기"
      >
        <FiFlag className={size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-sm' : 'text-base'} />
        {size !== 'xs' && (
          <span className="ml-1">신고</span>
        )}
      </button>

      {/* 신고 모달 */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType={contentType}
        contentId={contentId}
        contentTitle={contentTitle}
      />
    </>
  );
}

export default ReportButton; 