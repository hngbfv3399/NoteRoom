/**
 * 노트 상세 보기 전용 모달 컴포넌트
 * 
 * 주요 기능:
 * - 노트 상세 내용을 모달로 표시
 * - 테마 적용 지원
 * - 애니메이션 효과
 * - 접근성 지원 (키보드 네비게이션, ARIA)
 * 
 * NOTE: MemoDetail 컴포넌트를 래핑하여 일관된 모달 UI 제공
 * TODO: 모달 크기 조절, 전체화면 모드 추가
 */
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import MemoDetail from '@/pages/MemoDetail';
import { getModalThemeClass } from '@/utils/themeHelper';

const NoteModal = ({ 
  isOpen, 
  onClose, 
  note, 
  showAnimation = true 
}) => {
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const modalBgClass = getModalThemeClass(currentTheme);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // 모달 열릴 때 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      // 모달 닫힐 때 스크롤 복원
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen || !note) return null;

  return (
    <>
      {/* 모달 오버레이 */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="모달 닫기"
      />
      
      {/* 모달 본문 */}
      <div
        className={`
          fixed left-1/2 top-0 transform -translate-x-1/2
          rounded-lg shadow-lg border
          w-[95vw] max-w-[1000px]
          max-h-[70vh] overflow-y-auto p-6 z-50
          hide-scrollbar
          ${modalBgClass}
          ${currentTheme?.textColor || 'text-gray-800'}
          ${currentTheme?.inputBorder || 'border-gray-300'}
          ${current === 'dark' ? 'prose-invert' : ''}
          ${showAnimation 
            ? `transition-transform duration-300 ${isOpen ? "translate-y-[5vh]" : "-translate-y-full"}` 
            : "translate-y-[5vh]"
          }
        `}
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-modal-title"
        aria-describedby="note-modal-content"
      >
        {/* 모달 닫기 버튼 */}
        <button
          className={`absolute top-3 right-3 text-2xl font-bold leading-none z-10 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 ${currentTheme?.buttonBg || 'bg-gray-100'} ${currentTheme?.buttonText || 'text-gray-600'} ${currentTheme?.buttonHover || 'hover:bg-gray-200'}`}
          onClick={onClose}
          aria-label="모달 닫기"
        >
          ✕
        </button>
        
        {/* 노트 상세 내용 */}
        <div id="note-modal-content">
          <MemoDetail note={note} />
        </div>
      </div>
    </>
  );
};

NoteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  note: PropTypes.object,
  showAnimation: PropTypes.bool,
};

export default NoteModal; 