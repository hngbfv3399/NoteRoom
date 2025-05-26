/**
 * 반응형 버튼 너비 조정을 위한 커스텀 훅
 * 
 * 기능:
 * - 화면 크기에 따른 버튼 너비 자동 조정
 * - 모바일: 고정 너비 + 가로 스크롤
 * - 데스크톱: 컨테이너에 맞춰 균등 분할
 * 
 * NOTE: ResizeObserver 사용으로 성능 최적화
 * TODO: 디바운싱 추가로 리사이즈 이벤트 최적화
 */
import { useEffect, useRef } from 'react';

export const useResponsiveButtonWidth = (itemCount, gap = 16) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateButtonWidths = () => {
      const containerWidth = container.offsetWidth;
      const buttons = container.querySelectorAll('button');
      
      if (buttons.length === 0) return;

      // 모바일 브레이크포인트 (768px)
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        // 모바일: 고정 너비로 가로 스크롤 허용
        buttons.forEach(button => {
          button.style.width = '120px';
          button.style.minWidth = '120px';
        });
      } else {
        // 데스크톱: 컨테이너 너비에 맞춰 균등 분할
        const totalGap = (buttons.length - 1) * gap;
        const buttonWidth = Math.max(
          100, // 최소 너비
          (containerWidth - totalGap) / buttons.length
        );
        
        buttons.forEach(button => {
          button.style.width = `${buttonWidth}px`;
          button.style.minWidth = `${buttonWidth}px`;
        });
      }
    };

    // 초기 실행
    updateButtonWidths();

    // ResizeObserver를 사용하여 컨테이너 크기 변화 감지
    let resizeObserver;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(updateButtonWidths);
      resizeObserver.observe(container);
    } else {
      // ResizeObserver 미지원 시 window resize 이벤트 사용
      window.addEventListener('resize', updateButtonWidths);
    }

    // 정리 함수
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', updateButtonWidths);
      }
    };
  }, [itemCount, gap]);

  return containerRef;
}; 