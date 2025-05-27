/**
 * 재사용 가능한 알림 모달 컴포넌트
 * 
 * 주요 기능:
 * - 다양한 타입의 알림 표시 (success, error, warning, info)
 * - 테마 시스템 적용
 * - 커스터마이징 가능한 버튼
 * - 접근성 지원
 * - 애니메이션 효과
 * 
 * IMPROVED: 모달 컴포넌트 분리로 재사용성 향상
 */
import React from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle, FaTimes } from 'react-icons/fa';
import { getModalThemeClass } from '@/utils/themeHelper';
import ThemedButton from '@/components/ui/ThemedButton';

const AlertModal = ({
  isOpen,
  onClose,
  title = '알림',
  message,
  type = 'info', // 'success', 'error', 'warning', 'info'
  confirmText = '확인',
  cancelText = '취소',
  showCancel = false,
  onConfirm,
  onCancel,
  children,
  className = '',
  size = 'md' // 'sm', 'md', 'lg', 'xl'
}) => {
  // 테마 상태
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const modalBgClass = currentTheme ? getModalThemeClass(currentTheme) : "bg-white";

  // 타입별 아이콘 및 색상
  const getTypeConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: <FaCheckCircle className="w-6 h-6 text-green-500" />,
          titleColor: 'text-green-800',
          borderColor: 'border-green-200',
          bgColor: 'bg-green-50'
        };
      case 'error':
        return {
          icon: <FaTimesCircle className="w-6 h-6 text-red-500" />,
          titleColor: 'text-red-800',
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50'
        };
      case 'warning':
        return {
          icon: <FaExclamationTriangle className="w-6 h-6 text-yellow-500" />,
          titleColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          bgColor: 'bg-yellow-50'
        };
      case 'info':
      default:
        return {
          icon: <FaInfoCircle className="w-6 h-6 text-blue-500" />,
          titleColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          bgColor: 'bg-blue-50'
        };
    }
  };

  // 크기별 클래스
  const getSizeClass = (size) => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case 'md':
      default:
        return 'max-w-md';
    }
  };

  const typeConfig = getTypeConfig(type);
  const sizeClass = getSizeClass(size);

  // 확인 버튼 핸들러
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  // 취소 버튼 핸들러
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  // ESC 키 핸들러
  React.useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* 모달 컨텐츠 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`relative w-full ${sizeClass} ${modalBgClass} rounded-lg shadow-xl border ${typeConfig.borderColor} ${className}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
          >
            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 p-1 rounded-full transition-colors ${currentTheme?.textSecondary || 'text-gray-400'} hover:${currentTheme?.textPrimary || 'text-gray-600'}`}
              aria-label="모달 닫기"
            >
              <FaTimes className="w-4 h-4" />
            </button>

            {/* 헤더 */}
            <div className={`p-6 border-b ${currentTheme?.borderColor || 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                {typeConfig.icon}
                <h3 
                  id="modal-title"
                  className={`text-lg font-semibold ${typeConfig.titleColor}`}
                >
                  {title}
                </h3>
              </div>
            </div>

            {/* 본문 */}
            <div className="p-6">
              {children ? (
                children
              ) : (
                <div id="modal-description">
                  {message && (
                    <p className={`whitespace-pre-line ${currentTheme?.textPrimary || 'text-gray-700'}`}>
                      {message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 푸터 (버튼들) */}
            <div className={`px-6 py-4 border-t ${currentTheme?.borderColor || 'border-gray-200'} flex justify-end gap-3`}>
              {showCancel && (
                <ThemedButton
                  variant="outline"
                  onClick={handleCancel}
                >
                  {cancelText}
                </ThemedButton>
              )}
              <ThemedButton
                onClick={handleConfirm}
                variant={type === 'error' ? 'danger' : 'primary'}
              >
                {confirmText}
              </ThemedButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AlertModal; 