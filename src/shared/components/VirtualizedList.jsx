/**
 * 가상화 리스트 컴포넌트
 * - 대량 데이터 처리 최적화
 * - 메모리 사용량 최소화
 * - 무한 스크롤 지원
 * - 동적 높이 지원
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { FixedSizeList as List, VariableSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

const VirtualizedList = memo(({
  items = [],
  itemHeight = 60,
  containerHeight = 400,
  hasNextPage = false,
  isNextPageLoading = false,
  loadNextPage,
  renderItem,
  getItemSize,
  overscan = 5,
  className = '',
  emptyMessage = '데이터가 없습니다.',
  loadingMessage = '로딩 중...',
  variableHeight = false,
  onScroll,
  ...props
}) => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const listRef = useRef(null);
  const itemSizeCache = useRef(new Map());

  // 아이템이 로드되었는지 확인
  const isItemLoaded = useCallback((index) => {
    return !!items[index];
  }, [items]);

  // 아이템 개수 (로딩 중인 아이템 포함)
  const itemCount = hasNextPage ? items.length + 1 : items.length;

  // 동적 높이 계산
  const getItemHeight = useCallback((index) => {
    if (variableHeight && getItemSize) {
      const cached = itemSizeCache.current.get(index);
      if (cached) return cached;
      
      const size = getItemSize(index, items[index]);
      itemSizeCache.current.set(index, size);
      return size;
    }
    return itemHeight;
  }, [variableHeight, getItemSize, itemHeight, items]);

  // 스크롤 핸들러
  const handleScroll = useCallback(({ scrollOffset: offset }) => {
    setScrollOffset(offset);
    onScroll?.(offset);
  }, [onScroll]);

  // 아이템 렌더러
  const ItemRenderer = useCallback(({ index, style }) => {
    const isLoading = index >= items.length;
    
    if (isLoading) {
      return (
        <div style={style} className="flex items-center justify-center p-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500">{loadingMessage}</span>
          </div>
        </div>
      );
    }

    const item = items[index];
    if (!item) return null;

    return (
      <div style={style}>
        {renderItem({ item, index, style })}
      </div>
    );
  }, [items, renderItem, loadingMessage]);

  // 캐시 초기화 (아이템 변경 시)
  useEffect(() => {
    if (variableHeight) {
      itemSizeCache.current.clear();
      listRef.current?.resetAfterIndex(0);
    }
  }, [items, variableHeight]);

  // 빈 상태
  if (items.length === 0 && !isNextPageLoading) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <span className="text-gray-500">{emptyMessage}</span>
      </div>
    );
  }

  const ListComponent = variableHeight ? VariableSizeList : List;

  return (
    <div className={`${className}`}>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadNextPage || (() => Promise.resolve())}
        threshold={3} // 3개 아이템 전에 미리 로드
      >
        {({ onItemsRendered, ref }) => (
          <ListComponent
            ref={(list) => {
              listRef.current = list;
              ref(list);
            }}
            height={containerHeight}
            itemCount={itemCount}
            itemSize={variableHeight ? getItemHeight : itemHeight}
            onItemsRendered={onItemsRendered}
            onScroll={handleScroll}
            overscanCount={overscan}
            {...props}
          >
            {ItemRenderer}
          </ListComponent>
        )}
      </InfiniteLoader>
      
      {/* 스크롤 위치 표시 (개발용) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Scroll: {Math.round(scrollOffset)}px
        </div>
      )}
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

export default VirtualizedList; 