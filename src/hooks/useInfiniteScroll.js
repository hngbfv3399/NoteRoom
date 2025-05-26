import { useEffect, useRef, useState, useCallback } from 'react';

export const useInfiniteScroll = ({
  fetchMore,
  hasMore = false,
  threshold = 0.8,
  rootMargin = '20px',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef(null);
  const targetRef = useRef(null);

  const handleObserver = useCallback(
    async (entries) => {
      const target = entries[0];

      // TODO: 요소가 화면에 보이고 있고, 아직 로딩 중이 아니며, 더 불러올 데이터가 있을 때만 fetchMore 실행
      if (target.isIntersecting && hasMore && !isLoading) {
        setIsLoading(true);
        try {
          await fetchMore();
        } catch (error) {
          console.error('Error fetching more items:', error); // FIXME: 에러 핸들링을 사용자에게도 보여줄 수 있도록 개선 필요
        } finally {
          setIsLoading(false);
        }
      }
    },
    [fetchMore, hasMore, isLoading]
  );

  useEffect(() => {
    const options = {
      root: null,
      rootMargin,
      threshold,
    };

    observerRef.current = new IntersectionObserver(handleObserver, options);

    const currentTarget = targetRef.current;

    if (currentTarget) {
      observerRef.current.observe(currentTarget); // TODO: 타겟 요소가 mount 되었을 때 관찰 시작
    }

    return () => {
      if (currentTarget && observerRef.current) {
        observerRef.current.unobserve(currentTarget); // TODO: 언마운트 시 관찰 중단
      }
    };
  }, [handleObserver, rootMargin, threshold]);

  return { targetRef, isLoading }; // TODO: targetRef는 관찰 대상 요소에 연결, isLoading은 로딩 상태 표시용
};

export default useInfiniteScroll;
