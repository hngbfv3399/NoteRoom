import React, { memo, useEffect, useCallback, useRef } from "react";
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { getModalThemeClass } from "@/utils/themeHelper";

const dropDownVariants = {
  hidden: { opacity: 0, y: -50 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -50 },
};

const ModalOne = memo(function ModalOne({ isOpen, onClose, children }) {
  const modalRef = useRef(null);
  
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const modalBgClass = themes[current] ? getModalThemeClass(themes[current]) : "bg-white";

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }

    // Tab 키 처리
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // 초기 포커스 설정 - 모달이 처음 열릴 때만 실행
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 포커스 설정
      const timer = setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        // 현재 포커스된 요소가 모달 내부에 없을 때만 포커스 이동
        if (firstFocusable && !modalRef.current?.contains(document.activeElement)) {
          firstFocusable.focus();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]); // handleKeyDown 의존성 제거

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true">
      {/* FIXME: 이 div는 시각적 배경이지만, 이벤트 처리상 분리되어 있어 클릭 감지 범위가 부정확할 수 있음 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 hide-scrollbar"
        onClick={onClose}
      />

      <AnimatePresence key="modal-one">
        {isOpen && (
          <motion.div
            // TODO: 이 부분에서 모달 전체 래퍼로 감싸고 내부로 ref를 넘기면 구조적으로 더 명확함
            className="fixed inset-0 flex justify-center items-start z-50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropDownVariants}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
          >
            <div
              ref={modalRef}
              className={`rounded-lg shadow-lg max-w-3xl w-full p-6 relative mt-[10vh] max-h-[80vh] overflow-y-auto hide-scrollbar ${modalBgClass}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* TODO: 닫기 버튼에 focus 표시 없을 수 있음 → 접근성 향상 위해 focus-visible 스타일 고려 */}
              <button
                className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 transition-colors p-2"
                onClick={onClose}
                aria-label="모달 닫기"
              >
                <span aria-hidden="true">✕</span>
              </button>
              <div className="pt-4">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ModalOne.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export default ModalOne;
