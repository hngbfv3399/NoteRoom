/**
 * 내 신고 내역 페이지
 * 사용자가 신고한 콘텐츠들의 처리 상태를 확인할 수 있습니다.
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  FiAlertTriangle, 
  FiClock, 
  FiCheck, 
  FiX,
  FiFileText,
  FiMessageCircle,
  FiRefreshCw,
  FiArrowLeft,
  FiEye,
  FiTrash2
} from 'react-icons/fi';
import { getUserReports, cancelReport } from '@/utils/reportUtils';
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS, REPORT_TYPES } from '@/constants/adminConstants';
import { ROUTES } from '@/constants/routes';
import { selectCurrentTheme, selectUser } from '@/store/selectors';

function MyReportsPage() {
  const navigate = useNavigate();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  // 메모이제이션된 selector 사용
  const currentTheme = useSelector(selectCurrentTheme);
  const user = useSelector(selectUser);

  // 신고 내역 로드
  const loadReports = async () => {
    if (!user?.uid) {
      console.log('❌ [MyReports] 사용자 정보 없음:', user);
      return;
    }
    
    console.log('📊 [MyReports] 신고 내역 로드 시작:', user.uid);
    setLoading(true);
    try {
      const userReports = await getUserReports(user.uid);
      console.log('✅ [MyReports] 신고 내역 로드 완료:', userReports.length);
      setReports(userReports);
    } catch (error) {
      console.error('❌ [MyReports] 신고 내역 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 신고 취소
  const handleCancelReport = async (reportId) => {
    if (!confirm('정말로 이 신고를 취소하시겠습니까?')) {
      return;
    }

    setCancelling(reportId);
    try {
      const result = await cancelReport(reportId, user.uid);
      
      if (result.success) {
        alert(result.message);
        loadReports(); // 목록 새로고침
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('신고 취소 실패:', error);
      alert('신고 취소 중 오류가 발생했습니다.');
    } finally {
      setCancelling(null);
    }
  };

  // 상태별 아이콘
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="text-yellow-500" />;
      case 'approved':
        return <FiCheck className="text-green-500" />;
      case 'rejected':
        return <FiX className="text-red-500" />;
      default:
        return <FiAlertTriangle className="text-gray-500" />;
    }
  };

  // 콘텐츠 타입별 아이콘
  const getContentTypeIcon = (contentType) => {
    switch (contentType) {
      case REPORT_TYPES.NOTE:
        return <FiFileText className="text-blue-500" />;
      case REPORT_TYPES.COMMENT:
        return <FiMessageCircle className="text-green-500" />;
      default:
        return <FiAlertTriangle className="text-gray-500" />;
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    console.log('🔄 [MyReports] useEffect 실행:', { user: !!user, uid: user?.uid });
    if (user?.uid) {
      loadReports();
    }
  }, [user?.uid]); // user.uid가 변경될 때만 실행

  // 로그인 상태 확인 개선
  if (!user?.uid) {
    console.log('🚫 [MyReports] 로그인 필요 - 사용자 상태:', user);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiAlertTriangle className="mx-auto text-4xl text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500">신고 내역을 확인하려면 로그인해주세요.</p>
          <button
            onClick={() => navigate('/auth/login')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme?.bgColor || 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                내 신고 내역
              </h1>
              <p className={`mt-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
                신고한 콘텐츠들의 처리 상태를 확인할 수 있습니다.
              </p>
            </div>
            <button
              onClick={loadReports}
              disabled={loading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                currentTheme?.inputBorder || 'border-gray-300'
              } ${currentTheme?.textColor || 'text-gray-700'} hover:bg-gray-50`}
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              <span>새로고침</span>
            </button>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <FiRefreshCw className="animate-spin text-xl text-blue-500" />
              <span className={currentTheme?.textColor || 'text-gray-600'}>
                신고 내역을 불러오는 중...
              </span>
            </div>
          </div>
        ) : reports.length === 0 ? (
          // 빈 상태
          <div className="text-center py-12">
            <FiAlertTriangle className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className={`text-xl font-semibold ${currentTheme?.textColor || 'text-gray-600'} mb-2`}>
              신고 내역이 없습니다
            </h3>
            <p className={currentTheme?.textColor || 'text-gray-500'}>
              아직 신고한 콘텐츠가 없습니다.
            </p>
          </div>
        ) : (
          // 신고 목록
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 헤더 */}
                    <div className="flex items-center space-x-3 mb-3">
                      {getContentTypeIcon(report.contentType)}
                      <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-600'}`}>
                        {report.contentType === REPORT_TYPES.NOTE ? '노트' : '댓글'} 신고
                      </span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(report.status)}
                        <span className={`text-sm font-medium ${
                          report.status === 'pending' ? 'text-yellow-600' :
                          report.status === 'approved' ? 'text-green-600' :
                          'text-red-600'
                        }`}>
                          {REPORT_STATUS_LABELS[report.status]}
                        </span>
                      </div>
                    </div>

                    {/* 콘텐츠 정보 */}
                    {report.contentData && (
                      <div className={`p-3 rounded-lg mb-3 ${currentTheme?.inputBgColor || 'bg-gray-50'}`}>
                        <p className={`text-sm ${currentTheme?.textColor || 'text-gray-700'}`}>
                          <strong>신고된 콘텐츠:</strong> {
                            report.contentData.title || 
                            report.contentData.content || 
                            '콘텐츠 정보 없음'
                          }
                        </p>
                        {report.contentData.author && (
                          <p className={`text-xs mt-1 ${currentTheme?.textColor || 'text-gray-500'}`}>
                            작성자: {report.contentData.author}
                          </p>
                        )}
                      </div>
                    )}

                    {/* 신고 정보 */}
                    <div className="space-y-2">
                      <p className={`text-sm ${currentTheme?.textColor || 'text-gray-700'}`}>
                        <strong>신고 사유:</strong> {REPORT_REASON_LABELS[report.reason]}
                      </p>
                      {report.description && (
                        <p className={`text-sm ${currentTheme?.textColor || 'text-gray-700'}`}>
                          <strong>상세 설명:</strong> {report.description}
                        </p>
                      )}
                      <p className={`text-xs ${currentTheme?.textColor || 'text-gray-500'}`}>
                        신고일: {report.createdAt.toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {report.processedAt && (
                        <p className={`text-xs ${currentTheme?.textColor || 'text-gray-500'}`}>
                          처리일: {report.processedAt.toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                      {report.adminNote && (
                        <div className={`p-3 rounded-lg mt-3 ${currentTheme?.inputBgColor || 'bg-blue-50'}`}>
                          <p className={`text-sm ${currentTheme?.textColor || 'text-blue-800'}`}>
                            <strong>관리자 메모:</strong> {report.adminNote}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  {report.status === 'pending' && (
                    <button
                      onClick={() => handleCancelReport(report.id)}
                      disabled={cancelling === report.id}
                      className="ml-4 px-3 py-1 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {cancelling === report.id ? '취소 중...' : '신고 취소'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyReportsPage; 