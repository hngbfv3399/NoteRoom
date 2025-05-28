import React, { useEffect, useState } from 'react';
import ThemedButton from "@/components/ui/ThemedButton";

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

export default ImageResizeControls; 