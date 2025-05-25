// TODO: '@tiptap/extension-image'의 Image 익스텐션을 커스터마이징하여 CustomImage 생성
// TODO: inline 옵션 true로 설정해 이미지가 텍스트와 같은 라인에 위치하도록 함
// TODO: allowBase64 true로 설정해 base64 이미지 삽입 허용
// TODO: HTMLAttributes에 'resizable-image' 클래스 추가해 스타일 적용 가능하게 설정
// TODO: addAttributes 오버라이드하여 이미지 width, height, style, draggable 속성 정의
// TODO: width 기본값 '300px', height 기본값 'auto' 지정하고 각각 HTML 속성에 매핑
// TODO: style 속성은 max-width 100%, height, object-fit: contain, cursor: pointer 적용
// TODO: draggable 기본값 false로 설정
// TODO: addNodeView 구현하여 이미지 렌더링 커스터마이징
// TODO: 이미지 컨테이너 div를 생성, inline-block, relative 위치 지정 및 max-width 100% 설정
// TODO: img 엘리먼트 생성 후 HTMLAttributes를 img 속성으로 모두 설정
// TODO: 편집 모드일 때 이미지 클릭 시 'imageSelected' 커스텀 이벤트를 window에 dispatch
// TODO: update 메서드에서 노드 속성이 바뀌면 img 속성도 업데이트
// TODO: destroy 메서드는 정리 작업을 위한 빈 함수로 둠

import { Image } from '@tiptap/extension-image';

const CustomImage = Image.configure({
  inline: true,
  allowBase64: true,
  HTMLAttributes: {
    class: 'resizable-image',
  },
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
        default: null,
        renderHTML: attributes => ({
          style: `
            max-width: 100%;
            height: ${attributes.height};
            object-fit: contain;
            cursor: pointer;
          `,
        }),
      },
      draggable: {
        default: false,
        renderHTML: attributes => ({
          draggable: attributes.draggable,
        }),
      },
    };
  },
  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const container = document.createElement('div');
      container.style.position = 'relative';
      container.style.display = 'inline-block';
      container.style.maxWidth = '100%';

      const img = document.createElement('img');
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        img.setAttribute(key, value);
      });

      container.append(img);

      if (editor.isEditable) {
        img.addEventListener('click', () => {
          const event = new CustomEvent('imageSelected', {
            detail: { pos: getPos(), node },
          });
          window.dispatchEvent(event);
        });
      }

      return {
        dom: container,
        update: (node) => {
          Object.entries(node.attrs).forEach(([key, value]) => {
            if (value) img.setAttribute(key, value);
          });
          return true;
        },
        destroy: () => {
          // 정리 작업
        },
      };
    };
  },
});

export default CustomImage; 