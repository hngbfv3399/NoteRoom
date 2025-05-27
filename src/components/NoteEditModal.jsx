/**
 * 노트 수정/삭제 모달 컴포넌트
 * 
 * 주요 기능:
 * - 노트 제목, 내용, 카테고리 수정
 * - 노트 삭제 (확인 다이얼로그 포함)
 * - 본인 노트만 수정/삭제 가능
 * - 테마 시스템 적용
 * - 반응형 디자인
 * 
 * NOTE: 수정 시 TipTap 에디터 사용
 * TODO: 이미지 수정 기능 추가
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import PropTypes from 'prop-types';
import { updateNoteInFirestore, deleteNoteFromFirestore } from '@/utils/firebaseNoteDataUtil';
import ThemedButton from '@/components/ui/ThemedButton';

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

function NoteEditModal({ isOpen, onClose, note, onNoteUpdated, onNoteDeleted }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // TipTap 에디터 설정
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        heading: { levels: [1, 2, 3] },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] ${current === 'dark' ? 'prose-invert' : ''} ${currentTheme?.textColor || 'text-gray-800'}`,
      },
    },
  });

  // 노트 데이터로 폼 초기화
  useEffect(() => {
    if (note && isOpen) {
      setTitle(note.title || '');
      setCategory(note.category || '');
      if (editor) {
        editor.commands.setContent(note.content || '');
      }
      setError(null);
    }
  }, [note, isOpen, editor]);

  // 모달 닫기 시 폼 리셋
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setCategory('');
      setError(null);
      setShowDeleteConfirm(false);
      if (editor) {
        editor.commands.clearContent();
      }
    }
  }, [isOpen, editor]);

  // 노트 업데이트 핸들러
  const handleUpdate = async () => {
    console.log("=== NoteEditModal handleUpdate 시작 ===");
    console.log("note:", note);
    console.log("title:", title);
    console.log("category:", category);
    console.log("editor:", editor);
    console.log("editor.getHTML():", editor?.getHTML());
    
    if (!note) {
      console.log("note가 없어서 종료");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      console.log("로딩 시작");

      // 유효성 검사
      if (!title.trim()) {
        throw new Error('제목을 입력해주세요.');
      }
      if (!category.trim()) {
        throw new Error('카테고리를 선택해주세요.');
      }
      if (!editor?.getHTML()?.trim()) {
        throw new Error('내용을 입력해주세요.');
      }

      const updateData = {
        title: title.trim(),
        category: category.trim(),
        content: editor.getHTML(),
      };

      console.log("=== NoteEditModal 업데이트 데이터 ===");
      console.log("updateData:", updateData);
      console.log("note.id:", note.id);

      await updateNoteInFirestore(note.id, updateData);
      
      console.log("업데이트 성공!");
      
      // 부모 컴포넌트에 업데이트 알림
      if (onNoteUpdated) {
        onNoteUpdated({
          ...note,
          ...updateData,
          updatedAt: new Date()
        });
      }

      onClose();
    } catch (error) {
      console.error("=== NoteEditModal 에러 ===");
      console.error("error:", error);
      setError(error.message);
      console.error('노트 업데이트 실패:', error);
    } finally {
      setIsLoading(false);
      console.log("로딩 종료");
    }
  };

  // 노트 삭제 핸들러
  const handleDelete = async () => {
    if (!note) return;

    try {
      setError(null);
      setIsLoading(true);

      await deleteNoteFromFirestore(note.id, note.userUid || note.userId);
      
      // 부모 컴포넌트에 삭제 알림
      if (onNoteDeleted) {
        onNoteDeleted(note.id);
      }

      onClose();
    } catch (error) {
      setError(error.message);
      console.error('노트 삭제 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !note) return null;

  return (
    <AnimatePresence key="note-edit-modal">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden ${currentTheme?.modalBgColor || 'bg-white'} shadow-2xl ${current === 'dark' ? 'prose-invert' : ''}`}
          style={{
            ...(current === 'dark' && {
              '--tw-prose-body': '#ffffff',
              '--tw-prose-headings': '#ffffff',
              '--tw-prose-lead': '#ffffff',
              '--tw-prose-links': '#ffffff',
              '--tw-prose-bold': '#ffffff',
              '--tw-prose-counters': '#ffffff',
              '--tw-prose-bullets': '#ffffff',
              '--tw-prose-hr': '#ffffff',
              '--tw-prose-quotes': '#ffffff',
              '--tw-prose-quote-borders': '#ffffff',
              '--tw-prose-captions': '#ffffff',
              '--tw-prose-code': '#ffffff',
              '--tw-prose-pre-code': '#ffffff',
              '--tw-prose-pre-bg': '#1f2937',
              '--tw-prose-th-borders': '#ffffff',
              '--tw-prose-td-borders': '#ffffff',
            })
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className={`p-6 border-b ${currentTheme?.inputBorder || 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">✏️</div>
                <h2 className={`text-xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                  노트 수정
                </h2>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${currentTheme?.inputBg || 'hover:bg-gray-100'}`}
                disabled={isLoading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 내용 */}
          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            <div className="space-y-6">
              {/* 제목 입력 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.inputText || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="노트 제목을 입력하세요"
                  disabled={isLoading}
                />
              </div>

              {/* 카테고리 선택 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.inputText || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  disabled={isLoading}
                >
                  <option value="">카테고리를 선택하세요</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 내용 에디터 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
                  내용 <span className="text-red-500">*</span>
                </label>
                <div className={`border rounded-lg ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.inputBg || 'bg-white'}`}>
                  <EditorContent 
                    editor={editor} 
                    className="p-4 min-h-[200px] focus-within:ring-2 focus-within:ring-blue-500 rounded-lg"
                  />
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${currentTheme?.modalBgColor || 'bg-red-50'} border-red-200`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-red-500">⚠️</span>
                    <span className="text-red-700 font-medium">{error}</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* 푸터 */}
          <div className={`p-6 border-t ${currentTheme?.inputBorder || 'border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {/* 삭제 버튼 */}
              <ThemedButton
                onClick={() => setShowDeleteConfirm(true)}
                variant="danger"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                🗑️ 삭제
              </ThemedButton>

              {/* 수정/취소 버튼 */}
              <div className="flex space-x-3 w-full sm:w-auto">
                <ThemedButton
                  onClick={onClose}
                  variant="secondary"
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  취소
                </ThemedButton>
                <ThemedButton
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>수정 중...</span>
                    </div>
                  ) : (
                    '✅ 수정 완료'
                  )}
                </ThemedButton>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* 삭제 확인 다이얼로그 */}
      <AnimatePresence key="delete-confirm">
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl overflow-hidden ${currentTheme?.modalBgColor || 'bg-white'} shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="text-center">
                  <div className="text-4xl mb-4">🗑️</div>
                  <h3 className={`text-lg font-bold mb-2 ${currentTheme?.textColor || 'text-gray-900'}`}>
                    노트를 삭제하시겠습니까?
                  </h3>
                  <p className={`text-sm opacity-70 mb-6 ${currentTheme?.textColor || 'text-gray-600'}`}>
                    삭제된 노트는 복구할 수 없습니다.
                  </p>
                  
                  <div className="flex space-x-3">
                    <ThemedButton
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="secondary"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      취소
                    </ThemedButton>
                    <ThemedButton
                      onClick={handleDelete}
                      variant="danger"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>삭제 중...</span>
                        </div>
                      ) : (
                        '삭제'
                      )}
                    </ThemedButton>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

NoteEditModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  note: PropTypes.object,
  onNoteUpdated: PropTypes.func,
  onNoteDeleted: PropTypes.func,
};

export default NoteEditModal; 