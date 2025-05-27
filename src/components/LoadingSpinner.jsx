/**
 * 로딩 스피너 컴포넌트
 * 
 * 주요 기능:
 * - 다양한 크기 지원
 * - 테마 색상 적용
 * - 접근성 지원
 * - 커스터마이징 가능
 */
import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  color = 'blue',
  className = '',
  text = ''
}) => {
  // 크기별 클래스
  const getSizeClass = (size) => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      case 'xl':
        return 'w-12 h-12';
      case 'md':
      default:
        return 'w-6 h-6';
    }
  };

  // 색상별 클래스
  const getColorClass = (color) => {
    switch (color) {
      case 'white':
        return 'border-white';
      case 'gray':
        return 'border-gray-500';
      case 'red':
        return 'border-red-500';
      case 'green':
        return 'border-green-500';
      case 'yellow':
        return 'border-yellow-500';
      case 'blue':
      default:
        return 'border-blue-500';
    }
  };

  const sizeClass = getSizeClass(size);
  const colorClass = getColorClass(color);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`${sizeClass} border-2 border-t-transparent ${colorClass} rounded-full animate-spin`}
        role="status"
        aria-label="로딩 중"
      />
      {text && (
        <span className="mt-2 text-sm text-gray-600" aria-live="polite">
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner; 