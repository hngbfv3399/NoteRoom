import React, { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
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
import MenuBar from "./MenuBar";
import ButtonLayout from "./ButtonLayout";
import "@/styles/WriteEditerStyle.css";
import { useNavigate } from "react-router-dom";
import { auth } from "@/services/firebase";
import LoadingPage from "@/components/LoadingPage";
import ThemedButton from "@/components/ui/ThemedButton";
import { useSelector } from 'react-redux';
// 보안 관련 imports 추가
import { validateNote, validateImageFile, validateUrl } from '@/utils/validation';
import { checkNoteWriteLimit, checkImageUploadLimit } from '@/utils/rateLimiter';
import { normalizeInput, createSafeErrorMessage } from '@/utils/security';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

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

const editorExtensions = [
  StarterKit.configure({
    bulletList: { keepMarks: true },
    orderedList: { keepMarks: true },
    heading: {
      levels: [1, 2, 3],
    },
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

const categories = [
  "일상",
  "기술",
  "여행",
  "음식",
  "영화/드라마",
  "음악",
  "독서",
  "취미",
  "기타",
];

function ImageResizeControls({ editor }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const [imageSize, setImageSize] = useState({ width: '', height: '' });
  const [alignment, setAlignment] = useState('center');

  useEffect(() => {
    if (!editor) return;

    const handleImageClick = (event) => {
      const clickedImage = event.target.closest('.ProseMirror img');
      if (clickedImage) {
        const { state } = editor;
        const { doc } = state;
        let imageNode = null;
        let imagePos = null;

        // 현재 문서에서 클릭된 이미지 노드 찾기
        doc.descendants((node, pos) => {
          if (node.type.name === 'image') {
            const domNode = editor.view.nodeDOM(pos);
            if (domNode === clickedImage) {
              imageNode = node;
              imagePos = pos;
              return false;
            }
          }
          return true;
        });

        if (imageNode && imagePos !== null) {
          setSelectedImage({ pos: imagePos, node: imageNode });
          setImageSize({
            width: imageNode.attrs.width || "300px",
            height: imageNode.attrs.height || "auto",
          });
          setShowControls(true);
          
          // 이미지를 선택 상태로 만들기
          editor.chain().focus().setNodeSelection(imagePos).run();
        }
      }
    };

    const handleClickOutside = (event) => {
      const isClickedOnControls = event.target.closest('.image-controls');
      const isClickedOnImage = event.target.closest('.ProseMirror img');
      
      if (!isClickedOnControls && !isClickedOnImage) {
        setShowControls(false);
      }
    };

    // 에디터 내용 변경 시 선택 상태 업데이트
    const handleUpdate = () => {
      if (!showControls) return;

      const { state } = editor;
      const { selection } = state;
      const node = selection.$anchor.nodeAfter || selection.$anchor.nodeBefore;

      if (!node || node.type.name !== 'image') {
        setShowControls(false);
        return;
      }

      // 현재 선택된 이미지의 크기 정보 업데이트
      setImageSize({
        width: node.attrs.width || "300px",
        height: node.attrs.height || "auto",
      });
    };

    // 이미지 업로드 후 이벤트 처리
    const handleImageSelected = (event) => {
      const { pos, node } = event.detail;
      
      if (!node || !node.attrs) {
        console.log("유효하지 않은 이미지 노드:", node);
        return;
      }

      try {
        setSelectedImage({ pos, node });
        setImageSize({
          width: node.attrs.width || "300px",
          height: node.attrs.height || "auto",
        });
        setShowControls(true);
      } catch (error) {
        console.error("이미지 선택 처리 중 오류:", error);
        setShowControls(false);
      }
    };

    // 이벤트 리스너 등록
    const editorElement = editor.view.dom;
    editorElement.addEventListener('click', handleImageClick);
    document.addEventListener('click', handleClickOutside);
    editor.on('update', handleUpdate);
    window.addEventListener('imageSelected', handleImageSelected);

    return () => {
      editorElement.removeEventListener('click', handleImageClick);
      document.removeEventListener('click', handleClickOutside);
      editor.off('update', handleUpdate);
      window.removeEventListener('imageSelected', handleImageSelected);
    };
  }, [editor, showControls]);

  const handleSizeChange = (dimension, value) => {
    let processedValue = value;
    if (value.match(/^\d+$/)) {
      processedValue = `${value}px`;
    }
    setImageSize(prev => ({
      ...prev,
      [dimension]: processedValue,
    }));
  };

  const applySize = () => {
    if (!selectedImage || !editor) return;

    try {
      const { pos } = selectedImage;
      editor
        .chain()
        .focus()
        .setNodeSelection(pos)
        .updateAttributes('image', {
          width: imageSize.width || "300px",
          height: imageSize.height || "auto",
        })
        .run();
    } catch (error) {
      console.error("이미지 크기 변경 중 오류:", error);
      alert("이미지 크기 변경에 실패했습니다.");
    }
  };

  const handleReset = () => {
    const defaultSize = { width: "300px", height: "auto" };
    setImageSize(defaultSize);
    
    if (selectedImage && editor) {
      try {
        const { pos } = selectedImage;
        editor
          .chain()
          .focus()
          .setNodeSelection(pos)
          .updateAttributes('image', defaultSize)
          .run();
      } catch (error) {
        console.error("이미지 크기 초기화 중 오류:", error);
        alert("이미지 크기 초기화에 실패했습니다.");
      }
    }
  };

  const handleAlignmentChange = (alignment) => {
    if (!selectedImage || !editor) return;

    try {
      const { pos } = selectedImage;
      editor
        .chain()
        .focus()
        .setNodeSelection(pos)
        .updateAttributes('image', {
          alignment: alignment,
        })
        .run();
      setAlignment(alignment);
    } catch (error) {
      console.error("이미지 정렬 변경 중 오류:", error);
    }
  };

  if (!showControls) return null;

  return (
    <div 
      className={`image-controls flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 border-2 rounded-lg mb-4 shadow-sm`}
    >
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <div className="flex items-center gap-2">
          <span 
            className={`font-medium whitespace-nowrap`}
          >
            이미지 크기:
          </span>
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="너비 (px/%)"
              value={imageSize.width}
              onChange={(e) => handleSizeChange("width", e.target.value)}
              className={`w-24 p-2 border rounded-md transition-all focus:outline-none focus:ring-2`}
            />
            <span className={``}>×</span>
            <input
              type="text"
              placeholder="높이 (px/%)"
              value={imageSize.height}
              onChange={(e) => handleSizeChange("height", e.target.value)}
              className={`w-24 p-2 border rounded-md transition-all focus:outline-none focus:ring-2`}
            />
          </div>
          <div className="flex gap-2">
            <ThemedButton onClick={applySize} className="px-3 py-1">
              적용
            </ThemedButton>
            <ThemedButton onClick={handleReset} className="px-3 py-1">
              기본값
            </ThemedButton>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <span 
            className={`font-medium whitespace-nowrap`}
          >
            정렬:
          </span>
          <div className="flex gap-1">
            <ThemedButton
              onClick={() => handleAlignmentChange('left')}
              className={`px-2 py-1 ${alignment === 'left' ? 'ring-2' : ''}`}
              title="왼쪽 정렬"
            >
              ⬅️
            </ThemedButton>
            <ThemedButton
              onClick={() => handleAlignmentChange('center')}
              className={`px-2 py-1 ${alignment === 'center' ? 'ring-2' : ''}`}
              title="가운데 정렬"
            >
              ↔️
            </ThemedButton>
            <ThemedButton
              onClick={() => handleAlignmentChange('right')}
              className={`px-2 py-1 ${alignment === 'right' ? 'ring-2' : ''}`}
              title="오른쪽 정렬"
            >
              ➡️
            </ThemedButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function TitleInput({ title, setTitle }) {
  return (
    <div className="mb-6">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="멋진 제목을 입력해보세요..."
        className="w-full p-4 font-bold rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 placeholder-opacity-50"
        maxLength={100}
      />
      <div className="flex justify-between items-center mt-2">
        <p className="opacity-60">
          제목은 독자의 첫인상을 결정합니다
        </p>
        <span className="opacity-50">
          {title.length}/100
        </span>
      </div>
    </div>
  );
}

function CategorySelect({ selectedCategory, handleChange }) {
  const categoryIcons = {
    "일상": "📝",
    "여행": "✈️",
    "운동": "💪",
    "공부": "📖",
    "업무": "💼",
    "음식": "🍽️",
    "영화/드라마": "🎬",
    "음악": "🎵",
    "독서": "📚",
    "취미": "🎨",
    "기타": "📝"
  };

  return (
    <div className="mb-8">
      <label 
        htmlFor="category-select" 
        className="block font-semibold mb-3"
      >
        카테고리 선택
      </label>
      
      {/* 카테고리 스크롤 목록 */}
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-3 pb-2 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleChange({ target: { value: cat } })}
              className={`flex-shrink-0 p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 min-w-[80px] ${
                selectedCategory === cat
                  ? "border-transparent shadow-lg"
                  : ""
              }`}
            >
              <div className="mb-1">{categoryIcons[cat]}</div>
              <div className="font-medium text-sm whitespace-nowrap">{cat}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 카테고리 표시 */}
      {selectedCategory && (
        <div className="p-3 rounded-lg mt-4">
          <p>
            <span className="font-medium">선택된 카테고리:</span> {categoryIcons[selectedCategory]} {selectedCategory}
          </p>
        </div>
      )}
      
      {!selectedCategory && (
        <p className="opacity-60 mt-4">
          노트의 주제에 맞는 카테고리를 선택해주세요
        </p>
      )}
    </div>
  );
}

function EditorController({ onEditorReady, setTitle, title, selectedCategory, handleChange }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // 다크모드 확인을 위한 테마 정보
  const { current } = useSelector((state) => state.theme);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!auth.currentUser) {
      alert("로그인이 필요합니다.");
      navigate("/");
    }
  }, [navigate]);

  // 모바일 키보드 감지
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    if (!isMobile) return;

    const handleResize = () => {
      const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const screenHeight = window.screen.height;
      const heightDifference = screenHeight - viewportHeight;
      
      setIsKeyboardVisible(heightDifference > 150);
    };

    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        const heightDifference = window.screen.height - window.visualViewport.height;
        setIsKeyboardVisible(heightDifference > 150);
      }
    };

    window.addEventListener('resize', handleResize);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, []);

  const editor = useEditor({
    extensions: editorExtensions,
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none`,
        spellcheck: 'false',
        'data-testid': 'editor-content',
      },
      handleDOMEvents: {
        // 텍스트 선택 이벤트 처리
        selectstart: () => false, // 기본 선택 동작 허용
        mousedown: () => {
          // 텍스트 선택을 위한 마우스 다운 이벤트 허용
          return false;
        },
        mouseup: (view) => {
          // 선택 완료 후 처리
          setTimeout(() => {
            const selection = view.state.selection;
            if (!selection.empty) {
              // 텍스트 선택 처리 (디버깅 로그 제거)
            }
          }, 10);
          return false;
        },
        // 드래그 앤 드롭 이벤트 처리 - 에디터 영역에서도 작동하도록
        dragenter: () => {
          // 기본 동작을 방지하지 않고 버블링 허용
          return false;
        },
        dragover: () => {
          // 기본 동작을 방지하지 않고 버블링 허용
          return false;
        },
        dragleave: () => {
          // 기본 동작을 방지하지 않고 버블링 허용
          return false;
        },
        drop: (_view, event) => {
          // 이미지 파일이 아닌 경우에만 기본 동작을 방지하지 않고 버블링 허용
          const files = event.dataTransfer?.files;
          if (files && files[0] && files[0].type.startsWith('image/')) {
            // 이미지 파일인 경우 전역 핸들러가 처리하도록 버블링 허용
            return false;
          }
          // 텍스트나 다른 파일인 경우 에디터가 처리하도록 함
          return false;
        },
      },
    },
    onSelectionUpdate: () => {
      // 선택 상태 변경 시 처리 (디버깅 로그 제거)
    },
  });

  useEffect(() => {
    if (editor && isMounted) {
      setIsLoading(false);
      onEditorReady(editor);
    }
  }, [editor, isMounted, onEditorReady]);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div 
      className={`editor-wrapper flex flex-col min-h-screen px-4 sm:px-6 lg:px-8 py-8 w-full`}
    >
      {/* 제목 입력 */}
      <div className="w-full max-w-4xl mx-auto mb-6">
        <TitleInput title={title} setTitle={setTitle} />
      </div>
      
      {/* 카테고리 선택 */}
      <div className="w-full max-w-4xl mx-auto mb-8">
        <CategorySelect selectedCategory={selectedCategory} handleChange={handleChange} />
      </div>
      
      {/* 에디터 툴바 */}
      <div className="w-full max-w-6xl mx-auto mb-4">
        <MenuBar editor={editor} />
      </div>
      
      {/* 에디터 본문 - 전체 화면 너비 활용 */}
      <div className="w-full max-w-7xl mx-auto flex-grow">
        <div 
          className={`editor-content relative h-full rounded-xl border-2 overflow-hidden shadow-lg`}
        >
          <ImageResizeControls editor={editor} />
          <div className="p-6 sm:p-8 lg:p-12 h-full">
            <EditorContent 
              editor={editor} 
              className={`min-h-[70vh] prose prose-lg lg:prose-xl max-w-none focus:outline-none ${current === 'dark' ? 'prose-invert' : ''}`}
            />
          </div>
          
          {/* 에디터 하단 정보 */}
          <div className="px-6 lg:px-12 py-3 border-t flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="opacity-60">
                글자 수: {editor?.storage.characterCount.characters() || 0}
              </span>
              <span className="opacity-60">
                단어 수: {editor?.storage.characterCount.words() || 0}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full" />
              <span className="opacity-60">
                자동 저장됨
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 하단 여백 - ButtonLayout을 위한 공간 (키보드 상태에 따라 조정) */}
      <div className={isKeyboardVisible ? "h-16" : "h-32"}></div>
    </div>
  );
}

export default function WriteEditor({ editId }) {
  const [editor, setEditor] = useState(null);
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoadingNote, setIsLoadingNote] = useState(!!editId);

  const handleChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  // 기존 노트 불러오기
  useEffect(() => {
    if (editId && editor) {
      const loadExistingNote = async () => {
        try {
          setIsLoadingNote(true);
          // 노트 데이터 불러오기 로직 추가 필요
          const { getNoteById } = await import("@/utils/firebaseNoteDataUtil");
          const noteData = await getNoteById(editId);
          
          if (noteData) {
            setTitle(noteData.title || "");
            setSelectedCategory(noteData.category || "");
            editor.commands.setContent(noteData.content || "");
          }
        } catch (error) {
          console.error("노트 불러오기 실패:", error);
          alert("노트를 불러오는 중 오류가 발생했습니다.");
        } finally {
          setIsLoadingNote(false);
        }
      };

      loadExistingNote();
    }
  }, [editId, editor]);

  return (
    <>
      {isLoadingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>노트를 불러오는 중...</p>
          </div>
        </div>
      )}
      <EditorController
        onEditorReady={setEditor}
        setTitle={setTitle}
        title={title}
        selectedCategory={selectedCategory}
        handleChange={handleChange}
      />
      <ButtonLayout
        editor={editor}
        title={title}
        category={selectedCategory}
        editId={editId}
      />
    </>
  );
}
