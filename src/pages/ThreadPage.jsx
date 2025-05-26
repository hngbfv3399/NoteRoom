/**
 * 스레드(세로 스크롤) 페이지 컴포넌트
 * 
 * 주요 기능:
 * - 세로 스크롤 방식의 노트 피드 (TikTok/Instagram Reels 스타일)
 * - 무한 스크롤로 노트 로딩
 * - 스냅 스크롤로 한 번에 하나의 노트만 표시
 * - 모바일 터치 스크롤 최적화
 * - 테마 시스템 적용
 * - 성능 최적화 및 메모리 관리
 * 
 * NOTE: 스크롤 가속도 제어로 부드러운 UX 제공
 * TODO: 비디오 자동재생 기능, 키보드 네비게이션
 * FIXME: 메모리 누수 방지 강화
 */
import React, { useEffect, useRef, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { useNotesInfinite } from "@/hooks/useNotesInfinite";
import ThreadSlide from "@/features/ThreadPage/ThreadSlide";
import ThreadSkeleton from "@/features/ThreadPage/ThreadSkeleton";
import { AiOutlineWarning } from "react-icons/ai";
import { IoRefreshOutline, IoArrowUpOutline } from "react-icons/io5";
import useMobileHeightFix from "@/hooks/useMobileHeightFix";
import { AnimatePresence } from "framer-motion";
import { getThemeClass } from "@/utils/themeHelper";
import "@/styles/ThreadPage.css";
import { useLocation } from "react-router-dom";
import { ROUTES } from '@/constants/routes';

function ThreadPage() {
  // 무한 스크롤 노트 데이터 관리
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    isFetchingNextPage,
    error,
    refetch
  } = useNotesInfinite(12); // 페이지당 12개 노트로 조정 (더 자연스러운 스크롤)
  
  // DOM 참조
  const observerRef = useRef(); // Intersection Observer 타겟
  const containerRef = useRef(); // 스크롤 컨테이너
  
  // 상태 관리
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const themeClass = getThemeClass(currentTheme);
  
  // 네비게이션 및 위치 정보
  const location = useLocation();
  
  // 모바일 뷰포트 높이 이슈 해결
  useMobileHeightFix();

  // 글 작성 후 돌아왔을 때 새로고침
  useEffect(() => {
    if (location.state?.refreshNeeded) {
      refetch();
      // state 정리 (뒤로가기 시 중복 새로고침 방지)
      window.history.replaceState({}, document.title);
    }
  }, [location.state, refetch]);

  // Header + Navbar 높이를 뺀 실제 컨텐츠 높이 계산
  const getContentHeight = () => {
    return window.innerHeight - 128; // Header(64px) + Navbar(64px) = 128px
  };

  // 스크롤 상태 추적
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      
      // 스크롤 시작 시 바로 버튼 숨기기 (50px 이상 스크롤 시)
      setShowScrollTop(scrollTop > 50);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 모바일 터치 스크롤 가속도 제어 및 제스처 개선
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY;
    let startTime;
    let isVerticalSwipe = false;

    // 터치 시작 지점 기록
    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
      startTime = Date.now();
      isVerticalSwipe = false;
    };

    // 터치 이동 중 속도 제어 및 방향 감지
    const handleTouchMove = (e) => {
      if (!startY) return;

      const currentY = e.touches[0].clientY;
      const deltaY = Math.abs(currentY - startY);
      const timeDiff = Date.now() - startTime;
      
      // 수직 스와이프 감지
      if (deltaY > 10) {
        isVerticalSwipe = true;
      }
      
      // 스크롤 속도가 너무 빠르면 제한 (부드러운 스크롤을 위해)
      if (isVerticalSwipe && deltaY / timeDiff > 1.5) {
        e.preventDefault();
      }
    };

    // 터치 종료 시 상태 초기화
    const handleTouchEnd = () => {
      startY = null;
      startTime = null;
      isVerticalSwipe = false;
    };

    // 이벤트 리스너 등록
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    // 정리 함수
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // 무한 스크롤을 위한 Intersection Observer 콜백
  const handleIntersect = useCallback((entries) => {
    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Intersection Observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, { 
      threshold: 0.1, // 10% 보일 때 트리거 (더 빠른 로딩)
      rootMargin: '300px' // 300px 미리 로딩으로 끊김 없는 스크롤
    });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [handleIntersect]);

  // 맨 위로 스크롤
  const scrollToTop = () => {
    containerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 새로고침
  const handleRefresh = () => {
    refetch();
    scrollToTop();
  };

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e) => {
      const container = containerRef.current;
      if (!container) return;

      const slideHeight = getContentHeight();
      
      switch (e.key) {
        case 'ArrowDown':
        case ' ': // 스페이스바
          e.preventDefault();
          container.scrollBy({ top: slideHeight, behavior: 'smooth' });
          break;
        case 'ArrowUp':
          e.preventDefault();
          container.scrollBy({ top: -slideHeight, behavior: 'smooth' });
          break;
        case 'Home':
          e.preventDefault();
          scrollToTop();
          break;
        case 'End':
          e.preventDefault();
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 모든 페이지의 노트를 평탄화
  const allNotes = data?.pages.flatMap(page => page?.notes || []) || [];

  // 초기 로딩 상태
  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-128px)] overflow-y-auto snap-y snap-mandatory hide-scrollbar bg-gray-900">
        {Array.from({ length: 3 }).map((_, idx) => (
          <ThreadSkeleton key={`skeleton-${idx}`} />
        ))}
      </div>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <div 
        className={`flex flex-col items-center justify-center p-4 ${themeClass}`}
        style={{ height: 'calc(100vh - 128px)' }}
      >
        <div
          className="text-center max-w-md"
        >
          <AiOutlineWarning className="text-6xl text-red-500 mb-4 mx-auto" />
          <h2 className={`text-xl font-bold mb-2 ${currentTheme?.textColor || 'text-red-700'}`}>
            데이터를 불러오는데 실패했습니다
          </h2>
          <p className={`mb-6 ${currentTheme?.textColor || 'text-red-600'}`}>
            {error?.message || "알 수 없는 오류가 발생했습니다"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={handleRefresh}
              className={`flex items-center justify-center px-6 py-3 rounded-lg transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90`}
            >
              <IoRefreshOutline className="mr-2" />
              다시 시도
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className={`px-6 py-3 rounded-lg border transition-all duration-200 ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-700'} hover:opacity-70`}
            >
              홈으로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (allNotes.length === 0) {
    return (
      <div 
        className={`flex flex-col items-center justify-center p-4 ${themeClass}`}
        style={{ height: 'calc(100vh - 128px)' }}
      >
        <div
          className="text-center max-w-md"
        >
          <div className="text-6xl mb-4">📱</div>
          <h2 className={`text-xl font-bold mb-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
            아직 스레드가 없습니다
          </h2>
          <p className={`mb-6 opacity-70 ${currentTheme?.textColor || 'text-gray-600'}`}>
            첫 번째 노트를 작성해서 스레드를 시작해보세요!
          </p>
          <button 
            onClick={() => window.location.href = ROUTES.WRITE}
            className={`px-6 py-3 rounded-lg transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90`}
          >
            노트 작성하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* 메인 스크롤 컨테이너 */}
      <div 
        ref={containerRef}
        className={`thread-container w-full overflow-y-auto snap-y snap-mandatory hide-scrollbar ${currentTheme?.bgColor || 'bg-gray-900'}`}
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch', // iOS 스크롤 최적화
          height: 'calc(100vh - 128px)'
        }}
        role="main"
        aria-label="스레드 피드"
        tabIndex={0}
      >
        {/* 노트 슬라이드 렌더링 */}
        {allNotes.map((item, index) => (
          <ThreadSlide 
            key={item.id || `slide-${index}`} 
            item={item}
          />
        ))}
        
        {/* 무한 스크롤 트리거 요소 */}
        <div 
          ref={observerRef} 
          className="h-px w-full bg-transparent"
          aria-hidden="true"
        />
        
        {/* 추가 로딩 인디케이터 */}
        {isFetchingNextPage && (
          <div
            className="w-full flex items-center justify-center"
            style={{ height: 'calc(100vh - 128px)' }}
          >
            <div className="text-center">
              <div className={`inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${currentTheme?.buttonBg || 'border-white'} mb-4`} />
              <p className="text-white text-lg font-medium">더 많은 스레드를 불러오는 중...</p>
            </div>
          </div>
        )}

        {/* 마지막 페이지 안내 */}
        {!hasNextPage && allNotes.length > 0 && (
          <div
            className="w-full flex items-center justify-center"
            style={{ height: 'calc(100vh - 128px)' }}
          >
            <div className="text-center p-8">
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-white text-lg font-medium mb-2">모든 스레드를 확인했습니다!</p>
              <p className="text-white/70 text-sm mb-6">새로운 노트를 작성해보세요</p>
              <button
                onClick={() => window.location.href = ROUTES.WRITE}
                className="px-6 py-3 bg-white/20 text-white rounded-lg backdrop-blur-sm hover:bg-white/30 transition-all"
              >
                노트 작성하기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 플로팅 액션 버튼들 */}
      <AnimatePresence>
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="thread-floating-button fixed bottom-24 right-4 z-30 text-white p-3 rounded-full transition-all"
            aria-label="맨 위로 스크롤"
          >
            <IoArrowUpOutline className="text-xl" />
          </button>
        )}
      </AnimatePresence>

      {/* 키보드 힌트 (데스크톱에서만) */}
    </div>
  );
}

export default ThreadPage;
