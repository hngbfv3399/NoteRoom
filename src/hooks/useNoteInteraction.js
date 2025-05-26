/**
 * 노트 상호작용을 관리하는 커스텀 훅
 * 
 * 기능:
 * - 노트 클릭 시 조회수 증가
 * - 모달 또는 페이지 이동 선택 가능
 * - 선택된 노트 상태 관리
 * - 에러 처리 및 로딩 상태 관리
 * 
 * NOTE: 조회수 증가 실패 시에도 모달은 열림 (UX 우선)
 * TODO: 토스트 메시지로 에러 피드백 추가
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { incrementNoteViews } from '@/utils/firebaseNoteDataUtil';

export const useNoteInteraction = (options = {}) => {
  const { 
    useModal = false,  // 기본값: 페이지 이동 (공유 가능)
    enableViewIncrement = true 
  } = options;
  
  const navigate = useNavigate();
  const [selectedNote, setSelectedNote] = useState(null);
  const [isUpdatingViews, setIsUpdatingViews] = useState(false);

  // 노트 클릭 핸들러 - 조회수 증가 후 모달 열기 또는 페이지 이동
  const handleNoteClick = useCallback(async (note) => {
    setIsUpdatingViews(true);
    
    try {
      // 조회수 증가 시도 (옵션에 따라)
      if (enableViewIncrement) {
        await incrementNoteViews(note.id);
      }
    } catch (error) {
      // 조회수 증가 실패해도 계속 진행 (UX 우선)
      console.error('조회수 증가 실패:', error);
      
      // TODO: 토스트 메시지로 사용자에게 알림
      // showToast('일시적인 오류가 발생했습니다', 'warning');
    } finally {
      setIsUpdatingViews(false);
      
      if (useModal) {
        // 모달로 표시 (기존 방식)
        setSelectedNote(note);
      } else {
        // 독립 페이지로 이동 (공유 가능한 URL)
        navigate(`/note/${note.id}`);
      }
    }
  }, [enableViewIncrement, useModal, navigate]);

  // 모달 닫기 핸들러
  const handleCloseModal = useCallback(() => {
    setSelectedNote(null);
  }, []);

  // 선택된 노트 직접 설정 (외부에서 사용할 경우)
  const selectNote = useCallback((note) => {
    setSelectedNote(note);
  }, []);

  return {
    selectedNote,
    isUpdatingViews,
    handleNoteClick,
    handleCloseModal,
    selectNote,
  };
}; 