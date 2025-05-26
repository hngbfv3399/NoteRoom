/**
 * 신고 모달 컴포넌트
 * 콘텐츠 신고를 위한 모달 인터페이스를 제공합니다.
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FiX, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { reportContent } from '@/utils/reportUtils';
import { REPORT_REASONS, REPORT_REASON_LABELS } from '@/constants/adminConstants';
import { 
  selectModalBgColor, 
  selectInputBorder, 
  selectTextColor, 
  selectInputBgColor
} from '@/store/selectors';
import { auth } from '@/services/firebase';

function ReportModal({ 
  isOpen, 
  onClose, 
  contentType, 
  contentId, 
  contentTitle = '이 콘텐츠' 
}) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  // 개별 selector 사용으로 안정적인 참조 보장
  const modalBgColor = useSelector(selectModalBgColor);
  const inputBorder = useSelector(selectInputBorder);
  const textColor = useSelector(selectTextColor);
  const inputBgColor = useSelector(selectInputBgColor);

  // 모달 초기화
  const resetModal = () => {
    setSelectedReason('');
    setDescription('');
    setSubmitResult(null);
    setIsSubmitting(false);
  };

  // 모달 닫기
  const handleClose = () => {
    resetModal();
    onClose();
  };

  // 신고 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason) {
      alert('신고 사유를 선택해주세요.');
      return;
    }

    // Firebase Auth에서 직접 현재 사용자 확인
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await reportContent(
        contentType,
        contentId,
        selectedReason,
        description,
        currentUser.uid
      );

      setSubmitResult(result);

      if (result.success) {
        // 성공 시 3초 후 모달 닫기
        setTimeout(() => {
          handleClose();
        }, 3000);
      }

    } catch (error) {
      console.error('신고 처리 오류:', error);
      setSubmitResult({
        success: false,
        message: '신고 처리 중 오류가 발생했습니다.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className={`w-full max-w-md rounded-2xl shadow-2xl ${modalBgColor || 'bg-white'} max-h-[90vh] overflow-y-auto`}
      >
        {/* 헤더 */}
        <div className={`flex items-center justify-between p-6 border-b ${inputBorder || 'border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <FiAlertTriangle className="text-red-500 text-xl" />
            <h2 className={`text-xl font-bold ${textColor || 'text-gray-900'}`}>
              콘텐츠 신고
            </h2>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${textColor || 'text-gray-500'}`}
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {submitResult ? (
            // 결과 표시
            <div className="text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                submitResult.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {submitResult.success ? (
                  <FiCheck className="text-green-600 text-2xl" />
                ) : (
                  <FiAlertTriangle className="text-red-600 text-2xl" />
                )}
              </div>
              <p className={`text-lg font-medium mb-2 ${
                submitResult.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {submitResult.success ? '신고 완료' : '신고 실패'}
              </p>
              <p className={`${textColor || 'text-gray-600'}`}>
                {submitResult.message}
              </p>
              {submitResult.success && (
                <p className={`text-sm mt-2 ${textColor || 'text-gray-500'}`}>
                  3초 후 자동으로 닫힙니다.
                </p>
              )}
            </div>
          ) : (
            // 신고 폼
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 신고 대상 */}
              <div>
                <p className={`text-sm ${textColor || 'text-gray-600'} mb-2`}>
                  신고 대상: <span className="font-medium">{contentTitle}</span>
                </p>
              </div>

              {/* 신고 사유 선택 */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${textColor || 'text-gray-700'}`}>
                  신고 사유 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
                    <label key={value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="reason"
                        value={value}
                        checked={selectedReason === value}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className={`text-sm ${textColor || 'text-gray-700'}`}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 상세 설명 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${textColor || 'text-gray-700'}`}>
                  상세 설명 (선택사항)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="신고 사유에 대한 자세한 설명을 입력해주세요."
                  rows={4}
                  maxLength={500}
                  className={`w-full px-4 py-3 rounded-xl border resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    inputBgColor || 'bg-gray-50'
                  } ${inputBorder || 'border-gray-200'} ${textColor || 'text-gray-900'}`}
                />
                <p className={`text-xs mt-1 ${textColor || 'text-gray-500'}`}>
                  {description.length}/500
                </p>
              </div>

              {/* 주의사항 */}
              <div className={`p-4 rounded-xl ${inputBgColor || 'bg-yellow-50'} border ${inputBorder || 'border-yellow-200'}`}>
                <p className={`text-sm ${textColor || 'text-yellow-800'}`}>
                  <strong>주의사항:</strong> 허위 신고는 제재 대상이 될 수 있습니다. 
                  신중하게 신고해주세요.
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className={`flex-1 py-3 px-4 rounded-xl border font-medium transition-colors ${
                    inputBorder || 'border-gray-300'
                  } ${textColor || 'text-gray-700'} hover:bg-gray-50`}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!selectedReason || isSubmitting}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                    !selectedReason || isSubmitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isSubmitting ? '신고 중...' : '신고하기'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportModal; 