import React, { useState } from "react";
import ThemedButton from "@/components/ui/ThemedButton";
import { storage } from "@/services/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "@/services/firebase";
import { 
  RiTextWrap,
  RiAlignLeft,
  RiAlignCenter,
  RiAlignRight,
  RiLink,
  RiLinkUnlink,
  RiBold,
  RiItalic,
  RiUnderline,
  RiImageLine,
  RiH2,
  RiListUnordered,
  RiListOrdered,
  RiCodeBoxLine,
  RiDoubleQuotesL,
  RiSeparator,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
} from "react-icons/ri";
import { MdStrikethroughS } from "react-icons/md";

// 버튼 그룹 정의
const BUTTON_GROUPS = [
  {
    id: 'text-style',
    title: '텍스트 스타일',
    buttons: [
      { icon: RiBold, command: 'toggleBold', title: '굵게' },
      { icon: RiItalic, command: 'toggleItalic', title: '기울임' },
      { icon: RiUnderline, command: 'toggleUnderline', title: '밑줄' },
      { icon: MdStrikethroughS, command: 'toggleStrike', title: '취소선' },
    ]
  },
  {
    id: 'text-align',
    title: '정렬',
    buttons: [
      { icon: RiAlignLeft, command: 'setTextAlign', args: ['left'], title: '왼쪽 정렬' },
      { icon: RiAlignCenter, command: 'setTextAlign', args: ['center'], title: '가운데 정렬' },
      { icon: RiAlignRight, command: 'setTextAlign', args: ['right'], title: '오른쪽 정렬' },
    ]
  },
  {
    id: 'blocks',
    title: '블록',
    buttons: [
      { icon: RiH2, command: 'toggleHeading', args: [{ level: 2 }], title: '제목' },
      { icon: RiListUnordered, command: 'toggleBulletList', title: '글머리 기호' },
      { icon: RiListOrdered, command: 'toggleOrderedList', title: '번호 매기기' },
      { icon: RiCodeBoxLine, command: 'toggleCodeBlock', title: '코드 블록' },
      { icon: RiDoubleQuotesL, command: 'toggleBlockquote', title: '인용구' },
      { icon: RiSeparator, command: 'setHorizontalRule', title: '구분선' },
    ]
  },
];

function MenuBar({ editor }) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  if (!editor) return null;

  const handleCommand = (command, args = []) => {
    editor.chain().focus()[command](...args).run();
  };

  const isActive = (command, args = []) => {
    if (command === 'setTextAlign') {
      return editor.isActive({ textAlign: args[0] });
    }
    if (command === 'toggleHeading') {
      return editor.isActive('heading', args[0]);
    }
    return editor.isActive(command.replace('toggle', '').toLowerCase());
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 크기는 5MB를 초과할 수 없습니다.");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      const storageRef = ref(storage, `notes/content/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      editor.chain().focus().setImage({ 
        src: url,
        width: '300px',
        height: 'auto',
        style: 'object-fit: contain;'
      }).run();

      const { state } = editor;
      const pos = state.selection.from;
      window.dispatchEvent(new CustomEvent('imageSelected', {
        detail: { 
          pos,
          node: state.doc.nodeAt(pos)
        }
      }));
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      alert("이미지 업로드에 실패했습니다.");
    }
  };

  const setLink = () => {
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    setLinkUrl('');
    setShowLinkInput(false);
  };

  return (
    <div className="border-b mb-2 sticky top-0 z-10 shadow-sm">
      <div className="flex flex-wrap gap-3 p-2">
        {/* 버튼 그룹 렌더링 */}
        {BUTTON_GROUPS.map(group => (
          <div key={group.id} className="flex items-center gap-1 border-r pr-3 last:border-r-0">
            {group.buttons.map((button, index) => (
              <ThemedButton
                key={index}
                onClick={() => handleCommand(button.command, button.args)}
                className={`p-1.5 hover:bg-gray-100 rounded ${isActive(button.command, button.args) ? 'bg-gray-100 ring-2 ring-blue-400' : ''}`}
                title={button.title}
              >
                <button.icon className="text-lg" />
              </ThemedButton>
            ))}
          </div>
        ))}

        {/* 링크 컨트롤 */}
        <div className="flex items-center gap-1 border-r pr-3">
          <ThemedButton
            onClick={() => setShowLinkInput(!showLinkInput)}
            className={`p-1.5 hover:bg-gray-100 rounded ${editor.isActive('link') ? 'bg-gray-100 ring-2 ring-blue-400' : ''}`}
            title="링크 추가"
          >
            <RiLink className="text-lg" />
          </ThemedButton>
          {editor.isActive('link') && (
            <ThemedButton
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="p-1.5 hover:bg-gray-100 rounded"
              title="링크 제거"
            >
              <RiLinkUnlink className="text-lg" />
            </ThemedButton>
          )}
        </div>

        {/* 이미지 업로드 */}
        <div className="flex items-center gap-1">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
            capture="environment"
          />
          <ThemedButton
            onClick={() => document.getElementById("image-upload").click()}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="이미지 삽입"
          >
            <RiImageLine className="text-lg" />
          </ThemedButton>
        </div>

        {/* 실행 취소/다시 실행 */}
        <div className="flex items-center gap-1 border-l pl-3">
          <ThemedButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50"
            title="실행 취소"
          >
            <RiArrowGoBackLine className="text-lg" />
          </ThemedButton>
          <ThemedButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50"
            title="다시 실행"
          >
            <RiArrowGoForwardLine className="text-lg" />
          </ThemedButton>
        </div>
      </div>

      {/* 링크 입력 필드 */}
      {showLinkInput && (
        <div className="flex gap-2 p-2 border-t">
          <input
            type="text"
            placeholder="URL 입력"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setLink()}
            className="flex-1 px-2 py-1 border rounded text-sm"
          />
          <ThemedButton
            onClick={setLink}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            확인
          </ThemedButton>
        </div>
      )}

      {/* 문자 수 표시 */}
      {editor.storage.characterCount && (
        <div className="text-xs text-gray-500 px-2 pb-1 text-right">
          {editor.storage.characterCount.characters()}/10000자
        </div>
      )}
    </div>
  );
}

export default MenuBar;
