/**
 * 메인 콘텐츠 영역 컴포넌트 (무한 스크롤 방식)
 * 
 * 주요 기능:
 * - 초기 4개 노트 로드 후 스크롤 감지로 자동 추가 로드
 * - 노트 클릭 시 독립 페이지로 이동 (공유 가능)
 * - 로딩, 에러, 빈 상태 처리
 * 
 * NOTE: 페이지 이동 방식으로 변경하여 공유 기능 지원
 * PERFORMANCE: 스크롤 감지로 자동 로드하되 초기 로드는 4개로 제한
 */
import React, { useImperativeHandle, forwardRef, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNotesInfinite } from "@/hooks/useNotesInfinite";
import { useNoteInteraction } from "@/hooks/useNoteInteraction";
import LoadingSpinner from "@/components/LoadingPage";

// 분리된 컴포넌트들 import
import ErrorDisplay from "./components/ErrorDisplay";
import EmptyState from "./components/EmptyState";
import NoteGrid from "./components/NoteGrid";
import LoadingState from "./components/LoadingState";

const MainContent = forwardRef((props, ref) => {
  const observerRef = useRef();
  
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // 무한 스크롤 노트 데이터 관리 - 초기 4개만 로드
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useNotesInfinite(4); // 페이지당 4개로 설정

  // 노트 상호작용 관리 (클릭 → 페이지 이동으로 공유 가능)
  const { handleNoteClick } = useNoteInteraction({ 
    useModal: false,  // 페이지 이동 사용 (공유 가능한 URL)
    enableViewIncrement: true 
  });

  // 모든 페이지의 노트를 평탄화
  const allNotes = data?.pages.flatMap((page) => page.notes) ?? [];

  // Intersection Observer를 사용한 무한 스크롤
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // 외부에서 호출할 수 있는 새로고침 함수
  const refreshData = async () => {
    await refetch();
  };

  // ref를 통해 외부에서 refreshData 함수에 접근할 수 있도록 설정
  useImperativeHandle(ref, () => ({
    refreshData
  }));

  // 로딩 상태 처리
  if (isLoading) {
    return <LoadingState count={4} />;
  }

  // 에러 상태 처리
  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* 노트 목록 또는 빈 상태 */}
      {allNotes.length > 0 ? (
        <NoteGrid notes={allNotes} onNoteClick={handleNoteClick} />
      ) : (
        <EmptyState />
      )}

      {/* 무한 스크롤 트리거 요소 */}
      <div 
        ref={observerRef} 
        className="h-px w-full bg-transparent"
        aria-hidden="true"
      />

      {/* 로딩 인디케이터 */}
      {isFetchingNextPage && (
        <div className="w-full flex justify-center py-4">
          <div className="flex items-center space-x-2">
            <LoadingSpinner />
            <span className={`text-sm ${currentTheme?.textColor || 'text-gray-500'}`}>
              더 많은 노트를 불러오는 중...
            </span>
          </div>
        </div>
      )}

      {/* 마지막 페이지 안내 */}
      {!hasNextPage && allNotes.length > 0 && (
        <p className={`text-center py-4 ${currentTheme?.textColor || 'text-gray-500'}`}>
          모든 노트를 불러왔습니다
        </p>
      )}
    </div>
  );
});

MainContent.displayName = 'MainContent';

export default MainContent;
