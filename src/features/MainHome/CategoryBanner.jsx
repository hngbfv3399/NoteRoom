import React, { memo, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import ThemedButton from "@/components/ui/ThemedButton";

const CategoryBanner = memo(function CategoryBanner({ 
  category, 
  setFilterCategory, 
  filterCategory 
}) {
  const containerRef = useRef(null);
  
  const handleClick = useCallback((item) => {
    setFilterCategory(item === "전체" ? null : item);
  }, [setFilterCategory]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateButtonWidths = () => {
      const containerWidth = container.offsetWidth;
      const buttons = container.querySelectorAll('button');
      const buttonCount = buttons.length;
      
      // 모바일에서는 스크롤 가능하게, 데스크톱에서는 자동으로 너비 조절
      if (window.innerWidth < 768) {
        buttons.forEach(button => {
          button.style.width = '120px';
        });
      } else {
        // 버튼 사이의 간격 (gap)을 고려한 계산
        const totalGap = (buttonCount - 1) * 16; // gap-4는 16px
        const buttonWidth = (containerWidth - totalGap) / buttonCount;
        
        buttons.forEach(button => {
          button.style.width = `${buttonWidth}px`;
        });
      }
    };

    // 초기 실행 및 리사이즈 이벤트에 대한 처리
    updateButtonWidths();
    window.addEventListener('resize', updateButtonWidths);

    return () => {
      window.removeEventListener('resize', updateButtonWidths);
    };
  }, [category.length]);

  return (
    <nav 
      ref={containerRef}
      className="w-full px-4 py-3"
      aria-label="카테고리 네비게이션"
    >
      <div className="flex gap-4 md:gap-4 overflow-x-auto md:overflow-x-hidden hide-scrollbar">
        {category.map((item) => {
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

CategoryBanner.propTypes = {
  category: PropTypes.arrayOf(PropTypes.string).isRequired,
  setFilterCategory: PropTypes.func.isRequired,
  filterCategory: PropTypes.string,
};

CategoryBanner.defaultProps = {
  filterCategory: null,
};

export default CategoryBanner;