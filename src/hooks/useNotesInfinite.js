import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { loadNotesPageOptimized } from "@/utils/firebaseNoteDataUtil";
import { 
  selectFilterCategory, 
  selectSortType, 
  selectNoteQueryKey
} from "@/store/selectors";
import { 
  recordQueryTime,
  incrementCacheHit
} from "@/store/notes/slice";

export function useNotesInfinite(pageSize = 10) {
  const dispatch = useDispatch();
  
  // 🚀 메모이제이션된 selector 사용 - 불필요한 리렌더링 방지
  const filterCategory = useSelector(selectFilterCategory);
  const sortType = useSelector(selectSortType);
  const queryKey = useSelector(selectNoteQueryKey);

  // 성능 모니터링: React Query 훅 호출 추적 (초기화 시에만)
  const isInitialCall = React.useRef(true);
  if (window.performanceMonitor && isInitialCall.current) {
    window.performanceMonitor.trackCacheMiss(['notesInfinite', filterCategory, sortType]);
    isInitialCall.current = false;
  }

  return useInfiniteQuery({
    queryKey, // 메모이제이션된 키 사용
    queryFn: async ({ pageParam }) => {
      const startTime = performance.now();
      
      // 성능 모니터링: 네트워크 요청 시작 추적
      
      try {
        const result = await loadNotesPageOptimized(
          pageParam, 
          pageSize, 
          null, 
          filterCategory, 
          sortType, 
          'main'
        );
        
        const endTime = performance.now();
        const queryTime = endTime - startTime;
        
        // 성능 통계 기록
        dispatch(recordQueryTime(queryTime));
        
        // 성능 모니터링: 쿼리 완료 로그
        console.log('📊 [Performance] React Query 완료:', {
          queryTime: `${queryTime.toFixed(2)}ms`,
          notesCount: result.notes.length,
          hasNextPage: !!result.lastVisible,
          cacheStatus: 'miss'
        });
        
        return result;
      } catch (error) {
        console.error('📊 [Performance] React Query 실패:', {
          error: error.message,
          queryTime: `${(performance.now() - startTime).toFixed(2)}ms`
        });
        throw error;
      }
    },
    getNextPageParam: (lastPage) => lastPage.lastVisible ?? undefined,
    
    // 🔥 최적화된 캐시 설정
    staleTime: 1000 * 60 * 30, // 30분 - 데이터가 신선하다고 간주하는 시간
    cacheTime: 1000 * 60 * 60, // 1시간 - 메모리에 캐시 유지 시간
    
    // 🚫 불필요한 refetch 비활성화
    refetchOnWindowFocus: false, // 윈도우 포커스 시 refetch 안함
    refetchOnMount: false, // 컴포넌트 마운트 시 refetch 안함 (캐시 우선)
    refetchInterval: false, // 주기적 refetch 안함
    refetchOnReconnect: false, // 네트워크 재연결 시 refetch 안함
    
    // 🔄 에러 처리
    retry: (failureCount, error) => {
      // 인덱스 오류는 재시도하지 않음
      if (error.message?.includes('requires an index')) {
        return false;
      }
      // 최대 2번까지만 재시도
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // 📊 성능 모니터링
    onSuccess: (data) => {
      // 캐시 히트 기록 (중복 방지)
      dispatch(incrementCacheHit());
      if (window.performanceMonitor) {
        window.performanceMonitor.trackCacheHit(['notesInfinite', filterCategory, sortType]);
      }
      
      // 성능 모니터링: 캐시 히트 로그 (간소화)
      console.log('✅ [Performance] React Query 성공:', {
        pages: data.pages.length,
        notes: data.pages.reduce((sum, page) => sum + page.notes.length, 0)
      });
    },
    
    onError: (error) => {
      console.error('📊 [Performance] React Query 에러:', {
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
    }
  });
}
