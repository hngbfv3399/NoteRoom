/**
 * 콘텐츠 관리 컴포넌트
 * 신고된 콘텐츠 검토 및 처리 기능을 제공합니다.
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiFileText, 
  FiAlertTriangle, 
  FiCheck, 
  FiX,
  FiEye,
  FiClock,
  FiUser,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiZap,
  FiTrendingUp,
  FiBarChart2,
  FiShield,
  FiTarget
} from 'react-icons/fi';
import { 
  getReportedContent, 
  processReport, 
  getReportAnalytics,
  autoProcessReport,
  calculateReportPriority
} from '@/utils/adminUtils';
import { 
  REPORT_TYPES, 
  REPORT_REASONS, 
  ADMIN_ACTIONS,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS
} from '@/constants/adminConstants';

function ContentManagement() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // 필터 상태
  const [filters, setFilters] = useState({
    status: 'all',
    reason: 'all',
    priority: 'all',
    contentType: 'all',
    dateRange: '7'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('priority'); // priority, date, status

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  useEffect(() => {
    loadReports();
    loadAnalytics();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, filters, searchTerm, sortBy]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const reportData = await getReportedContent();
      
      // 우선순위 계산 추가
      const reportsWithPriority = reportData.map(report => ({
        ...report,
        priority: calculateReportPriority(report),
        isUrgent: calculateReportPriority(report) >= 7
      }));
      
      setReports(reportsWithPriority || []);
    } catch (error) {
      console.error('신고 데이터 로드 실패:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await getReportAnalytics(30);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('신고 분석 데이터 로드 실패:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    // 상태 필터
    if (filters.status !== 'all') {
      filtered = filtered.filter(report => report.status === filters.status);
    }

    // 사유 필터
    if (filters.reason !== 'all') {
      filtered = filtered.filter(report => report.reason === filters.reason);
    }

    // 우선순위 필터
    if (filters.priority !== 'all') {
      if (filters.priority === 'high') {
        filtered = filtered.filter(report => report.priority >= 7);
      } else if (filters.priority === 'medium') {
        filtered = filtered.filter(report => report.priority >= 4 && report.priority < 7);
      } else if (filters.priority === 'low') {
        filtered = filtered.filter(report => report.priority < 4);
      }
    }

    // 콘텐츠 타입 필터
    if (filters.contentType !== 'all') {
      filtered = filtered.filter(report => report.contentType === filters.contentType);
    }

    // 날짜 범위 필터
    if (filters.dateRange !== 'all') {
      const days = parseInt(filters.dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filtered = filtered.filter(report => {
        const reportDate = report.createdAt?.toDate ? report.createdAt.toDate() : new Date(report.createdAt);
        return reportDate >= cutoffDate;
      });
    }

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.contentData?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporterName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          if (a.priority !== b.priority) return b.priority - a.priority;
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredReports(filtered);
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
      alert('신고 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleAutoProcess = async (reportId) => {
    try {
      setProcessing(true);
      const result = await autoProcessReport(reportId);
      
      if (result.processed) {
        alert(`자동 처리 완료: ${result.action} - ${result.reason}`);
        await loadReports();
      } else {
        alert('자동 처리 조건에 맞지 않습니다. 수동 검토가 필요합니다.');
      }
    } catch (error) {
      console.error('자동 처리 실패:', error);
      alert('자동 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const getPriorityColor = (priority) => {
    if (priority >= 7) return 'text-red-600 bg-red-100';
    if (priority >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getPriorityText = (priority) => {
    if (priority >= 7) return '높음';
    if (priority >= 4) return '보통';
    return '낮음';
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
    return REPORT_REASON_LABELS[reason] || reason;
  };

  const getStatusText = (status) => {
    return REPORT_STATUS_LABELS[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={`${currentTheme?.textColor || 'text-gray-600'}`}>신고 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 및 통계 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
            콘텐츠 관리
          </h2>
          <p className={`mt-1 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
            신고된 콘텐츠를 검토하고 처리합니다
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90 transition-opacity`}
          >
            <FiBarChart2 className="w-4 h-4" />
            <span>분석</span>
          </button>
          
          <button
            onClick={loadReports}
            className={`p-2 rounded-lg ${currentTheme?.hoverBg || 'hover:bg-gray-100'} transition-colors`}
            title="새로고침"
          >
            <FiRefreshCw className={`w-5 h-5 ${currentTheme?.textColor || 'text-gray-600'}`} />
          </button>
        </div>
      </div>

      {/* 분석 패널 */}
      <AnimatePresence>
        {showAnalytics && analytics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${currentTheme?.textColor || 'text-gray-900'}`}>
              신고 분석 (최근 30일)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${currentTheme?.inputBg || 'bg-gray-50'}`}>
                <div className="flex items-center space-x-2">
                  <FiAlertTriangle className="w-5 h-5 text-orange-500" />
                  <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                    총 신고
                  </span>
                </div>
                <p className={`text-2xl font-bold mt-1 ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {analytics.totalReports}
                </p>
              </div>
              
              <div className={`p-4 rounded-lg ${currentTheme?.inputBg || 'bg-gray-50'}`}>
                <div className="flex items-center space-x-2">
                  <FiClock className="w-5 h-5 text-blue-500" />
                  <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                    평균 처리 시간
                  </span>
                </div>
                <p className={`text-2xl font-bold mt-1 ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {analytics.avgProcessingTimeHours}h
                </p>
              </div>
              
              <div className={`p-4 rounded-lg ${currentTheme?.inputBg || 'bg-gray-50'}`}>
                <div className="flex items-center space-x-2">
                  <FiTrendingUp className="w-5 h-5 text-green-500" />
                  <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                    주요 사유
                  </span>
                </div>
                <p className={`text-lg font-bold mt-1 ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {getReasonText(analytics.trends.mostCommonReason)}
                </p>
              </div>
              
              <div className={`p-4 rounded-lg ${currentTheme?.inputBg || 'bg-gray-50'}`}>
                <div className="flex items-center space-x-2">
                  <FiTarget className="w-5 h-5 text-purple-500" />
                  <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                    대기 중
                  </span>
                </div>
                <p className={`text-2xl font-bold mt-1 ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {analytics.statusStats.pending || 0}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 필터 및 검색 */}
      <div className={`p-4 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* 검색 */}
          <div className="md:col-span-2">
            <div className="relative">
              <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${currentTheme?.textSecondary || 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="신고 내용 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>

          {/* 상태 필터 */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className={`px-3 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">모든 상태</option>
            <option value="pending">대기 중</option>
            <option value="approved">승인됨</option>
            <option value="rejected">거부됨</option>
          </select>

          {/* 우선순위 필터 */}
          <select
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
            className={`px-3 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">모든 우선순위</option>
            <option value="high">높음</option>
            <option value="medium">보통</option>
            <option value="low">낮음</option>
          </select>

          {/* 사유 필터 */}
          <select
            value={filters.reason}
            onChange={(e) => setFilters({...filters, reason: e.target.value})}
            className={`px-3 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">모든 사유</option>
            {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* 정렬 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="priority">우선순위순</option>
            <option value="date">최신순</option>
            <option value="status">상태순</option>
          </select>
        </div>
      </div>

      {/* 신고 목록 */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className={`text-lg font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
              {reports.length === 0 ? '처리할 신고가 없습니다' : '필터 조건에 맞는 신고가 없습니다'}
            </p>
            <p className={`text-sm mt-2 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
              {reports.length === 0 ? '모든 신고가 처리되었습니다.' : '다른 필터 조건을 시도해보세요.'}
            </p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'} hover:shadow-md transition-shadow ${
                report.isUrgent ? 'border-l-4 border-l-red-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {/* 우선순위 배지 */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                      {getPriorityText(report.priority)} ({report.priority})
                    </span>
                    
                    {/* 콘텐츠 타입 */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentTheme?.inputBg || 'bg-gray-100'} ${currentTheme?.textColor || 'text-gray-700'}`}>
                      {getReportTypeText(report.contentType)}
                    </span>
                    
                    {/* 상태 */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      report.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getStatusText(report.status)}
                    </span>

                    {/* 긴급 표시 */}
                    {report.isUrgent && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                        긴급
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className={`font-medium mb-2 ${currentTheme?.textColor || 'text-gray-900'}`}>
                        신고 정보
                      </h4>
                      <p className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                        <strong>사유:</strong> {getReasonText(report.reason)}
                      </p>
                      {report.description && (
                        <p className={`text-sm mt-1 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                          <strong>설명:</strong> {report.description}
                        </p>
                      )}
                      <p className={`text-sm mt-1 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                        <strong>신고자:</strong> {report.reporterName || '익명'}
                      </p>
                      <p className={`text-sm mt-1 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                        <strong>신고일:</strong> {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>

                    <div>
                      <h4 className={`font-medium mb-2 ${currentTheme?.textColor || 'text-gray-900'}`}>
                        콘텐츠 정보
                      </h4>
                      {report.contentData && (
                        <div className={`p-3 rounded-lg ${currentTheme?.inputBg || 'bg-gray-50'}`}>
                          {report.contentData.title && (
                            <p className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                              {report.contentData.title}
                            </p>
                          )}
                          {report.contentData.content && (
                            <p className={`text-sm mt-1 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                              {report.contentData.content.substring(0, 100)}...
                            </p>
                          )}
                          {report.contentData.author && (
                            <p className={`text-xs mt-2 ${currentTheme?.textSecondary || 'text-gray-500'}`}>
                              작성자: {report.contentData.author}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAutoProcess(report.id)}
                        disabled={processing}
                        className="flex items-center space-x-1 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                        title="자동 처리"
                      >
                        <FiZap className="w-4 h-4" />
                        <span>자동</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowModal(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <FiEye className="w-4 h-4" />
                        <span>검토</span>
                      </button>
                    </>
                  )}
                  
                  {report.status !== 'pending' && (
                    <span className={`text-xs px-2 py-1 rounded ${currentTheme?.inputBg || 'bg-gray-100'} ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                      처리 완료
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 신고 검토 모달 */}
      <AnimatePresence>
        {showModal && selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${currentTheme?.modalBgColor || 'bg-white'} rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <FiAlertTriangle className="w-6 h-6 text-red-500" />
                  <h3 className={`text-lg font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
                    신고 검토
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedReport.priority)}`}>
                    우선순위: {getPriorityText(selectedReport.priority)}
                  </span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className={`p-2 rounded-lg ${currentTheme?.hoverBg || 'hover:bg-gray-100'} transition-colors`}
                >
                  <FiX className={`w-5 h-5 ${currentTheme?.textColor || 'text-gray-600'}`} />
                </button>
              </div>

              {/* 신고 상세 정보 */}
              <div className={`p-4 rounded-lg ${currentTheme?.inputBg || 'bg-gray-50'} mb-6`}>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                      콘텐츠 유형:
                    </span>
                    <span className={`ml-2 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                      {getReportTypeText(selectedReport.contentType)}
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                      신고 사유:
                    </span>
                    <span className={`ml-2 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                      {getReasonText(selectedReport.reason)}
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                      신고자:
                    </span>
                    <span className={`ml-2 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                      {selectedReport.reporterName || '익명'}
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                      신고일:
                    </span>
                    <span className={`ml-2 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                      {new Date(selectedReport.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                </div>
                
                {selectedReport.description && (
                  <div className="mt-4">
                    <span className={`font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                      상세 설명:
                    </span>
                    <p className={`mt-1 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                      {selectedReport.description}
                    </p>
                  </div>
                )}
              </div>

              {/* 콘텐츠 미리보기 */}
              {selectedReport.contentData && (
                <div className={`p-4 rounded-lg border ${currentTheme?.inputBorder || 'border-gray-200'} mb-6`}>
                  <h4 className={`font-medium mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                    신고된 콘텐츠
                  </h4>
                  {selectedReport.contentData.title && (
                    <h5 className={`font-medium mb-2 ${currentTheme?.textColor || 'text-gray-900'}`}>
                      {selectedReport.contentData.title}
                    </h5>
                  )}
                  {selectedReport.contentData.content && (
                    <p className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'} mb-2`}>
                      {selectedReport.contentData.content}
                    </p>
                  )}
                  {selectedReport.contentData.author && (
                    <p className={`text-xs ${currentTheme?.textSecondary || 'text-gray-500'}`}>
                      작성자: {selectedReport.contentData.author}
                    </p>
                  )}
                </div>
              )}

              {/* 관리자 메모 */}
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
                  관리자 메모
                </label>
                <textarea
                  id="adminNote"
                  rows={3}
                  placeholder="처리 사유나 추가 설명을 입력하세요..."
                  className={`w-full px-4 py-3 rounded-xl border resize-none ${currentTheme?.inputBg || 'bg-gray-50'} ${currentTheme?.inputBorder || 'border-gray-200'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              {/* 액션 버튼 */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg border ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-700'} hover:bg-gray-50 transition-colors`}
                >
                  취소
                </button>
                
                <button
                  onClick={() => {
                    const adminNote = document.getElementById('adminNote').value;
                    handleProcessReport(selectedReport.id, 'rejected', adminNote);
                  }}
                  disabled={processing}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <FiX className="w-4 h-4" />
                  <span>신고 거부</span>
                </button>
                
                <button
                  onClick={() => {
                    const adminNote = document.getElementById('adminNote').value;
                    handleProcessReport(selectedReport.id, 'approved', adminNote);
                  }}
                  disabled={processing}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <FiCheck className="w-4 h-4" />
                  <span>신고 승인</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ContentManagement; 