import React, { useState } from "react";
import ThemedButton from "@/components/ui/ThemedButton";
import { storage } from "@/services/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "@/services/firebase";
import { useSelector } from 'react-redux';
import { validateImageFile, validateUrl } from '@/utils/validation';
import { checkImageUploadLimit } from '@/utils/rateLimiter';
import { normalizeInput, createSafeErrorMessage } from '@/utils/security';
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
  RiH1,
  RiH2,
  RiH3,
  RiListUnordered,
  RiListOrdered,
  RiCodeBoxLine,
  RiDoubleQuotesL,
  RiSeparator,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiFontColor,
  RiMarkPenLine,
  RiSubscript,
  RiSuperscript,
  RiFontSize,
  RiPaletteLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
} from "react-icons/ri";
import { MdStrikethroughS, MdFormatColorFill } from "react-icons/md";

// 버튼 그룹 정의 - 토글 가능한 그룹들
const BUTTON_GROUPS = [
  {
    id: 'text-style',
    title: '텍스트 스타일',
    icon: RiBold,
    collapsible: true,
    buttons: [
      { icon: RiBold, command: 'toggleBold', title: '굵게 (Ctrl+B)' },
      { icon: RiItalic, command: 'toggleItalic', title: '기울임 (Ctrl+I)' },
      { icon: RiUnderline, command: 'toggleUnderline', title: '밑줄 (Ctrl+U)' },
      { icon: MdStrikethroughS, command: 'toggleStrike', title: '취소선' },
      { icon: RiSubscript, command: 'toggleSubscript', title: '아래첨자' },
      { icon: RiSuperscript, command: 'toggleSuperscript', title: '위첨자' },
    ]
  },
  {
    id: 'text-color',
    title: '색상',
    icon: RiFontColor,
    collapsible: true,
    buttons: [
      { icon: RiFontColor, command: 'setColor', args: ['#000000'], title: '검정색', color: '#000000' },
      { icon: RiFontColor, command: 'setColor', args: ['#dc2626'], title: '빨간색', color: '#dc2626' },
      { icon: RiFontColor, command: 'setColor', args: ['#2563eb'], title: '파란색', color: '#2563eb' },
      { icon: RiFontColor, command: 'setColor', args: ['#16a34a'], title: '초록색', color: '#16a34a' },
      { icon: RiFontColor, command: 'setColor', args: ['#ca8a04'], title: '노란색', color: '#ca8a04' },
      { icon: RiFontColor, command: 'setColor', args: ['#9333ea'], title: '보라색', color: '#9333ea' },
      { icon: RiMarkPenLine, command: 'toggleHighlight', title: '형광펜' },
    ]
  },
  {
    id: 'text-align',
    title: '정렬',
    icon: RiAlignLeft,
    collapsible: true,
    buttons: [
      { icon: RiAlignLeft, command: 'setTextAlign', args: ['left'], title: '왼쪽 정렬' },
      { icon: RiAlignCenter, command: 'setTextAlign', args: ['center'], title: '가운데 정렬' },
      { icon: RiAlignRight, command: 'setTextAlign', args: ['right'], title: '오른쪽 정렬' },
    ]
  },
  {
    id: 'headings',
    title: '제목',
    icon: RiH2,
    collapsible: true,
    buttons: [
      { icon: RiH1, command: 'toggleHeading', args: [{ level: 1 }], title: '제목 1' },
      { icon: RiH2, command: 'toggleHeading', args: [{ level: 2 }], title: '제목 2' },
      { icon: RiH3, command: 'toggleHeading', args: [{ level: 3 }], title: '제목 3' },
    ]
  },
  {
    id: 'lists',
    title: '목록',
    icon: RiListUnordered,
    collapsible: true,
    buttons: [
      { icon: RiListUnordered, command: 'toggleBulletList', title: '글머리 기호' },
      { icon: RiListOrdered, command: 'toggleOrderedList', title: '번호 매기기' },
    ]
  },
  {
    id: 'blocks',
    title: '블록',
    icon: RiCodeBoxLine,
    collapsible: true,
    buttons: [
      { icon: RiCodeBoxLine, command: 'toggleCodeBlock', title: '코드 블록' },
      { icon: RiDoubleQuotesL, command: 'toggleBlockquote', title: '인용구' },
      { icon: RiSeparator, command: 'setHorizontalRule', title: '구분선' },
    ]
  },
];

