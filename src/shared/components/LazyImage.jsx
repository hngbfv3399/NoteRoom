/**
 * 최적화된 이미지 컴포넌트
 * - Lazy loading 지원
 * - WebP 포맷 자동 감지
 * - 플레이스홀더 및 에러 처리
 * - Intersection Observer 사용
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { useSelector } from 'react-redux';

const LazyImage = memo(({
  src,
  alt,
  className = '',
  placeholder = '/images/placeholder.svg',
  errorImage = '/images/error.svg',
  width,
  height,
  quality = 80,
  loading = 'lazy',
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageStatus, setImageStatus] = useState('loading'); // loading, loaded, error
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // WebP 지원 확인
  const supportsWebP = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  };

  // 최적화된 이미지 URL 생성
  const getOptimizedImageUrl = (originalSrc) => {
    if (!originalSrc || originalSrc.startsWith('data:')) return originalSrc;
    
    // Firebase Storage URL인 경우 크기 조정 파라미터 추가
    if (originalSrc.includes('firebasestorage.googleapis.com')) {
      const url = new URL(originalSrc);
      if (width) url.searchParams.set('w', width);
      if (height) url.searchParams.set('h', height);
      url.searchParams.set('q', quality);
      
      // WebP 지원 시 포맷 변경
      if (supportsWebP()) {
        url.searchParams.set('fm', 'webp');
      }
      
      return url.toString();
    }
    
    return originalSrc;
  };

  // Intersection Observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 이미지 로드
  useEffect(() => {
    if (!isInView || !src) return;

    const optimizedSrc = getOptimizedImageUrl(src);
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(optimizedSrc);
      setImageStatus('loaded');
      onLoad?.();
    };
    
    img.onerror = () => {
      setImageSrc(errorImage);
      setImageStatus('error');
      onError?.();
    };
    
    img.src = optimizedSrc;
  }, [isInView, src, width, height, quality, errorImage, onLoad, onError]);

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <img
        src={imageSrc}
        alt={alt}
        loading={loading}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageStatus === 'loaded' ? 'opacity-100' : 'opacity-70'
        }`}
        {...props}
      />
      
      {/* 로딩 스피너 */}
      {imageStatus === 'loading' && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* 에러 상태 */}
      {imageStatus === 'error' && (
        <div className={`absolute inset-0 flex items-center justify-center ${currentTheme?.inputBg || 'bg-gray-100'}`}>
          <span className={`text-sm ${currentTheme?.textSecondary || 'text-gray-500'}`}>
            이미지를 불러올 수 없습니다
          </span>
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage; 