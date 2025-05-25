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
import { Image } from '@tiptap/extension-image';
import MenuBar from "./MenuBar";
import ButtonLayout from "./ButtonLayout";
import "@/styles/WriteEditerStyle.css";
import { useNavigate } from "react-router-dom";
import { auth } from "@/services/firebase";
import LoadingPage from "@/components/LoadingPage";
import ThemedButton from "@/components/ui/ThemedButton";

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
      class: 'cursor-pointer text-blue-500 hover:text-blue-700 underline',
    },
  }),
  Placeholder.configure({
    placeholder: '내용을 입력하세요...',
  }),
  CharacterCount.configure({
    limit: 10000,
  }),
  Typography,
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
  const [imageSize, setImageSize] = useState({ width: "", height: "" });
  const [selectedImage, setSelectedImage] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const [imageAlignment, setImageAlignment] = useState('center');

  useEffect(() => {
    if (!editor) return;

    const handleImageClick = (event) => {
      const clickedImage = event.target.closest('.ProseMirror img');
      if (clickedImage) {
        const { state } = editor;
        const { doc, selection } = state;
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
    window.addEventListener('imageSelected', handleImageSelected);
    editor.on('update', handleUpdate);

    return () => {
      editorElement.removeEventListener('click', handleImageClick);
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('imageSelected', handleImageSelected);
      editor.off('update', handleUpdate);
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
      setImageAlignment(alignment);
    } catch (error) {
      console.error("이미지 정렬 변경 중 오류:", error);
    }
  };

  if (!showControls) return null;

  return (
    <div className="image-controls flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 border rounded-lg mb-2 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <div className="flex items-center gap-2">
          <span className="font-medium whitespace-nowrap">이미지 크기:</span>
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="너비 (px/%)"
              value={imageSize.width}
              onChange={(e) => handleSizeChange("width", e.target.value)}
              className="w-24 p-1 border rounded"
            />
            <span>×</span>
            <input
              type="text"
              placeholder="높이 (px/%)"
              value={imageSize.height}
              onChange={(e) => handleSizeChange("height", e.target.value)}
              className="w-24 p-1 border rounded"
            />
          </div>
          <div className="flex gap-2">
            <ThemedButton onClick={applySize}>
              적용
            </ThemedButton>
            <ThemedButton onClick={handleReset}>
              기본값
            </ThemedButton>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <span className="font-medium whitespace-nowrap">정렬:</span>
          <div className="flex gap-1">
            <ThemedButton
              onClick={() => handleAlignmentChange('left')}
              className={imageAlignment === 'left' ? 'ring-2' : ''}
              title="왼쪽 정렬"
            >
              ⬅️
            </ThemedButton>
            <ThemedButton
              onClick={() => handleAlignmentChange('center')}
              className={imageAlignment === 'center' ? 'ring-2' : ''}
              title="가운데 정렬"
            >
              ↔️
            </ThemedButton>
            <ThemedButton
              onClick={() => handleAlignmentChange('right')}
              className={imageAlignment === 'right' ? 'ring-2' : ''}
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
    <input
      type="text"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      placeholder="제목을 입력하세요"
      className="mb-3 w-full p-2 rounded-lg border"
    />
  );
}

function CategorySelect({ selectedCategory, handleChange }) {
  return (
    <>
      <label htmlFor="category-select" className="mb-1 font-semibold">
        카테고리 선택:
      </label>
      <select
        id="category-select"
        value={selectedCategory}
        onChange={handleChange}
        className="mb-4 w-full max-w-xs p-2 rounded-md border"
      >
        <option value="">-- 선택하세요 --</option>
        {categories.map((cat, idx) => (
          <option key={idx} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </>
  );
}

function EditorController({ onEditorReady, setTitle, title, selectedCategory, handleChange }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

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

  const editor = useEditor({
    extensions: editorExtensions,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
      },
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
    <div className="editor-wrapper flex flex-col h-[calc(100vh-80px)] px-4 pt-8 overflow-y-auto relative max-w-[1200px] w-full mx-auto">
      <TitleInput title={title} setTitle={setTitle} />
      <CategorySelect selectedCategory={selectedCategory} handleChange={handleChange} />
      <MenuBar editor={editor} />
      <div className="editor-content relative flex-grow">
        <ImageResizeControls editor={editor} />
        <EditorContent editor={editor} className="min-h-[calc(100vh-300px)]" />
      </div>
    </div>
  );
}

export default function WriteEditor() {
  const [editor, setEditor] = useState(null);
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  return (
    <>
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
      />
    </>
  );
}
