/**
 * 확인/취소 모달 컴포넌트
 * 
 * 기능:
 * - 사용자 확인이 필요한 액션에 사용
 * - 테마 시스템 지원
 * - 커스터마이징 가능한 버튼
 */

import React from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import ThemedButton from './ThemedButton';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '확인',
  message,
  confirmText = '확인',
  cancelText = '취소',
  confirmVariant = 'primary',
  cancelVariant = 'secondary',
  isDestructive = false,
  isLoading = false,
  ...props
}) => {
  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  const footer = (
    <div className="flex justify-end space-x-3">
      <ThemedButton
        variant={cancelVariant}
        onClick={onClose}
        disabled={isLoading}
      >
        {cancelText}
      </ThemedButton>
      <ThemedButton
        variant={isDestructive ? 'danger' : confirmVariant}
        onClick={handleConfirm}
        disabled={isLoading}
        loading={isLoading}
      >
        {confirmText}
      </ThemedButton>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      footer={footer}
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
      {...props}
    >
      <div className="text-center">
        {isDestructive && (
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        )}
        <p className="text-gray-600">{message}</p>
      </div>
    </Modal>
  );
};

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmVariant: PropTypes.string,
  cancelVariant: PropTypes.string,
  isDestructive: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default ConfirmModal; 