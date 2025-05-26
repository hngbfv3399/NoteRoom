import React from 'react';
import { useSelector } from 'react-redux';

function ThreadSkeleton() {
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  return (
    <div 
      className="thread-slide relative w-full snap-start flex items-center justify-center overflow-hidden"
      style={{ height: 'calc(100vh - 128px)' }}
    >
      {/* 배경 스켈레톤 */}
      <div className={`absolute inset-0 ${currentTheme?.modalBgColor || 'bg-gray-200'} thread-skeleton-pulse`} />
      
      {/* 오버레이 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />

      {/* 상단 네비게이션 스켈레톤 */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        {/* 뒤로가기 버튼 스켈레톤 */}
        <div className="w-12 h-12 bg-white/20 rounded-full thread-skeleton-pulse" />
        
        {/* 카테고리 뱃지 스켈레톤 */}
        <div className="w-16 h-6 bg-white/20 rounded-full thread-skeleton-pulse" />
      </div>

      {/* 우측 액션 버튼들 스켈레톤 */}
      <div className="absolute right-4 bottom-32 flex flex-col space-y-4 z-20">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col items-center space-y-1">
            <div className="w-12 h-12 bg-white/20 rounded-full thread-skeleton-pulse" />
            <div className="w-6 h-3 bg-white/20 rounded thread-skeleton-pulse" />
          </div>
        ))}
      </div>

      {/* 하단 콘텐츠 영역 스켈레톤 */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4 z-10">
        {/* 작성자 정보 스켈레톤 */}
        <div className="flex items-center space-x-3 mb-4">
          {/* 프로필 이미지 스켈레톤 */}
          <div className="w-10 h-10 bg-white/20 rounded-full thread-skeleton-pulse" />
          
          <div className="space-y-1">
            <div className="w-20 h-4 bg-white/20 rounded thread-skeleton-pulse" />
            <div className="w-16 h-3 bg-white/20 rounded thread-skeleton-pulse" />
          </div>
        </div>

        {/* 제목 스켈레톤 */}
        <div className="space-y-2">
          <div className="w-3/4 h-8 bg-white/20 rounded thread-skeleton-pulse" />
          <div className="w-1/2 h-6 bg-white/20 rounded thread-skeleton-pulse" />
        </div>

        {/* 스와이프 힌트 스켈레톤 */}
        <div className="flex items-center justify-center mt-4">
          <div className="w-48 h-4 bg-white/20 rounded thread-skeleton-pulse" />
        </div>
      </div>
    </div>
  );
}

export default ThreadSkeleton; 