/**
 * 카테고리 필터링을 위한 배너 컴포넌트 (리팩토링됨)
 * 
 * 주요 기능:
 * - 카테고리별 필터 버튼 제공
 * - 반응형 버튼 크기 조정 (커스텀 훅 사용)
 * - 가로 스크롤 지원 (모바일)
 * - 선택된 카테고리 시각적 표시
 * 
 * NOTE: 반응형 로직을 커스텀 훅으로 분리하여 코드 간소화
 * TODO: 카테고리 추가/삭제 시 애니메이션 효과 고려
 */
import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import ThemedButton from "@/components/ui/ThemedButton";
import { useResponsiveButtonWidth } from "@/hooks/useResponsiveButtonWidth";

// 카테고리 필터 UI 컴포넌트 (메모이제이션으로 성능 최적화)
const CategoryBanner = memo(function CategoryBanner({ 
  category, 
  setFilterCategory, 
  filterCategory 
}) {
  // 반응형 버튼 너비 조정 커스텀 훅
  const containerRef = useResponsiveButtonWidth(category.length, 16);
  
  // 카테고리 버튼 클릭 시 필터 상태 갱신
  // NOTE: "전체" 선택 시 null로 설정하여 모든 카테고리 표시
  const handleClick = useCallback((item) => {
    setFilterCategory(item === "전체" ? null : item);
  }, [setFilterCategory]);

  return (
    <nav 
      ref={containerRef}
      className="w-full px-4 py-3"
      aria-label="카테고리 네비게이션"
    >
      {/* 가로 스크롤이 가능한 버튼 목록 */}
      <div className="flex gap-4 md:gap-4 overflow-x-auto hide-scrollbar">
        {category.map((item) => {
          // 현재 선택된 카테고리인지 확인
          const isSelected = (filterCategory === null && item === "전체") || filterCategory === item;

          return (
            <ThemedButton
              key={item}
              onClick={() => handleClick(item)}
              className={`flex-shrink-0 h-[40px] rounded-lg flex items-center justify-center transition-all
                ${isSelected ? "!text-white font-bold shadow-md" : "opacity-70 hover:opacity-100"}
                whitespace-nowrap text-sm md:text-base`}
              aria-current={isSelected ? 'page' : undefined}
            >
              {item}
            </ThemedButton>
          );
        })}
      </div>
    </nav>
  );
});

// PropTypes 정의로 타입 안정성 확보
CategoryBanner.propTypes = {
  category: PropTypes.arrayOf(PropTypes.string).isRequired,
  setFilterCategory: PropTypes.func.isRequired,
  filterCategory: PropTypes.string,
};

// 기본값 설정
CategoryBanner.defaultProps = {
  filterCategory: null,
};

export default CategoryBanner;
