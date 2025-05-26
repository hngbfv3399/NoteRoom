/**
 * 프로필 페이지 스켈레톤 로딩 컴포넌트
 * 
 * 주요 기능:
 * - 프로필 페이지 로딩 중 스켈레톤 UI 표시
 * - 테마 시스템 적용
 * - 반응형 디자인
 * - 애니메이션 효과
 * - 두 섹션 레이아웃 (프로필 + 노트)
 * 
 * NOTE: 실제 컴포넌트 구조와 유사한 스켈레톤 제공
 * TODO: 다양한 스켈레톤 패턴 추가
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { getThemeClass } from '@/utils/themeHelper';

function ProfileSkeleton() {
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const themeClass = currentTheme ? getThemeClass(currentTheme) : "";

  return (
    <div className={`min-h-screen ${themeClass}`}>
      {/* 섹션 1: 프로필 정보 스켈레톤 */}
      <section className="relative flex flex-col py-8 sm:py-12 lg:py-16">
        {/* 배경 스켈레톤 - 저작권 걱정 없는 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 animate-pulse" />
        
        {/* 프로필 정보 카드 스켈레톤 */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-4xl mx-auto">
            <div className="backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/20 bg-white/20">
              {/* 시간 스켈레톤 */}
              <div className="text-center mb-6">
                <div className="h-8 sm:h-10 bg-white/30 rounded-lg animate-pulse mb-2" />
                <div className="h-3 bg-white/20 rounded animate-pulse w-16 mx-auto" />
              </div>
              
              {/* 이름 스켈레톤 */}
              <div className="h-10 bg-white/30 rounded-lg animate-pulse mb-6 w-48 mx-auto" />
              
              {/* 프로필 이미지 스켈레톤 */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/30 rounded-full animate-pulse" />
              </div>

              {/* 감정 온도 섹션 스켈레톤 */}
              <div className="text-center mb-6 p-4 rounded-xl bg-white/10 border border-white/20">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-white/30 rounded-full animate-pulse" />
                  <div className="h-8 bg-white/30 rounded animate-pulse w-20" />
                </div>
                <div className="h-6 bg-white/20 rounded animate-pulse w-32 mx-auto mb-3" />
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="h-2 bg-white/40 rounded-full w-3/4 animate-pulse" />
                </div>
                <div className="flex justify-between mt-1">
                  <div className="h-3 bg-white/20 rounded animate-pulse w-12" />
                  <div className="h-3 bg-white/20 rounded animate-pulse w-12" />
                </div>
              </div>
              
              {/* 정보 그리드 스켈레톤 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="p-3 rounded-lg bg-white/10 border border-white/10">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white/30 rounded animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 bg-white/20 rounded animate-pulse mb-1 w-20" />
                        <div className="h-5 bg-white/30 rounded animate-pulse w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 추가 정보 스켈레톤 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-6">
                {[...Array(2)].map((_, index) => (
                  <div key={index} className="p-3 sm:p-4 rounded-lg bg-white/10 border border-white/10">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-white/30 rounded animate-pulse mt-0.5" />
                      <div className="flex-1">
                        <div className="h-4 bg-white/20 rounded animate-pulse mb-2 w-24" />
                        <div className="h-4 bg-white/30 rounded animate-pulse w-full mb-1" />
                        <div className="h-4 bg-white/30 rounded animate-pulse w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 통계 정보 스켈레톤 */}
              <div className="p-3 sm:p-4 rounded-lg text-center bg-white/10 border border-white/10">
                <div className="h-8 bg-white/30 rounded animate-pulse mb-2 w-16 mx-auto" />
                <div className="h-4 bg-white/20 rounded animate-pulse w-20 mx-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* 하단 스크롤 안내 스켈레톤 */}
        <div className="relative z-20 text-center pb-8">
          <div className="max-w-md mx-auto">
            <div className="h-4 bg-white/30 rounded animate-pulse mb-4 w-32 mx-auto" />
            <div className="w-8 h-8 bg-white/30 rounded-full animate-pulse mx-auto mb-2" />
            <div className="h-3 bg-white/20 rounded animate-pulse w-24 mx-auto" />
          </div>
        </div>
      </section>

      {/* 섹션 2: 노트 목록 스켈레톤 */}
      <section className={`min-h-screen ${currentTheme?.sectionBg || 'bg-gray-50'}`}>
        {/* 섹션 헤더 스켈레톤 */}
        <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 border-b border-gray-200/50 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* 프로필 아바타 스켈레톤 */}
                <div className={`w-12 h-12 rounded-full animate-pulse ${currentTheme?.skeletonBg || 'bg-gray-200'}`} />
                
                <div>
                  <div className={`h-6 rounded animate-pulse mb-1 w-32 ${currentTheme?.skeletonBg || 'bg-gray-200'}`} />
                  <div className={`h-4 rounded animate-pulse w-20 ${currentTheme?.skeletonBg || 'bg-gray-200'}`} />
                </div>
              </div>

              {/* 상단 이동 버튼 스켈레톤 */}
              <div className={`w-9 h-9 rounded-full animate-pulse ${currentTheme?.skeletonBg || 'bg-gray-200'}`} />
            </div>
          </div>
        </div>

        {/* 노트 그리드 스켈레톤 */}
        <div className="py-8 px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className={`rounded-xl shadow-md overflow-hidden border ${currentTheme?.cardBg || 'bg-white'} ${currentTheme?.cardBorder || 'border-gray-200'}`}
              >
                <div className="p-4 sm:p-5 h-48 flex flex-col">
                  {/* 제목 스켈레톤 */}
                  <div className={`h-6 rounded animate-pulse mb-3 ${currentTheme?.skeletonBg || 'bg-gray-200'}`} />
                  
                  {/* 내용 스켈레톤 */}
                  <div className="flex-1 mb-4 space-y-2">
                    <div className={`h-4 rounded animate-pulse ${currentTheme?.skeletonBg || 'bg-gray-200'}`} />
                    <div className={`h-4 rounded animate-pulse w-4/5 ${currentTheme?.skeletonBg || 'bg-gray-200'}`} />
                    <div className={`h-4 rounded animate-pulse w-3/5 ${currentTheme?.skeletonBg || 'bg-gray-200'}`} />
                  </div>
                  
                  {/* 메타 정보 스켈레톤 */}
                  <div className="flex items-center justify-between">
                    <div className={`h-4 rounded animate-pulse w-20 ${currentTheme?.skeletonBg || 'bg-gray-200'}`} />
                    <div className={`h-5 rounded-full animate-pulse w-16 ${currentTheme?.skeletonBg || 'bg-gray-200'}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProfileSkeleton; 