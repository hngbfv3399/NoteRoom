/**
 * 재사용 가능한 모달 컴포넌트
 * 
 * 기능:
 * - 테마 시스템 완전 지원
 * - 접근성 지원 (ARIA, 키보드 네비게이션)
 * - 애니메이션 효과
 * - 다양한 크기 및 스타일 옵션
 * - 모바일 최적화
 */

import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { getThemeClass } from '@/utils/themeHelper';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  footer,
  maxHeight = 'auto',
  showAnimation = true,
  zIndex = 50,
  ...props
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const themeClass = getThemeClass(currentTheme);

  // 모달 크기 설정
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    xlarge: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  // 애니메이션 설정
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
      y: 20 
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  // 포커스 관리
  useEffect(() => {
    if (isOpen) {
      // 현재 포커스된 요소 저장
      previousFocusRef.current = document.activeElement;
      
      // 모달에 포커스 설정
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
      
      // 스크롤 방지
      document.body.style.overflow = 'hidden';
    } else {
      // 이전 포커스 복원
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
      
      // 스크롤 복원
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;

      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }

      // Tab 키 트래핑 (모달 내에서만 포커스 이동)
      if (event.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // 백드롭 클릭 처리
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={`fixed inset-0 z-${zIndex} flex items-center justify-center p-4`}
      style={{ zIndex }}
    >
      {/* 백드롭 */}
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        variants={showAnimation ? backdropVariants : {}}
        initial={showAnimation ? "hidden" : false}
        animate={showAnimation ? "visible" : false}
        exit={showAnimation ? "hidden" : false}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* 모달 컨테이너 */}
      <motion.div
        ref={modalRef}
        className={`
          relative w-full ${sizeClasses[size]} 
          ${currentTheme?.cardBg || 'bg-white'} 
          ${currentTheme?.borderColor || 'border border-gray-200'}
          rounded-lg shadow-xl
          ${themeClass}
          ${className}
        `}
        style={{ 
          maxHeight: maxHeight === 'auto' ? '90vh' : maxHeight,
          overflow: 'hidden'
        }}
        variants={showAnimation ? modalVariants : {}}
        initial={showAnimation ? "hidden" : false}
        animate={showAnimation ? "visible" : false}
        exit={showAnimation ? "exit" : false}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        tabIndex={-1}
        {...props}
      >
        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className={`
            flex items-center justify-between p-6 
            ${currentTheme?.borderColor || 'border-b border-gray-200'}
            ${headerClassName}
          `}>
            {title && (
              <h2 
                id="modal-title"
                className={`text-xl font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}
              >
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className={`
                  p-2 rounded-lg transition-colors
                  ${currentTheme?.hoverBg || 'hover:bg-gray-100'}
                  ${currentTheme?.textSecondary || 'text-gray-500'}
                  hover:${currentTheme?.textColor || 'text-gray-700'}
                `}
                aria-label="모달 닫기"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* 바디 */}
        <div 
          className={`
            p-6 overflow-y-auto
            ${bodyClassName}
          `}
          style={{ 
            maxHeight: title || showCloseButton ? 'calc(90vh - 140px)' : 'calc(90vh - 48px)'
          }}
        >
          {children}
        </div>

        {/* 푸터 */}
        {footer && (
          <div className={`
            p-6 
            ${currentTheme?.borderColor || 'border-t border-gray-200'}
            ${footerClassName}
          `}>
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {isOpen && modalContent}
    </AnimatePresence>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge', 'full']),
  showCloseButton: PropTypes.bool,
  closeOnBackdropClick: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string,
  footer: PropTypes.node,
  maxHeight: PropTypes.string,
  showAnimation: PropTypes.bool,
  zIndex: PropTypes.number,
};

export default Modal; 