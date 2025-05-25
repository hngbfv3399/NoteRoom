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
      if (target.isIntersecting && hasMore && !isLoading) {
        setIsLoading(true);
        try {
          await fetchMore();
        } catch (error) {
          console.error('Error fetching more items:', error);
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
      observerRef.current.observe(currentTarget);
    }

    return () => {
      if (currentTarget && observerRef.current) {
        observerRef.current.unobserve(currentTarget);
      }
    };
  }, [handleObserver, rootMargin, threshold]);

  return { targetRef, isLoading };
};

export default useInfiniteScroll; 