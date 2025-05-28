/**
 * 최적화된 데이터 테이블 컴포넌트
 * - 가상화 지원으로 대량 데이터 처리
 * - 메모이제이션 적용
 * - 접근성 향상
 * - 성능 최적화
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useSelector } from 'react-redux';
import { FixedSizeList as List } from 'react-window';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiChevronsLeft, 
  FiChevronsRight,
  FiSearch,
  FiFilter,
  FiArrowUp,
  FiArrowDown,
  FiRefreshCw,
  FiDownload
} from 'react-icons/fi';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const ROW_HEIGHT = 60; // 가상화를 위한 행 높이

// 가상화된 테이블 행 컴포넌트
const VirtualizedRow = memo(({ index, style, data }) => {
  const { items, columns, selectedItems, onSelectItem, currentTheme, selectable } = data;
  const item = items[index];

  if (!item) return null;

  return (
    <div 
      style={style} 
      className={`flex items-center border-b ${currentTheme?.inputBorder || 'border-gray-200'} ${currentTheme?.hoverBg || 'hover:bg-gray-50'} transition-colors`}
    >
      {/* 선택 체크박스 */}
      {selectable && (
        <div className="w-12 flex justify-center">
          <input
            type="checkbox"
            checked={selectedItems.has(item.id)}
            onChange={(e) => onSelectItem(item.id, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      )}

      {/* 데이터 셀 */}
      {columns.map((column) => (
        <div
          key={column.key}
          className={`flex-1 px-4 py-3 text-sm ${currentTheme?.textColor || 'text-gray-900'} ${column.className || ''}`}
          style={{ minWidth: column.minWidth || 'auto' }}
        >
          {column.render ? column.render(item[column.key], item) : item[column.key]}
        </div>
      ))}
    </div>
  );
});

VirtualizedRow.displayName = 'VirtualizedRow';

