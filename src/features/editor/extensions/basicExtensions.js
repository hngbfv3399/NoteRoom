/**
 * 기본 TipTap 에디터 확장들
 * - 필수 기능만 포함
 * - 가벼운 번들 크기
 */

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';

export const basicExtensions = [
  StarterKit.configure({
    history: false, // 커스텀 히스토리 사용
  }),
  Placeholder.configure({
    placeholder: '내용을 입력하세요...',
  }),
  CharacterCount.configure({
    limit: 10000,
  }),
];

export default basicExtensions; 