function MenuBar({ editor }) {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

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
    if (command === 'setColor') {
      return editor.isActive('textStyle', { color: args[0] });
    }
    if (command === 'toggleHighlight') {
      return editor.isActive('highlight');
    }
    if (command === 'toggleSubscript') {
      return editor.isActive('subscript');
    }
    if (command === 'toggleSuperscript') {
      return editor.isActive('superscript');
    }
    return editor.isActive(command.replace('toggle', '').toLowerCase());
  };

  const toggleGroup = (groupId) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
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

    // 링크 텍스트가 있는 경우, 현재 선택된 텍스트를 대체
    if (linkText.trim()) {
      const { from, to } = editor.state.selection;
      editor.chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent(linkText)
        .setTextSelection({ from, to: from + linkText.length })
        .setLink({ href: linkUrl })
        .run();
    } else {
      // 링크 텍스트가 없는 경우, 기존 동작 유지
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    
    setLinkUrl('');
    setLinkText('');
    setShowLinkInput(false);
  };

  return (
    <div 
      className={`rounded-xl border-2 shadow-sm overflow-hidden ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
    >
      {/* 메인 툴바 - 스크롤 가능 */}
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-2 p-4 min-w-max">
          {/* 토글 가능한 버튼 그룹들 */}
          {BUTTON_GROUPS.map((group, groupIndex) => (
            <div key={group.id} className={`flex items-center gap-1 ${groupIndex < BUTTON_GROUPS.length - 1 ? 'border-r pr-3 mr-3' : ''}`} style={{ borderColor: currentTheme?.inputBorder || '#e5e7eb' }}>
              {/* 그룹 토글 버튼 */}
              <div className="flex items-center gap-1">
                <ThemedButton
                  onClick={() => toggleGroup(group.id)}
                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-1 ${collapsedGroups[group.id] ? 'opacity-60' : ''}`}
                  title={`${group.title} ${collapsedGroups[group.id] ? '펼치기' : '접기'}`}
                >
                  <group.icon className="text-sm" />
                  {collapsedGroups[group.id] ? 
                    <RiArrowDownSLine className="text-xs" /> : 
                    <RiArrowUpSLine className="text-xs" />
                  }
                </ThemedButton>
                
                {/* 그룹이 펼쳐져 있을 때만 버튼들 표시 */}
                {!collapsedGroups[group.id] && group.buttons.map((button, index) => (
                  <ThemedButton
                    key={index}
                    onClick={() => handleCommand(button.command, button.args)}
                    className={`p-2.5 rounded-lg transition-all duration-200 hover:scale-105 ${isActive(button.command, button.args) ? 'ring-2 shadow-md' : 'hover:shadow-sm'} flex-shrink-0`}
                    title={button.title}
                    style={{
                      '--tw-ring-color': currentTheme?.buttonBg || '#3b82f6',
                      color: button.color || 'inherit'
                    }}
                  >
                    <button.icon className="text-lg" style={{ color: button.color || 'inherit' }} />
                  </ThemedButton>
                ))}
              </div>
            </div>
          ))}

          {/* 링크 컨트롤 */}
          <div className="flex items-center gap-1 border-r pr-3 mr-3 flex-shrink-0" style={{ borderColor: currentTheme?.inputBorder || '#e5e7eb' }}>
            <ThemedButton
              onClick={() => setShowLinkInput(!showLinkInput)}
              className={`p-2.5 rounded-lg transition-all duration-200 hover:scale-105 ${editor.isActive('link') ? 'ring-2 shadow-md' : 'hover:shadow-sm'}`}
              title="링크 추가"
              style={{
                '--tw-ring-color': currentTheme?.buttonBg || '#3b82f6'
              }}
            >
              <RiLink className="text-lg" />
            </ThemedButton>
            {editor.isActive('link') && (
              <ThemedButton
                onClick={() => editor.chain().focus().unsetLink().run()}
                className="p-2.5 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-sm"
                title="링크 제거"
              >
                <RiLinkUnlink className="text-lg" />
              </ThemedButton>
            )}
          </div>

          {/* 이미지 업로드 */}
          <div className="flex items-center gap-1 border-r pr-3 mr-3 flex-shrink-0" style={{ borderColor: currentTheme?.inputBorder || '#e5e7eb' }}>
            {/* 갤러리에서 선택 */}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-gallery-upload"
            />
            {/* 카메라로 촬영 */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
              id="image-camera-upload"
            />
            
            {/* 데스크톱: 단일 버튼 */}
            <div className="hidden md:block">
              <ThemedButton
                onClick={() => document.getElementById("image-gallery-upload").click()}
                className="p-2.5 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-sm"
                title="이미지 삽입"
              >
                <RiImageLine className="text-lg" />
              </ThemedButton>
            </div>
            
            {/* 모바일: 두 개의 버튼 */}
            <div className="md:hidden flex gap-1">
              <ThemedButton
                onClick={() => document.getElementById("image-camera-upload").click()}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-sm"
                title="카메라로 촬영"
              >
                <span className="text-sm">📷</span>
              </ThemedButton>
              <ThemedButton
                onClick={() => document.getElementById("image-gallery-upload").click()}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-sm"
                title="갤러리에서 선택"
              >
                <span className="text-sm">🖼️</span>
              </ThemedButton>
            </div>
          </div>

          {/* 실행 취소/다시 실행 */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <ThemedButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
              className="p-2.5 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
              title="실행 취소 (Ctrl+Z)"
            >
              <RiArrowGoBackLine className="text-lg" />
            </ThemedButton>
            <ThemedButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
              className="p-2.5 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
              title="다시 실행 (Ctrl+Y)"
            >
              <RiArrowGoForwardLine className="text-lg" />
            </ThemedButton>
          </div>
        </div>
      </div>

      {/* 링크 입력 필드 */}
      {showLinkInput && (
        <div 
          className={`p-4 border-t-2 ${currentTheme?.inputBg || 'bg-gray-50'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
                  링크 URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-4 ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputText || 'text-gray-800'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.inputFocus || 'focus:border-blue-500 focus:ring-blue-500/20'}`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setLink();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
                  링크 텍스트 (선택사항)
                </label>
                <input
                  type="text"
                  placeholder="링크에 표시될 텍스트"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-4 ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputText || 'text-gray-800'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.inputFocus || 'focus:border-blue-500 focus:ring-blue-500/20'}`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setLink();
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <ThemedButton 
                onClick={setLink} 
                className="px-6 py-3 font-medium"
                disabled={!linkUrl.trim()}
              >
                적용
              </ThemedButton>
              <ThemedButton 
                onClick={() => {
                  setShowLinkInput(false);
                  setLinkUrl('');
                  setLinkText('');
                }} 
                variant="secondary"
                className="px-6 py-3"
              >
                취소
              </ThemedButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuBar;