const OptimizedDataTable = memo(({
  data = [],
  columns = [],
  loading = false,
  onRefresh,
  onExport,
  searchable = true,
  filterable = true,
  sortable = true,
  selectable = false,
  onSelectionChange,
  virtualized = false,
  maxHeight = 400,
  className = '',
  emptyMessage = '데이터가 없습니다.',
  loadingMessage = '데이터를 불러오는 중...'
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [selectedItems, setSelectedItems] = useState(new Set());

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // 데이터 필터링 및 검색 (메모이제이션)
  const filteredData = useMemo(() => {
    let result = [...data];

    // 검색 적용
    if (searchTerm && searchable) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(item =>
        columns.some(column => {
          const value = item[column.key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // 필터 적용
    if (filterable) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          result = result.filter(item => {
            const itemValue = item[key];
            if (Array.isArray(value)) {
              return value.includes(itemValue);
            }
            return itemValue === value;
          });
        }
      });
    }

    return result;
  }, [data, searchTerm, filters, columns, searchable, filterable]);

  // 데이터 정렬 (메모이제이션)
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortable) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [filteredData, sortConfig, sortable]);

  // 페이지네이션 적용 (가상화가 아닌 경우에만)
  const paginatedData = useMemo(() => {
    if (virtualized) return sortedData;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage, virtualized]);

  // 페이지 정보 계산
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, sortedData.length);

  // 정렬 처리
  const handleSort = useCallback((key) => {
    if (!sortable) return;
    
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, [sortable]);

  // 페이지 변경
  const handlePageChange = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // 선택 처리
  const handleSelectItem = useCallback((itemId, checked) => {
    if (!selectable) return;

    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    
    setSelectedItems(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  }, [selectedItems, selectable, onSelectionChange]);

  // 전체 선택/해제
  const handleSelectAll = useCallback((checked) => {
    if (!selectable) return;

    const newSelected = checked 
      ? new Set(paginatedData.map(item => item.id))
      : new Set();
    
    setSelectedItems(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  }, [paginatedData, selectable, onSelectionChange]);

  // 페이지 변경 시 현재 페이지 조정
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // 검색어 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // 페이지 번호 생성
  const getPageNumbers = useCallback(() => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      const end = Math.min(totalPages, start + maxVisible - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }, [currentPage, totalPages]);

  // 가상화된 리스트 데이터
  const virtualizedListData = useMemo(() => ({
    items: paginatedData,
    columns,
    selectedItems,
    onSelectItem: handleSelectItem,
    currentTheme,
    selectable
  }), [paginatedData, columns, selectedItems, handleSelectItem, currentTheme, selectable]);

  return (
    <div className={`${className}`}>
      {/* 상단 컨트롤 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          {/* 검색 */}
          {searchable && (
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 border rounded-lg ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          )}

          {/* 필터 */}
          {filterable && (
            <div className="flex items-center space-x-2">
              <FiFilter className="w-4 h-4 text-gray-400" />
              <select
                value={filters.status || 'all'}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className={`px-3 py-2 border rounded-lg ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="all">모든 상태</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
                <option value="pending">대기</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* 새로고침 */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className={`p-2 rounded-lg ${currentTheme?.hoverBg || 'hover:bg-gray-100'} transition-colors disabled:opacity-50`}
              title="새로고침"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''} ${currentTheme?.textColor || 'text-gray-600'}`} />
            </button>
          )}

          {/* 내보내기 */}
          {onExport && (
            <button
              onClick={() => onExport(sortedData)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90 transition-opacity`}
            >
              <FiDownload className="w-4 h-4" />
              <span>내보내기</span>
            </button>
          )}
        </div>
      </div>

      {/* 테이블 */}
      <div className={`overflow-hidden rounded-lg border ${currentTheme?.inputBorder || 'border-gray-200'}`}>
        {/* 헤더 */}
        <div className={`${currentTheme?.inputBg || 'bg-gray-50'} border-b ${currentTheme?.inputBorder || 'border-gray-200'}`}>
          <div className="flex items-center">
            {/* 선택 체크박스 */}
            {selectable && (
              <div className="w-12 flex justify-center py-3">
                <input
                  type="checkbox"
                  checked={paginatedData.length > 0 && paginatedData.every(item => selectedItems.has(item.id))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            )}

            {/* 컬럼 헤더 */}
            {columns.map((column) => (
              <div
                key={column.key}
                className={`flex-1 px-4 py-3 text-left text-xs font-medium ${currentTheme?.textSecondary || 'text-gray-500'} uppercase tracking-wider ${
                  sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                }`}
                style={{ minWidth: column.minWidth || 'auto' }}
                onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.title}</span>
                  {sortable && column.sortable !== false && sortConfig.key === column.key && (
                    sortConfig.direction === 'asc' ? (
                      <FiArrowUp className="w-3 h-3" />
                    ) : (
                      <FiArrowDown className="w-3 h-3" />
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 테이블 바디 */}
        <div className={`${currentTheme?.modalBgColor || 'bg-white'}`}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className={currentTheme?.textSecondary || 'text-gray-500'}>{loadingMessage}</span>
              </div>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <span className={currentTheme?.textSecondary || 'text-gray-500'}>{emptyMessage}</span>
            </div>
          ) : virtualized ? (
            <List
              height={Math.min(maxHeight, paginatedData.length * ROW_HEIGHT)}
              itemCount={paginatedData.length}
              itemSize={ROW_HEIGHT}
              itemData={virtualizedListData}
            >
              {VirtualizedRow}
            </List>
          ) : (
            <div>
              {paginatedData.map((item, index) => (
                <VirtualizedRow
                  key={item.id || index}
                  index={index}
                  style={{ height: ROW_HEIGHT }}
                  data={virtualizedListData}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 하단 페이지네이션 */}
      {!loading && !virtualized && sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
          {/* 정보 표시 */}
          <div className="flex items-center space-x-4">
            <span className={`text-sm ${currentTheme?.textSecondary || 'text-gray-700'}`}>
              {startItem}-{endItem} / {sortedData.length}개 항목
            </span>

            {/* 페이지당 항목 수 선택 */}
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${currentTheme?.textSecondary || 'text-gray-700'}`}>
                페이지당:
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 border rounded ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} text-sm`}
              >
                {ITEMS_PER_PAGE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 페이지네이션 버튼 */}
          <div className="flex items-center space-x-1">
            {/* 첫 페이지 */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${currentTheme?.hoverBg || 'hover:bg-gray-100'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              title="첫 페이지"
            >
              <FiChevronsLeft className="w-4 h-4" />
            </button>

            {/* 이전 페이지 */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${currentTheme?.hoverBg || 'hover:bg-gray-100'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              title="이전 페이지"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>

            {/* 페이지 번호 */}
            {getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? `${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'}`
                    : `${currentTheme?.hoverBg || 'hover:bg-gray-100'} ${currentTheme?.textColor || 'text-gray-700'}`
                }`}
              >
                {page}
              </button>
            ))}

            {/* 다음 페이지 */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${currentTheme?.hoverBg || 'hover:bg-gray-100'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              title="다음 페이지"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>

            {/* 마지막 페이지 */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${currentTheme?.hoverBg || 'hover:bg-gray-100'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              title="마지막 페이지"
            >
              <FiChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

OptimizedDataTable.displayName = 'OptimizedDataTable';

export default OptimizedDataTable; 