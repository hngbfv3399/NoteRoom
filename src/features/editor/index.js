/**
 * TipTap 에디터 기능 모듈 진입점
 * - Lazy loading 지원
 * - 에디터 확장 분할 로딩
 * - 코드 분할 최적화
 */

import { lazy } from 'react';

// 기본 에디터 컴포넌트
export const RichTextEditor = lazy(() => import('./components/RichTextEditor'));
export const SimpleEditor = lazy(() => import('./components/SimpleEditor'));

// 에디터 확장들을 필요시에만 로드
export const loadBasicExtensions = () => import('./extensions/basicExtensions');
export const loadAdvancedExtensions = () => import('./extensions/advancedExtensions');
export const loadImageExtensions = () => import('./extensions/imageExtensions');
export const loadTableExtensions = () => import('./extensions/tableExtensions');

// 에디터 관련 훅
export { default as useEditor } from './hooks/useEditor';
export { default as useEditorContent } from './hooks/useEditorContent';

// 에디터 유틸리티
export * from './utils/editorUtils'; 