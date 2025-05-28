/**
 * 검색 기능 모듈 진입점
 * - Lazy loading 지원
 * - 코드 분할 최적화
 */

import { lazy } from 'react';

// 검색 관련 컴포넌트들을 lazy loading으로 분할
export const SearchPage = lazy(() => import('./components/SearchPage'));
export const SearchInput = lazy(() => import('./components/SearchInput'));
export const SearchResults = lazy(() => import('./components/SearchResults'));
export const SearchFilters = lazy(() => import('./components/SearchFilters'));

// 검색 관련 훅
export { default as useSearch } from './hooks/useSearch';
export { default as useSearchHistory } from './hooks/useSearchHistory';

// 검색 유틸리티
export * from './utils/searchUtils'; 