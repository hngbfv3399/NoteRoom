/**
 * 노트 기능 모듈 진입점
 * - Lazy loading 지원
 * - 코드 분할 최적화
 */

import { lazy } from 'react';

// 노트 관련 페이지들을 lazy loading으로 분할
export const WritePage = lazy(() => import('./components/WritePage'));
export const ThreadPage = lazy(() => import('./components/ThreadPage'));
export const MemoDetail = lazy(() => import('./components/MemoDetail'));
export const NoteEditModal = lazy(() => import('./components/NoteEditModal'));

// 노트 관련 컴포넌트들
export const NoteCard = lazy(() => import('./components/NoteCard'));
export const NoteGrid = lazy(() => import('./components/NoteGrid'));
export const CommentSection = lazy(() => import('./components/CommentSection'));

// 노트 관련 훅
export { default as useNoteDetail } from './hooks/useNoteDetail';
export { default as useNoteWrite } from './hooks/useNoteWrite';
export { default as useNoteComments } from './hooks/useNoteComments';
export { default as useNoteInteraction } from './hooks/useNoteInteraction';

// 노트 유틸리티
export * from './utils/noteUtils'; 