import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { saveNoteToFirestore, updateNoteInFirestore } from "@/utils/firebaseNoteDataUtil";
import { useNavigate } from "react-router-dom";
import { auth, storage } from "@/services/firebase";
import ThemedButton from "@/components/ui/ThemedButton";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import LoadingPage from "@/components/LoadingPage";
// 보안 관련 imports 추가
import { validateNote, validateImageFile } from '@/utils/validation';
import { checkNoteWriteLimit, checkImageUploadLimit } from '@/utils/rateLimiter';
import { normalizeInput, createSafeErrorMessage } from '@/utils/security';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

function ButtonLayout({ editor, title, category, editId }) {
  
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null); // 기존 이미지 URL 저장
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(false);
  const isEditMode = !!editId;

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // 모바일 감지
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  };

  // 모든 필수 항목이 입력되었는지 확인
  const titleComplete = title && title.trim();
  const categoryComplete = category && category.trim();
  const editorComplete = editor && editor.getHTML && editor.getHTML().trim();
  const isContentComplete = titleComplete && categoryComplete && editorComplete;

  // 전체 페이지 드래그 앤 드롭 감지
  useEffect(() => {
    const handlePageDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (isContentComplete) {
        setDragActive(true);
        setShowThumbnail(true);
      }
    };

    const handlePageDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handlePageDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!e.relatedTarget || 
          e.relatedTarget.nodeName === 'HTML' || 
          !document.body.contains(e.relatedTarget)) {
        setDragActive(false);
      }
    };

    const handlePageDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      if (!isContentComplete) {
        setError("먼저 제목, 카테고리, 내용을 입력해주세요.");
        return;
      }

      const files = e.dataTransfer.files;
      
      if (files && files[0]) {
        const file = files[0];
        
        if (!file.type.startsWith('image/')) {
          setError("이미지 파일만 업로드 가능합니다.");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError("이미지 크기는 5MB를 초과할 수 없습니다.");
          return;
        }
        
        handleFileSelection(file);
        setError(null);
        setShowThumbnail(true);
      }
    };

    document.addEventListener('dragenter', handlePageDragEnter, true);
    document.addEventListener('dragover', handlePageDragOver, true);
    document.addEventListener('dragleave', handlePageDragLeave, true);
    document.addEventListener('drop', handlePageDrop, true);

    return () => {
      document.removeEventListener('dragenter', handlePageDragEnter, true);
      document.removeEventListener('dragover', handlePageDragOver, true);
      document.removeEventListener('dragleave', handlePageDragLeave, true);
      document.removeEventListener('drop', handlePageDrop, true);
    };
  }, [isContentComplete]);

  // 드래그 앤 드롭 핸들러
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setDragActive(false);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        setError("이미지 파일만 업로드 가능합니다.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("이미지 크기는 5MB를 초과할 수 없습니다.");
        return;
      }
      
      handleFileSelection(file);
      setError(null);
    }
  };

  const handleFileSelection = (file) => {
    // 파일 보안 검증 추가
    const fileValidation = validateImageFile(file);
    if (!fileValidation.isValid) {
      setError(fileValidation.error);
      return;
    }
    
    setImageFile(file);
    setExistingImageUrl(null); // 새 이미지 선택 시 기존 이미지 URL 초기화
    setError(null);
    setShowImageModal(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleImageButtonClick = () => {
    if (isMobile()) {
      setShowImageModal(true);
    } else {
      document.getElementById("thumbnail-gallery-upload").click();
    }
  };

  const uploadImage = async () => {
    if (!imageFile) {
      throw new Error("썸네일 이미지를 선택해주세요.");
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    // Rate Limiting 검증
    if (!checkImageUploadLimit(user.uid)) {
      throw new Error("이미지 업로드 한도를 초과했습니다. 잠시 후 다시 시도해주세요.");
    }

    // 파일 재검증
    const fileValidation = validateImageFile(imageFile);
    if (!fileValidation.isValid) {
      throw new Error(fileValidation.error);
    }

    // 파일명 보안 검증 (경로 순회 공격 방지)
    if (imageFile.name.includes('..') || imageFile.name.includes('/') || imageFile.name.includes('\\')) {
      throw new Error("유효하지 않은 파일명입니다.");
    }

    // 파일 헤더 검증 (매직 넘버 확인)
    const fileHeader = await readFileHeader(imageFile);
    if (!isValidImageHeader(fileHeader, imageFile.type)) {
      throw new Error("파일 형식이 올바르지 않습니다. 실제 이미지 파일을 업로드해주세요.");
    }

    // 안전한 파일명 생성 (특수문자 제거 및 정규화)
    const safeFileName = sanitizeFileName(imageFile.name);
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const uniqueFileName = `${timestamp}_${randomString}_${safeFileName}`;

    try {
      const storageRef = ref(storage, `notes/${user.uid}/${uniqueFileName}`);
      
      // 메타데이터 설정 (보안 강화)
      const metadata = {
        contentType: imageFile.type,
        cacheControl: 'public, max-age=31536000', // 1년 캐시
        customMetadata: {
          uploadedBy: user.uid,
          uploadedAt: new Date().toISOString(),
          originalName: imageFile.name.substring(0, 100), // 원본 파일명 길이 제한
          imageType: 'thumbnail'
        }
      };

      await uploadBytes(storageRef, imageFile, metadata);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      
      // 사용자 친화적인 오류 메시지
      if (error.code === 'storage/unauthorized') {
        throw new Error("이미지 업로드 권한이 없습니다. 로그인 상태를 확인해주세요.");
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error("저장 공간이 부족합니다.");
      } else if (error.code === 'storage/invalid-format') {
        throw new Error("지원하지 않는 이미지 형식입니다.");
      } else if (error.code === 'storage/retry-limit-exceeded') {
        throw new Error("업로드 재시도 한도를 초과했습니다. 잠시 후 다시 시도해주세요.");
      }
      
      throw new Error("이미지 업로드에 실패했습니다.");
    }
  };

  // 파일 헤더 읽기 함수
  const readFileHeader = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const uint8Array = new Uint8Array(arrayBuffer);
        resolve(uint8Array);
      };
      reader.onerror = () => reject(new Error("파일 읽기 실패"));
      reader.readAsArrayBuffer(file.slice(0, 12)); // 처음 12바이트만 읽기
    });
  };

  // 이미지 헤더 검증 함수 (매직 넘버 확인)
  const isValidImageHeader = (header, mimeType) => {
    const headerHex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join('');
    
    switch (mimeType) {
      case 'image/jpeg':
      case 'image/jpg':
        return headerHex.startsWith('ffd8ff'); // JPEG 매직 넘버
      case 'image/png':
        return headerHex.startsWith('89504e47'); // PNG 매직 넘버
      case 'image/gif':
        return headerHex.startsWith('474946'); // GIF 매직 넘버
      case 'image/webp':
        return headerHex.includes('57454250'); // WebP 매직 넘버 (RIFF 컨테이너 내)
      default:
        return false;
    }
  };

  // 파일명 정규화 함수
  const sanitizeFileName = (fileName) => {
    // 1. 확장자 분리
    const lastDotIndex = fileName.lastIndexOf('.');
    const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
    
    // 2. 파일명 정규화 (특수문자 제거, 공백을 언더스코어로 변경)
    const sanitizedName = name
      .replace(/[^a-zA-Z0-9가-힣\s.-]/g, '') // 허용된 문자만 유지
      .replace(/\s+/g, '_') // 공백을 언더스코어로 변경
      .replace(/_{2,}/g, '_') // 연속된 언더스코어 제거
      .substring(0, 50); // 파일명 길이 제한
    
    // 3. 빈 파일명 방지
    const finalName = sanitizedName || 'image';
    
    return finalName + extension.toLowerCase();
  };

  const validateInput = () => {
    // 입력 데이터 정규화
    const normalizedTitle = normalizeInput(title);
    const normalizedCategory = normalizeInput(category);
    
    // 노트 데이터 검증
    const noteValidation = validateNote({
      title: normalizedTitle,
      content: editor?.getHTML() || '',
      category: normalizedCategory
    });
    
    if (!noteValidation.isValid) {
      throw new Error(noteValidation.errors[0]);
    }
    
    // 새 글 작성 시에만 이미지 필수 (편집 모드에서는 기존 이미지가 있으면 OK)
    if (!isEditMode && !imageFile && !existingImageUrl) {
      throw new Error("썸네일 이미지를 선택해주세요.");
    }
    
    return noteValidation.data;
  };

  const handleSubmit = async () => {



    
    const user = auth.currentUser;
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }







    try {
      setError(null);
      setUploading(true);
  
      
      // Rate Limiting 검증
      if (!checkNoteWriteLimit(user.uid)) {
        throw new Error("글 작성 한도를 초과했습니다. 잠시 후 다시 시도해주세요.");
      }
      
      // 입력 검증 및 정규화
      const validatedData = validateInput();
  

      let uploadedImageUrl = null;
      
      // 편집 모드에서 기존 이미지 처리
      if (isEditMode) {
    
    
    
        
        // 새로운 이미지가 선택된 경우
        if (imageFile) {
      
          uploadedImageUrl = await uploadImage();
      
        } else if (existingImageUrl) {
          // 기존 이미지 URL 사용 (새 이미지를 선택하지 않은 경우)
          uploadedImageUrl = existingImageUrl;
      
        } else {
          // 기존 노트의 이미지 유지 (편집 시 이미지를 변경하지 않은 경우)
          try {
            const noteDocRef = doc(db, "notes", editId);
            const noteDoc = await getDoc(noteDocRef);
            if (noteDoc.exists()) {
              const existingNote = noteDoc.data();
              // 썸네일 필드 우선 확인, 없으면 image 필드 확인
              uploadedImageUrl = existingNote.thumbnail || existingNote.image || null;
          
            }
          } catch (error) {
            console.warn("기존 노트 이미지 로드 실패:", error);
          }
        }
      } else {
        // 새 글 작성 모드
        if (imageFile) {
          uploadedImageUrl = await uploadImage();
        }
      }
      
      // HTML 콘텐츠 정화
      const editorContent = editor.getHTML();
  
  
  
  
      
      // 에디터의 텍스트만 추출해보기
      const editorText = editor.getText();
  
  
  
  
  
      
      // 에디터 내부 상태 확인
  
  
  
  
  
      
      const sanitizedContent = sanitizeHtml(editorContent);
  
  
  
      
      // content에서 텍스트만 추출해보기
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = sanitizedContent || '';
      const textOnly = tempDiv.textContent || tempDiv.innerText || '';
  
  
      
      // 빈 p 태그 확인
      const emptyPTags = (sanitizedContent.match(/<p><\/p>/g) || []).length;
      const emptyPTagsWithSpace = (sanitizedContent.match(/<p>\s*<\/p>/g) || []).length;
  
  
      
      if (isEditMode) {
    
        // 편집 모드: 허용된 필드만 업데이트
        const updateData = {
          title: validatedData.title,
          content: sanitizedContent,
          category: validatedData.category,
        };

        // 이미지가 있을 때만 추가 (null이나 undefined가 아닌 경우)
        if (uploadedImageUrl) {
          updateData.image = uploadedImageUrl;
          updateData.thumbnail = uploadedImageUrl; // 썸네일 필드도 함께 설정
        }

    
    
    

        await updateNoteInFirestore(editId, updateData);
    
      } else {
    
        // 새 글 작성 모드: 전체 노트 데이터 생성
        const noteData = {
          title: validatedData.title,
          content: sanitizedContent,
          category: validatedData.category,
          userUid: user.uid,
          likes: 0,
          views: 0,
          commentCount: 0,
        };

        // 이미지가 있을 때만 추가 (null이나 undefined가 아닌 경우)
        if (uploadedImageUrl) {
          noteData.image = uploadedImageUrl;
          noteData.thumbnail = uploadedImageUrl; // 썸네일 필드도 함께 설정
        }

    
        await saveNoteToFirestore(noteData);
    
      }
      
      // 저장 성공 후 메인 페이지로 이동하면서 새로고침 플래그 전달
      navigate("/", { 
        state: { refreshNeeded: true },
        replace: true // 뒤로가기 시 작성 페이지로 돌아가지 않도록
      });
    } catch (error) {
      console.error("=== ButtonLayout 에러 ===");
      console.error("error:", error);
      // 안전한 에러 메시지 생성
      const safeErrorMessage = createSafeErrorMessage(error, import.meta.env.PROD);
      setError(safeErrorMessage);
      console.error("노트 저장 실패:", error);
    } finally {
      setUploading(false);
  
    }
  };

  // 편집 모드에서 기존 노트 이미지 로드
  useEffect(() => {
    const loadExistingImage = async () => {
      if (isEditMode && editId && !imageFile && !existingImageUrl) {
        try {
          const noteDocRef = doc(db, "notes", editId);
          const noteDoc = await getDoc(noteDocRef);
          if (noteDoc.exists()) {
            const existingNote = noteDoc.data();
            
            // 썸네일 필드 우선 확인, 없으면 image 필드 확인
            const existingImageUrl = existingNote.thumbnail || existingNote.image;
            
            if (existingImageUrl) {
              // 기존 이미지가 있으면 썸네일 섹션을 자동으로 표시
              setShowThumbnail(true);
              setExistingImageUrl(existingImageUrl);
              
          
            }
          }
        } catch (error) {
          console.warn("기존 노트 이미지 확인 실패:", error);
        }
      }
    };

    loadExistingImage();
  }, [isEditMode, editId, imageFile, existingImageUrl]);

  if (uploading) {
    return <LoadingPage />;
  }

  return (
    <>
      {/* 전체 페이지 드래그 오버레이 */}
      {dragActive && isContentComplete && (
        <div className="fixed inset-0 z-50 bg-blue-500 bg-opacity-30 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-2xl shadow-2xl border-4 border-blue-500 border-dashed animate-pulse">
            <div className="text-8xl mb-6 animate-bounce">📁</div>
            <h2 className="text-3xl font-bold text-blue-600 mb-4">
              썸네일 이미지를 업로드하세요!
            </h2>
            <p className="text-lg text-blue-500 mb-2">
              이미지를 여기에 놓으면 썸네일로 설정됩니다
            </p>
            <p className="text-sm text-gray-600">
              JPG, PNG, GIF 파일 지원 (최대 5MB)
            </p>
          </div>
        </div>
      )}

      {/* 에디터 밑에 표시되는 진행 상황 및 액션 영역 */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* 간단한 진행 상태 표시 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-lg font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
              글 작성 진행도
            </h3>
            <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-600'}`}>
              {[title.trim(), category.trim(), editor?.getHTML()?.trim(), imageFile || existingImageUrl].filter(Boolean).length}/4
            </span>
          </div>
          
          {/* 프로그레스 바 */}
          <div className={`w-full h-2 rounded-full overflow-hidden ${currentTheme?.inputBg || 'bg-gray-200'}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${currentTheme?.buttonBg || 'bg-blue-500'}`}
              style={{ 
                width: `${([title.trim(), category.trim(), editor?.getHTML()?.trim(), imageFile || existingImageUrl].filter(Boolean).length / 4) * 100}%` 
              }}
            />
          </div>
          
          {/* 간단한 상태 표시 */}
          <div className="flex items-center justify-center mt-3 space-x-4">
            <div className={`flex items-center space-x-1 ${title.trim() ? 'opacity-100' : 'opacity-40'}`}>
              <span className="text-sm">📝</span>
              <span className={`text-xs ${currentTheme?.textColor || 'text-gray-600'}`}>제목</span>
              {title.trim() && <span className="text-xs text-green-500">✓</span>}
            </div>
            <div className={`flex items-center space-x-1 ${category.trim() ? 'opacity-100' : 'opacity-40'}`}>
              <span className="text-sm">🏷️</span>
              <span className={`text-xs ${currentTheme?.textColor || 'text-gray-600'}`}>카테고리</span>
              {category.trim() && <span className="text-xs text-green-500">✓</span>}
            </div>
            <div className={`flex items-center space-x-1 ${editor?.getHTML()?.trim() ? 'opacity-100' : 'opacity-40'}`}>
              <span className="text-sm">✍️</span>
              <span className={`text-xs ${currentTheme?.textColor || 'text-gray-600'}`}>내용</span>
              {editor?.getHTML()?.trim() && <span className="text-xs text-green-500">✓</span>}
            </div>
            <div className={`flex items-center space-x-1 ${imageFile || existingImageUrl ? 'opacity-100' : 'opacity-40'}`}>
              <span className="text-sm">📸</span>
              <span className={`text-xs ${currentTheme?.textColor || 'text-gray-600'}`}>썸네일</span>
              {(imageFile || existingImageUrl) && <span className="text-xs text-green-500">✓</span>}
            </div>
          </div>
        </div>

        {/* 다음 단계 안내 */}
        {!isContentComplete && (
          <div className={`mb-6 p-4 rounded-xl border-2 border-dashed ${currentTheme?.inputBorder || 'border-blue-300'} ${currentTheme?.modalBgColor || 'bg-blue-50'}`}>
            <div className="flex items-center space-x-3">
              <div className="text-2xl">✍️</div>
              <div>
                <p className={`font-medium ${currentTheme?.textColor || 'text-blue-800'}`}>
                  먼저 글을 작성해주세요
                </p>
                <p className={`text-sm opacity-80 ${currentTheme?.textColor || 'text-blue-700'}`}>
                  제목, 카테고리, 내용을 모두 입력하면 썸네일을 선택할 수 있습니다
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 썸네일 토글 버튼 - 조건부 표시 */}
        {isContentComplete && (
          <div className="mb-4">
            <button
              onClick={() => setShowThumbnail(!showThumbnail)}
              className={`flex items-center justify-between w-full p-4 rounded-xl border-2 transition-all duration-200 ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} hover:border-gray-400`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-xl">📸</div>
                <div>
                  <h3 className={`text-lg font-semibold text-left ${currentTheme?.textColor || 'text-gray-900'}`}>
                    썸네일 이미지 <span className="text-red-500">*</span>
                  </h3>
                  <p className={`text-sm opacity-70 text-left ${currentTheme?.textColor || 'text-gray-600'}`}>
                    {imageFile ? `새 이미지 선택됨: ${imageFile.name}` : 
                     existingImageUrl ? '기존 이미지 사용 중 (새 이미지를 선택하여 변경 가능)' : 
                     '이미지를 선택해주세요'}
                  </p>
                </div>
              </div>
              <div className={`transform transition-transform duration-200 ${showThumbnail ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
          </div>
        )}

        {/* 썸네일 업로드 섹션 - 토글 */}
        <AnimatePresence key="thumbnail-section">
          {isContentComplete && showThumbnail && (
            <div className="mb-6 overflow-hidden">
              {/* 드래그 앤 드롭 영역 */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${
                  dragActive 
                    ? `bg-blue-100 border-blue-500 shadow-lg transform scale-105` 
                    : imageFile 
                      ? `${currentTheme?.modalBgColor || 'bg-green-50'} ${currentTheme?.inputBorder || 'border-green-300'}`
                      : `${currentTheme?.inputBg || 'bg-gray-50'} ${currentTheme?.inputBorder || 'border-gray-300'} hover:border-gray-400 hover:bg-gray-100`
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {/* 드래그 활성화 시 오버레이 */}
                {dragActive && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-xl flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="text-6xl mb-4 animate-bounce">📁</div>
                      <p className="text-xl font-bold text-blue-600">
                        여기에 이미지를 놓으세요!
                      </p>
                      <p className="text-sm text-blue-500 mt-2">
                        JPG, PNG, GIF 파일 지원 (최대 5MB)
                      </p>
                    </div>
                  </div>
                )}

                {/* 갤러리 선택용 input */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploading}
                  className="hidden"
                  id="thumbnail-gallery-upload"
                />
                
                {/* 카메라 촬영용 input */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  disabled={uploading}
                  className="hidden"
                  id="thumbnail-camera-upload"
                />
                
                <div className={`text-center ${dragActive ? 'opacity-30' : 'opacity-100'} transition-opacity duration-300`}>
                  {imageFile ? (
                    <div className="space-y-3">
                      <div className="text-4xl">✅</div>
                      <div>
                        <p className={`font-medium ${currentTheme?.textColor || 'text-green-700'}`}>
                          {imageFile.name}
                        </p>
                        <p className={`text-sm opacity-70 ${currentTheme?.textColor || 'text-green-600'}`}>
                          {(imageFile.size / 1024 / 1024).toFixed(2)}MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImageFile(null)}
                        className={`text-sm underline ${currentTheme?.textColor || 'text-gray-600'} hover:opacity-70`}
                      >
                        다른 이미지 선택
                      </button>
                    </div>
                  ) : existingImageUrl ? (
                    <div className="space-y-3">
                      <div className="text-4xl">🖼️</div>
                      <div>
                        <p className={`font-medium ${currentTheme?.textColor || 'text-blue-700'}`}>
                          기존 썸네일 이미지
                        </p>
                        <p className={`text-sm opacity-70 ${currentTheme?.textColor || 'text-blue-600'}`}>
                          현재 노트의 썸네일을 사용합니다
                        </p>
                      </div>
                      <div className="mt-4">
                        <img 
                          src={existingImageUrl} 
                          alt="기존 썸네일" 
                          className="max-w-full max-h-48 mx-auto rounded-lg shadow-md"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            console.warn("기존 썸네일 이미지 로드 실패:", existingImageUrl);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setExistingImageUrl(null)}
                        className={`text-sm underline ${currentTheme?.textColor || 'text-gray-600'} hover:opacity-70`}
                      >
                        새 이미지로 변경
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-4xl animate-pulse">📸</div>
                      <div>
                        <p className={`font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                          썸네일 이미지를 업로드하세요
                        </p>
                        <p className={`text-sm opacity-70 ${currentTheme?.textColor || 'text-gray-600'}`}>
                          드래그 앤 드롭하거나 아래 버튼을 클릭하세요 (최대 5MB)
                        </p>
                      </div>
                      
                      {/* 업로드 버튼들 */}
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {/* 카메라 버튼 */}
                        <button
                          type="button"
                          onClick={() => document.getElementById("thumbnail-camera-upload").click()}
                          disabled={uploading}
                          className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} border-transparent hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <span className="text-lg">📷</span>
                          <span className="font-medium">카메라로 촬영</span>
                        </button>
                        
                        {/* 갤러리 버튼 */}
                        <button
                          type="button"
                          onClick={handleImageButtonClick}
                          disabled={uploading}
                          className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputText || 'text-gray-700'} ${currentTheme?.inputBorder || 'border-gray-300'} hover:border-gray-400 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <span className="text-lg">🖼️</span>
                          <span className="font-medium">갤러리에서 선택</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* 에러 메시지 */}
        {error && (
          <div className={`mb-4 p-4 rounded-lg border ${currentTheme?.modalBgColor || 'bg-red-50'} border-red-200`}>
            <div className="flex items-center space-x-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* 왼쪽: 완료 상태 요약 */}
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
              {isEditMode ? 
                (isContentComplete ? "수정 준비 완료!" : "글 내용을 확인해주세요") :
                (isContentComplete ? 
                  (imageFile || existingImageUrl ? "발행 준비 완료!" : "썸네일만 선택하면 완료!") : 
                  "글 작성을 완료해주세요"
                )
              }
            </span>
          </div>

          {/* 오른쪽: 액션 버튼 */}
          <div className="flex space-x-3">
            <ThemedButton 
              onClick={() => navigate("/")}
              variant="secondary"
              className="px-6 py-3"
            >
              취소
            </ThemedButton>
            <ThemedButton 
              onClick={() => {
            
            
            
            
            
            
            
            
            
            
            
            
            
            
                handleSubmit();
              }} 
              disabled={uploading || (!isEditMode && !(imageFile || existingImageUrl)) || !isContentComplete}
              className="px-8 py-3 font-semibold"
            >
              {uploading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>발행 중...</span>
                </div>
              ) : (
                isEditMode ? "수정하기" : "발행하기"
              )}
            </ThemedButton>
          </div>
        </div>
      </div>

      {/* 모바일 이미지 선택 모달 */}
      <AnimatePresence key="mobile-modal">
        {showImageModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50" onClick={() => setShowImageModal(false)}>
            <div className={`w-full max-w-md mx-4 mb-4 rounded-t-2xl overflow-hidden ${currentTheme?.modalBgColor || 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              {/* 모달 헤더 */}
              <div className={`p-4 border-b ${currentTheme?.inputBorder || 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
                    이미지 선택
                  </h3>
                  <button
                    onClick={() => setShowImageModal(false)}
                    className={`p-2 rounded-full ${currentTheme?.inputBg || 'hover:bg-gray-100'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 모달 내용 */}
              <div className="p-4 space-y-3">
                <button
                  onClick={() => {
                    document.getElementById("thumbnail-camera-upload").click();
                    setShowImageModal(false);
                  }}
                  className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 ${currentTheme?.inputBg || 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <div className="text-2xl">📷</div>
                  <div className="text-left">
                    <p className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>카메라로 촬영</p>
                    <p className={`text-sm opacity-70 ${currentTheme?.textColor || 'text-gray-600'}`}>새로운 사진을 촬영합니다</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    document.getElementById("thumbnail-gallery-upload").click();
                    setShowImageModal(false);
                  }}
                  className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 ${currentTheme?.inputBg || 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <div className="text-2xl">🖼️</div>
                  <div className="text-left">
                    <p className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>갤러리에서 선택</p>
                    <p className={`text-sm opacity-70 ${currentTheme?.textColor || 'text-gray-600'}`}>기존 사진을 선택합니다</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ButtonLayout; 