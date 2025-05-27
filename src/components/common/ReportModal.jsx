/**
 * 신고 모달 컴포넌트
 * 콘텐츠 신고를 위한 모달 인터페이스를 제공합니다.
 * 전역 테마 시스템 완전 지원
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertTriangle, FiCheck, FiZap, FiInfo, FiClock } from 'react-icons/fi';
import { reportContent } from '@/utils/reportUtils';
import { autoModerateContent } from '@/utils/adminUtils';
import { REPORT_REASONS, REPORT_REASON_LABELS } from '@/constants/adminConstants';
import { auth } from '@/services/firebase';

function ReportModal({ 
  isOpen, 
  onClose, 
  contentType, 
  contentId, 
  contentTitle = '이 콘텐츠',
  contentText = '' // 자동 모더레이션을 위한 콘텐츠 텍스트
}) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [moderationPreview, setModerationPreview] = useState(null);


  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // 콘텐츠 자동 모더레이션 미리보기
  useEffect(() => {
    if (contentText && selectedReason) {
      checkModerationPreview();
    }
  }, [contentText, selectedReason]);

  const checkModerationPreview = async () => {
    try {
      const result = await autoModerateContent(contentType, contentId, contentText);
      setModerationPreview(result);
    } catch (error) {
      console.error('모더레이션 미리보기 실패:', error);
    }
  };

  // 모달 초기화
  const resetModal = () => {
    setSelectedReason('');
    setDescription('');
    setSubmitResult(null);
    setIsSubmitting(false);
    setModerationPreview(null);
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

  // 신고 사유별 우선순위 계산
  const getReasonPriority = (reason) => {
    const priorityMap = {
      'violence': 'high',
      'hate_speech': 'high',
      'harassment': 'high',
      'inappropriate': 'medium',
      'misinformation': 'medium',
      'copyright': 'medium',
      'spam': 'low',
      'other': 'low'
    };
    return priorityMap[reason] || 'low';
  };

  // 우선순위 색상 (테마 기반)
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      default: return `${currentTheme?.textSecondary || 'text-gray-600'} ${currentTheme?.cardBg || 'bg-gray-100'}`;
    }
  };

  // 예상 처리 시간 계산
  const getEstimatedProcessingTime = (reason) => {
    const timeMap = {
      'violence': '1-2시간',
      'hate_speech': '1-2시간',
      'harassment': '2-4시간',
      'inappropriate': '4-8시간',
      'misinformation': '8-24시간',
      'copyright': '24-48시간',
      'spam': '자동 처리',
      'other': '24-72시간'
    };
    return timeMap[reason] || '24-72시간';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`${currentTheme?.cardBg || 'bg-white'} rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border ${currentTheme?.borderColor || 'border-gray-200'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FiAlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className={`text-lg font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
                콘텐츠 신고
              </h3>
            </div>
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg ${currentTheme?.hoverBg || 'hover:bg-gray-100'} transition-colors`}
            >
              <FiX className={`w-5 h-5 ${currentTheme?.textSecondary || 'text-gray-600'}`} />
            </button>
          </div>

          {submitResult ? (
            // 결과 표시
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                submitResult.success ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {submitResult.success ? (
                  <FiCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                ) : (
                  <FiX className="w-8 h-8 text-red-600 dark:text-red-400" />
                )}
              </div>
              
              <h4 className={`text-lg font-semibold mb-2 ${currentTheme?.textColor || 'text-gray-900'}`}>
                {submitResult.success ? '신고가 접수되었습니다' : '신고 접수 실패'}
              </h4>
              
              <p className={`${currentTheme?.textSecondary || 'text-gray-600'} mb-4`}>
                {submitResult.message}
              </p>

              {submitResult.success && (
                <div className={`${currentTheme?.cardBg || 'bg-gray-50'} rounded-lg p-4 text-left`}>
                  <h5 className={`font-medium mb-2 ${currentTheme?.textColor || 'text-gray-900'}`}>
                    처리 안내
                  </h5>
                  <ul className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'} space-y-1`}>
                    <li>• 신고가 정상적으로 접수되었습니다</li>
                    <li>• 관리자가 검토 후 적절한 조치를 취할 예정입니다</li>
                    <li>• 처리 결과는 별도로 안내드리지 않습니다</li>
                    <li>• 허위 신고 시 제재를 받을 수 있습니다</li>
                  </ul>
                </div>
              )}
            </motion.div>
          ) : (
            // 신고 폼
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 신고 대상 정보 */}
              <div className={`${currentTheme?.cardBg || 'bg-gray-50'} rounded-lg p-4`}>
                <h4 className={`font-medium mb-2 ${currentTheme?.textColor || 'text-gray-900'}`}>
                  신고 대상
                </h4>
                <p className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                  {contentType === 'note' ? '노트' : '댓글'}: {contentTitle}
                </p>
              </div>

              {/* 신고 사유 선택 */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                  신고 사유 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => {
                    const priority = getReasonPriority(value);
                    const isSelected = selectedReason === value;
                    
                    return (
                      <motion.label
                        key={value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? `${currentTheme?.buttonBg || 'bg-blue-500'} border-blue-500 text-white`
                            : `${currentTheme?.cardBg || 'bg-white'} ${currentTheme?.borderColor || 'border-gray-200'} ${currentTheme?.hoverBg || 'hover:bg-gray-50'}`
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="reason"
                            value={value}
                            checked={isSelected}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="sr-only"
                          />
                          <span className={`text-sm font-medium ${
                            isSelected ? 'text-white' : currentTheme?.textColor || 'text-gray-900'
                          }`}>
                            {label}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* 우선순위 배지 */}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : getPriorityColor(priority)
                          }`}>
                            {priority === 'high' ? '높음' : priority === 'medium' ? '보통' : '낮음'}
                          </span>
                          
                          {/* 예상 처리 시간 */}
                          {selectedReason === value && (
                            <div className="flex items-center space-x-1 text-white/80">
                              <FiClock className="w-3 h-3" />
                              <span className="text-xs">{getEstimatedProcessingTime(value)}</span>
                            </div>
                          )}
                        </div>
                      </motion.label>
                    );
                  })}
                </div>
              </div>

              {/* 자동 모더레이션 미리보기 */}
              {moderationPreview && selectedReason && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`${currentTheme?.cardBg || 'bg-blue-50'} rounded-lg p-4 border-l-4 border-blue-500`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <FiZap className="w-4 h-4 text-blue-500" />
                    <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-blue-900'}`}>
                      자동 모더레이션 분석
                    </span>
                  </div>
                  <div className={`text-sm ${currentTheme?.textSecondary || 'text-blue-700'}`}>
                    <p>신뢰도: {Math.round(moderationPreview.confidence * 100)}%</p>
                    {moderationPreview.reasons.length > 0 && (
                      <p>감지된 문제: {moderationPreview.reasons.join(', ')}</p>
                    )}
                    {moderationPreview.autoBlocked && (
                      <p className="text-red-600 font-medium">⚠️ 자동 차단 대상으로 분류됨</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* 상세 설명 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${currentTheme?.textColor || 'text-gray-900'}`}>
                  상세 설명 (선택사항)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="신고 사유에 대한 구체적인 설명을 입력해주세요..."
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    currentTheme?.inputBg || 'bg-white'
                  } ${currentTheme?.borderColor || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'}`}
                />
              </div>

              {/* 신고 전 확인사항 */}
              <div className={`${currentTheme?.cardBg || 'bg-yellow-50'} rounded-lg p-4 border-l-4 border-yellow-500`}>
                <div className="flex items-start space-x-2">
                  <FiInfo className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className={`text-sm font-medium mb-1 ${currentTheme?.textColor || 'text-yellow-900'}`}>
                      신고 전 확인사항
                    </h5>
                    <ul className={`text-xs ${currentTheme?.textSecondary || 'text-yellow-700'} space-y-1`}>
                      <li>• 허위 신고는 제재 대상입니다</li>
                      <li>• 개인적인 의견 차이는 신고 사유가 아닙니다</li>
                      <li>• 명확한 규칙 위반 시에만 신고해주세요</li>
                      <li>• 처리 결과는 별도 안내되지 않습니다</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className={`flex-1 px-4 py-2 border rounded-lg font-medium transition-colors ${
                    currentTheme?.borderColor || 'border-gray-300'
                  } ${currentTheme?.textSecondary || 'text-gray-700'} ${currentTheme?.hoverBg || 'hover:bg-gray-50'}`}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!selectedReason || isSubmitting}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    !selectedReason || isSubmitting
                      ? `${currentTheme?.disabledBg || 'bg-gray-300'} ${currentTheme?.disabledText || 'text-gray-500'} cursor-not-allowed`
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>처리 중...</span>
                    </div>
                  ) : (
                    '신고하기'
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ReportModal; 