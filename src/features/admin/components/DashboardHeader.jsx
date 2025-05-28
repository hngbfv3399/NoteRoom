/**
 * 관리자 대시보드 헤더 컴포넌트
 * 대시보드 제목과 주요 액션 버튼들을 포함합니다.
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { 
  FiRefreshCw, 
  FiDownload, 
  FiSettings,
  FiUser,
  FiShield
} from 'react-icons/fi';

function DashboardHeader({ systemStatus }) {
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // 현재 시간
  const currentTime = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // 시스템 상태에 따른 표시 텍스트와 색상
  const getStatusDisplay = () => {
    switch (systemStatus?.status) {
      case 'normal':
        return { text: '시스템 정상', color: 'bg-green-500' };
      case 'warning':
        return { text: '시스템 주의', color: 'bg-yellow-500' };
      case 'error':
        return { text: '시스템 오류', color: 'bg-red-500' };
      case 'loading':
        return { text: '상태 확인 중', color: 'bg-gray-500' };
      default:
        return { text: '상태 알 수 없음', color: 'bg-gray-500' };
    }
  };

  const statusDisplay = getStatusDisplay();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = () => {
    // 데이터 내보내기 기능 (향후 구현)
    alert('데이터 내보내기 기능은 준비 중입니다.');
  };

  const handleSettings = () => {
    // 설정 페이지로 이동 (향후 구현)
    alert('설정 페이지는 준비 중입니다.');
  };

  return (
    <div className={`p-6 rounded-xl border shadow-sm mb-8 ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        {/* 제목 및 정보 */}
        <div className="mb-4 lg:mb-0">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiShield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                관리자 대시보드
              </h1>
              <p className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                시스템 관리 및 모니터링
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${statusDisplay.color}`}></div>
              <span className={`${currentTheme?.textColor || 'text-gray-600'}`}>
                {statusDisplay.text}
              </span>
            </div>
            <div className={`${currentTheme?.textColor || 'text-gray-600'}`}>
              마지막 업데이트: {currentTime}
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${currentTheme?.inputBg || 'bg-gray-100'} ${currentTheme?.textColor || 'text-gray-700'} hover:bg-gray-200`}
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>새로고침</span>
          </button>

          <button
            onClick={handleExport}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${currentTheme?.inputBg || 'bg-gray-100'} ${currentTheme?.textColor || 'text-gray-700'} hover:bg-gray-200`}
          >
            <FiDownload className="w-4 h-4" />
            <span>내보내기</span>
          </button>

          <button
            onClick={handleSettings}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            <FiSettings className="w-4 h-4" />
            <span>설정</span>
          </button>
        </div>
      </div>

      {/* 빠른 통계 - 실제 데이터 사용 */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold text-blue-600`}>
              {systemStatus?.uptime ? `${systemStatus.uptime}%` : '측정 중...'}
            </div>
            <div className={`text-xs ${currentTheme?.textColor || 'text-gray-600'}`}>
              가동률
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold text-green-600`}>
              {systemStatus?.activeUsers !== undefined ? systemStatus.activeUsers.toLocaleString() : '측정 중...'}
            </div>
            <div className={`text-xs ${currentTheme?.textColor || 'text-gray-600'}`}>
              활성 사용자
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold text-purple-600`}>
              {systemStatus?.avgResponseTime ? `${systemStatus.avgResponseTime}ms` : '측정 중...'}
            </div>
            <div className={`text-xs ${currentTheme?.textColor || 'text-gray-600'}`}>
              평균 응답시간
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold text-orange-600`}>
              {systemStatus?.errorRate !== undefined ? `${systemStatus.errorRate}%` : '측정 중...'}
            </div>
            <div className={`text-xs ${currentTheme?.textColor || 'text-gray-600'}`}>
              에러율
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHeader; 