import React, { memo, useEffect, useCallback, useRef } from "react";
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from "framer-motion";

const dropDownVariants = {
  hidden: { opacity: 0, y: -50 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -50 },
};

const ModalOne = memo(function ModalOne({ isOpen, onClose, children }) {
  const modalRef = useRef(null);

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
      // 모달이 열릴 때 스크롤 잠금
      document.body.style.overflow = 'hidden';
      // 키보드 이벤트 리스너 추가
      document.addEventListener('keydown', handleKeyDown);
      // 첫 번째 포커스 가능한 요소에 포커스
      const firstFocusable = modalRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }

    return () => {
      // 클린업: 모달이 닫힐 때 스크롤 잠금 해제
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" ref={modalRef}>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 hide-scrollbar"
        onClick={onClose}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 flex justify-center items-start z-50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropDownVariants}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
          >
            <div
              className="rounded-lg shadow-lg max-w-3xl w-full p-6 relative mt-[10vh] max-h-[80vh] overflow-y-auto hide-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
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
