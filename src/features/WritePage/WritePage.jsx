import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Editor } from '@tiptap/react';
import MenuBar from './MenuBar';
import TipTap from './TipTap';
import { saveNote } from '@/utils/firebaseNoteDataUtil';
import { auth } from '@/services/firebase';
import ModalOne from '@/features/MainHome/ModalOne';

function WritePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [editor, setEditor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateForm = () => {
    if (!title.trim()) {
      setErrorMessage('제목을 입력해주세요.');
      setShowModal(true);
      return false;
    }
    if (!category) {
      setErrorMessage('카테고리를 선택해주세요.');
      setShowModal(true);
      return false;
    }
    if (!thumbnail) {
      setErrorMessage('썸네일 이미지를 추가해주세요.');
      setShowModal(true);
      return false;
    }
    
    const content = editor?.getHTML() || '';
    if (!content || content === '<p></p>') {
      setErrorMessage('내용을 입력해주세요.');
      setShowModal(true);
      return false;
    }
    if (content.length > 10000) {
      setErrorMessage('내용은 10,000자를 초과할 수 없습니다.');
      setShowModal(true);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    try {
      if (!validateForm()) return;

      const user = auth.currentUser;
      if (!user) {
        setErrorMessage('로그인이 필요합니다.');
        setShowModal(true);
        return;
      }

      const content = editor.getHTML();
      const noteData = {
        title: title.trim(),
        category,
        thumbnail,
        content,
        userUid: user.uid,
        authorName: user.displayName || '익명',
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: 0,
        views: 0,
        commentCount: 0,
      };

      await saveNote(noteData);
      navigate('/');
    } catch (error) {
      console.error('노트 저장 실패:', error);
      setErrorMessage('노트 저장 중 오류가 발생했습니다.');
      setShowModal(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-6 space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="w-full p-2 text-2xl border-b focus:outline-none focus:border-blue-500"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">카테고리 선택</option>
          <option value="일상">일상</option>
          <option value="정보">정보</option>
          <option value="감성">감성</option>
          <option value="시">시</option>
          <option value="사진">사진</option>
          <option value="동영상">동영상</option>
        </select>

        <div>
          <input
            type="text"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            placeholder="썸네일 이미지 URL을 입력하세요"
            className="w-full p-2 border rounded"
          />
          {thumbnail && (
            <img
              src={thumbnail}
              alt="썸네일 미리보기"
              className="mt-2 max-w-xs rounded"
            />
          )}
        </div>
      </div>

      <MenuBar editor={editor} />
      <TipTap onEditorReady={setEditor} />

      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          저장
        </button>
      </div>

      <ModalOne isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">알림</h2>
          <p className="text-gray-700 mb-4">{errorMessage}</p>
          <div className="flex justify-end">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              확인
            </button>
          </div>
        </div>
      </ModalOne>
    </div>
  );
}

export default WritePage; 