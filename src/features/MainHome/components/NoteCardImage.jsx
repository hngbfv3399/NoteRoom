/**
 * 노트 카드의 이미지 영역 컴포넌트
 * 
 * 기능:
 * - 이미지 로딩 및 에러 처리
 * - 레이지 로딩 지원
 * - 호버 효과 및 그라데이션 오버레이
 * 
 * NOTE: 이미지 로딩 실패 시 기본 플레이스홀더 표시
 * TODO: 이미지 최적화, WebP 지원 추가
 */
import React, { useState, memo } from 'react';
import PropTypes from 'prop-types';

const NoteCardImage = memo(function NoteCardImage({ 
  src, 
  alt, 
  className = "relative h-1/2 w-full bg-gray-100" 
}) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={className}>
      {src && !imageError ? (
        <>
          {/* 로딩 스켈레톤 */}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          
          {/* 실제 이미지 */}
          <img
            src={src}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
            onLoad={handleImageLoad}
            alt={alt}
            loading="lazy"
          />
        </>
      ) : (
        /* 이미지 없음 플레이스홀더 */
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">No Image</span>
          </div>
        </div>
      )}
      
      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80" />
    </div>
  );
});

NoteCardImage.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default NoteCardImage; 