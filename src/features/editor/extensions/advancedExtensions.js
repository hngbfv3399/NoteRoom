/**
 * 고급 TipTap 에디터 확장들
 * - 고급 기능들 (색상, 정렬, 스타일링)
 * - 필요시에만 로드
 */

import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Typography from '@tiptap/extension-typography';
import FontFamily from '@tiptap/extension-font-family';

export const advancedExtensions = [
  Color.configure({ types: ['textStyle'] }),
  TextStyle,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Underline,
  Highlight.configure({ multicolor: true }),
  Subscript,
  Superscript,
  Typography,
  FontFamily.configure({
    types: ['textStyle'],
  }),
];

export default advancedExtensions; 