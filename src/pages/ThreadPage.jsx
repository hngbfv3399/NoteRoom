import React, { useEffect, useRef, useCallback } from "react";
import { useNotesInfinite } from "@/hooks/useNotesInfinite";
import ThreadSlide from "@/features/ThreadPage/ThreadSlide";
import { AiOutlineWarning } from "react-icons/ai";
import useMobileHeightFix from "@/hooks/useMobileHeightFix";
import SkeletonCard from "@/components/SkeletonCard";
function ThreadPage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    isFetchingNextPage,
    error
  } = useNotesInfinite(10);
  
  const observerRef = useRef();
  const containerRef = useRef();
  
  // 모바일 높이 수정 훅 적용
  useMobileHeightFix();

  // 스크롤 가속도 제어
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY;
    let startTime;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
      startTime = Date.now();
    };

    const handleTouchMove = (e) => {
      if (!startY) return;

      const currentY = e.touches[0].clientY;
      const timeDiff = Date.now() - startTime;
      const distance = Math.abs(currentY - startY);
      
      // 스크롤 속도가 너무 빠르면 제한
      if (distance / timeDiff > 2) { // 초당 2px 이상이면 제한
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      startY = null;
      startTime = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Intersection Observer 설정
  const handleIntersect = useCallback((entries) => {
    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, { 
      threshold: 0.5,
      rootMargin: '100px'
    });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [handleIntersect]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-2xl space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-128px)] p-4 bg-red-50">
        <AiOutlineWarning className="text-6xl text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-700 mb-2">데이터를 불러오는데 실패했습니다</h2>
        <p className="text-red-600 text-center mb-4">{error?.message || "알 수 없는 오류가 발생했습니다"}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          새로고침
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full min-h-[calc(100vh-128px)] overflow-y-auto snap-y snap-mandatory hide-scrollbar bg-gray-900"
      style={{
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
        height: 'calc(100% - 128px)'
      }}
    >
      {data?.pages.map((page, pageIndex) =>
        page?.notes.map((item, itemIndex) => (
          <ThreadSlide 
            key={item.id || `${pageIndex}-${itemIndex}`} 
            item={item}
          />
        ))
      )}
      <div 
        ref={observerRef} 
        className="h-px w-full bg-transparent"
        aria-hidden="true"
      />
      {isFetchingNextPage && (
        <div className="min-h-[calc(100vh-128px)] w-full flex items-center justify-center">
          <SkeletonCard/>
        </div>
      )}
    </div>
  );
}

export default ThreadPage;
