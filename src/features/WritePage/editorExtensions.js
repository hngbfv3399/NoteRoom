import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Image } from '@tiptap/extension-image';

const CustomImage = Image.configure({
  inline: true,
  allowBase64: true,
}).extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '300px',
        renderHTML: attributes => ({
          width: attributes.width,
        }),
      },
      height: {
        default: 'auto',
        renderHTML: attributes => ({
          height: attributes.height,
        }),
      },
      style: {
        default: 'object-fit: contain;',
        renderHTML: attributes => ({
          style: attributes.style,
        }),
      },
      alignment: {
        default: 'center',
        renderHTML: attributes => ({
          style: `display: block; margin: ${
            attributes.alignment === 'left' ? '0 auto 0 0' :
            attributes.alignment === 'right' ? '0 0 0 auto' :
            '0 auto'
          };`,
        }),
      },
    }
  },
});

export const createEditorExtensions = () => {
  try {
    const extensions = [
      // StarterKit을 기본 설정으로 사용 (모든 기본 노드 포함)
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        heading: {
          levels: [1, 2, 3],
        },
        // 기본 노드들을 모두 활성화 상태로 유지
      }),
      CustomImage,
      Color.configure({ types: [TextStyle.name, ListItem.name] }),
      TextStyle.configure({ types: [ListItem.name] }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
        alignments: ['left', 'center', 'right'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'cursor-pointer underline',
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          // 에디터가 완전히 비어있을 때만 placeholder 표시
          if (node.type.name === 'doc') {
            return '';
          }
          
          if (node.type.name === 'paragraph') {
            // 첫 번째 문단이고 에디터가 비어있을 때만 표시
            const isFirstParagraph = node.parent?.firstChild === node;
            const isEditorEmpty = node.parent?.textContent === '';
            
            if (isFirstParagraph && isEditorEmpty) {
              return '내용을 입력하세요...';
            }
          }
          
          return '';
        },
        includeChildren: true,
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      }),
      CharacterCount.configure({
        limit: 10000,
      }),
      Typography,
      Highlight.configure({
        multicolor: true,
      }),
      Subscript,
      Superscript,
    ];
    
    console.log('에디터 확장 생성 완료:', extensions.length, '개');
    return extensions;
  } catch (error) {
    console.error('에디터 확장 생성 실패:', error);
    // 최소한의 확장만 반환 - StarterKit 기본 설정
    return [StarterKit];
  }
}; 