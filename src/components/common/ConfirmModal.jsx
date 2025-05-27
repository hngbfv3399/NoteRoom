/**
 * 확인/취소 모달 컴포넌트
 * 
 * 주요 기능:
 * - 사용자 확인이 필요한 작업에 사용
 * - 위험한 작업에 대한 경고 표시
 * - 테마 시스템 적용
 * - 접근성 지원
 * - 애니메이션 효과
 * 
 * IMPROVED: AlertModal을 기반으로 한 특화된 확인 모달
 */
import React from 'react';
import AlertModal from './AlertModal';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '확인',
  message,
  confirmText = '확인',
  cancelText = '취소',
  type = 'warning', // 'warning', 'danger', 'info'
  size = 'md',
  className = ''
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <AlertModal
      isOpen={isOpen}
      onClose={onClose}
      type={type}
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
      showCancel={true}
      onConfirm={handleConfirm}
      onCancel={onClose}
      size={size}
      className={className}
    />
  );
};

export default ConfirmModal; 