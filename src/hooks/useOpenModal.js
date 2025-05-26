/**
 * 모달 상태 관리를 위한 커스텀 훅
 * 
 * 기능:
 * - 모달의 열림/닫힘 상태 관리
 * - 모달 열기/닫기 함수 제공
 * 
 * 반환값:
 * - isOpen: 모달 열림 상태 (boolean)
 * - open: 모달 열기 함수
 * - close: 모달 닫기 함수
 * 
 * NOTE: useCallback을 사용하여 함수 재생성 방지로 성능 최적화
 */
import { useState, useCallback } from 'react';

export default function useOpenModal() {
  // 모달 열림/닫힘 상태
  const [isOpen, setIsOpen] = useState(false);
  
  // 모달 열기 함수 - useCallback으로 메모이제이션
  const open = useCallback(() => setIsOpen(true), []);
  
  // 모달 닫기 함수 - useCallback으로 메모이제이션
  const close = useCallback(() => setIsOpen(false), []);
  
  return { isOpen, open, close };
}
