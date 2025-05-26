/**
 * 콘텐츠 관리 컴포넌트
 * 신고된 콘텐츠 검토 및 처리 기능을 제공합니다.
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiFileText, 
  FiAlertTriangle, 
  FiCheck, 
  FiX,
  FiEye,
  FiClock,
  FiUser
} from 'react-icons/fi';
import { getReportedContent, processReport } from '@/utils/adminUtils';
import { 
  REPORT_TYPES, 
  REPORT_REASONS, 
  ADMIN_ACTIONS 
} from '@/constants/adminConstants';

function ContentManagement() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const reportData = await getReportedContent();
      setReports(reportData || []);
    } catch (error) {
      console.error('신고 데이터 로드 실패:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReport = async (reportId, action, adminNote = '') => {
    try {
      setProcessing(true);
      await processReport(reportId, action, adminNote);
      await loadReports(); // 데이터 새로고침
      setShowModal(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('신고 처리 실패:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getReportTypeText = (type) => {
    switch (type) {
      case REPORT_TYPES.NOTE:
        return '노트';
      case REPORT_TYPES.COMMENT:
        return '댓글';
      default:
        return type;
    }
  };

  const getReasonText = (reason) => {
    switch (reason) {
      case REPORT_REASONS.SPAM:
        return '스팸';
      case REPORT_REASONS.INAPPROPRIATE:
        return '부적절한 콘텐츠';
      case REPORT_REASONS.HARASSMENT:
        return '괴롭힘';
      case REPORT_REASONS.COPYRIGHT:
        return '저작권 침해';
      default:
        return reason || '기타';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={`text-lg ${currentTheme?.textColor || 'text-gray-600'}`}>
            신고 데이터를 로드하는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 신고 목록 */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className={`text-lg font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
              처리할 신고가 없습니다
            </p>
            <p className={`text-sm mt-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
              모든 신고가 처리되었습니다.
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <FiAlertTriangle className="w-5 h-5 text-red-500" />
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      report.contentType === 'note' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {getReportTypeText(report.contentType)}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                      {getReasonText(report.reason)}
                    </span>
                  </div>

                  <h3 className={`text-lg font-semibold mb-2 ${currentTheme?.textColor || 'text-gray-900'}`}>
                    {report.contentData?.title || '제목 없음'}
                  </h3>

                  <p className={`text-sm mb-4 ${currentTheme?.textColor || 'text-gray-600'} line-clamp-3`}>
                    {report.contentData?.content || report.contentData?.text || '내용 없음'}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <FiUser className="w-4 h-4" />
                      <span>신고자: {report.reporterName || '익명'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FiClock className="w-4 h-4" />
                      <span>{report.createdAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}</span>
                    </div>
                  </div>

                  {report.description && (
                    <div className={`mt-3 p-3 rounded-lg ${currentTheme?.inputBg || 'bg-gray-50'}`}>
                      <p className={`text-sm ${currentTheme?.textColor || 'text-gray-700'}`}>
                        <strong>신고 사유:</strong> {report.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setShowModal(true);
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90`}
                  >
                    <FiEye className="w-4 h-4" />
                    <span>검토</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 신고 검토 모달 */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`${currentTheme?.modalBgColor || 'bg-white'} rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex items-center space-x-3 mb-6">
              <FiAlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className={`text-lg font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
                신고 검토
              </h3>
            </div>

            {/* 신고 정보 */}
            <div className={`p-4 rounded-lg ${currentTheme?.inputBg || 'bg-gray-50'} mb-6`}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={`font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                    콘텐츠 유형:
                  </span>
                  <span className={`ml-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
                    {getReportTypeText(selectedReport.contentType)}
                  </span>
                </div>
                <div>
                  <span className={`font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                    신고 사유:
                  </span>
                  <span className={`ml-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
                    {getReasonText(selectedReport.reason)}
                  </span>
                </div>
                <div>
                  <span className={`font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                    신고자:
                  </span>
                  <span className={`ml-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
                    {selectedReport.reporterName || '익명'}
                  </span>
                </div>
                <div>
                  <span className={`font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                    신고일:
                  </span>
                  <span className={`ml-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
                    {selectedReport.createdAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}
                  </span>
                </div>
              </div>

              {selectedReport.description && (
                <div className="mt-4">
                  <span className={`font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                    상세 설명:
                  </span>
                  <p className={`mt-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
                    {selectedReport.description}
                  </p>
                </div>
              )}
            </div>

            {/* 신고된 콘텐츠 */}
            <div className={`p-4 rounded-lg border ${currentTheme?.inputBorder || 'border-gray-200'} mb-6`}>
              <h4 className={`font-medium mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                신고된 콘텐츠
              </h4>
              
              {selectedReport.contentData ? (
                <div>
                  {selectedReport.contentData.title && (
                    <h5 className={`font-medium mb-2 ${currentTheme?.textColor || 'text-gray-900'}`}>
                      {selectedReport.contentData.title}
                    </h5>
                  )}
                  <div className={`text-sm ${currentTheme?.textColor || 'text-gray-600'} whitespace-pre-wrap`}>
                    {selectedReport.contentData.content || selectedReport.contentData.text || '내용 없음'}
                  </div>
                </div>
              ) : (
                <p className={`text-sm ${currentTheme?.textColor || 'text-gray-500'}`}>
                  콘텐츠를 찾을 수 없습니다. (이미 삭제되었을 수 있습니다)
                </p>
              )}
            </div>

            {/* 처리 버튼 */}
            <div className="flex space-x-3">
              <button
                onClick={() => handleProcessReport(selectedReport.id, ADMIN_ACTIONS.APPROVED, '부적절한 콘텐츠로 판단되어 삭제됨')}
                disabled={processing}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <FiCheck className="w-4 h-4" />
                <span>{processing ? '처리 중...' : '신고 승인 (콘텐츠 삭제)'}</span>
              </button>

              <button
                onClick={() => handleProcessReport(selectedReport.id, ADMIN_ACTIONS.REJECTED, '부적절하지 않은 콘텐츠로 판단됨')}
                disabled={processing}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <FiX className="w-4 h-4" />
                <span>{processing ? '처리 중...' : '신고 거부 (콘텐츠 유지)'}</span>
              </button>

              <button
                onClick={() => setShowModal(false)}
                disabled={processing}
                className={`px-4 py-2 rounded-lg border ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-700'} hover:bg-gray-50 transition-colors disabled:opacity-50`}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentManagement; 