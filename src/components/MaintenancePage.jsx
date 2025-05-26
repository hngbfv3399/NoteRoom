/**
 * 서비스 점검 페이지 컴포넌트
 * 점검 모드 활성화 시 일반 사용자에게 표시되는 페이지
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FiTool, FiClock, FiRefreshCw } from 'react-icons/fi';
import { maintenanceMode } from '@/utils/adminUtils';

function MaintenancePage() {
  const [maintenanceInfo, setMaintenanceInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  useEffect(() => {
    loadMaintenanceInfo();
    
    // 30초마다 점검 상태 확인
    const interval = setInterval(checkMaintenanceStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadMaintenanceInfo = async () => {
    try {
      const info = await maintenanceMode.getMaintenanceInfo();
      setMaintenanceInfo(info);
    } catch (error) {
      console.error('점검 정보 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMaintenanceStatus = async () => {
    try {
      const isInMaintenance = await maintenanceMode.isMaintenanceMode();
      if (!isInMaintenance) {
        // 점검이 종료되면 페이지 새로고침
        window.location.reload();
      }
    } catch (error) {
      console.error('점검 상태 확인 실패:', error);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${currentTheme?.backgroundColor || 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={`text-lg ${currentTheme?.textColor || 'text-gray-600'}`}>
            로딩 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${currentTheme?.backgroundColor || 'bg-gray-50'}`}>
      <div className={`max-w-md w-full text-center p-8 rounded-2xl shadow-lg ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.borderColor || 'border border-gray-200'}`}>
        {/* 아이콘 */}
        <div className="mb-6">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${currentTheme?.buttonBg || 'bg-blue-100'}`}>
            <FiTool className={`w-10 h-10 ${currentTheme?.buttonText || 'text-blue-600'}`} />
          </div>
        </div>

        {/* 제목 */}
        <h1 className={`text-2xl font-bold mb-4 ${currentTheme?.textColor || 'text-gray-900'}`}>
          서비스 점검 중
        </h1>

        {/* 점검 메시지 */}
        <p className={`text-lg mb-6 leading-relaxed ${currentTheme?.textColor || 'text-gray-600'}`}>
          {maintenanceInfo?.message || '서비스 점검 중입니다. 잠시 후 다시 이용해주세요.'}
        </p>

        {/* 점검 시작 시간 */}
        {maintenanceInfo?.startTime && (
          <div className={`mb-4 p-3 rounded-lg ${currentTheme?.inputBg || 'bg-gray-50'} ${currentTheme?.borderColor || 'border border-gray-200'}`}>
            <div className="flex items-center justify-center space-x-2">
              <FiClock className={`w-4 h-4 ${currentTheme?.textColor || 'text-gray-500'}`} />
              <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                점검 시작: {maintenanceInfo.startTime.toDate().toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* 예상 종료 시간 */}
        {maintenanceInfo?.estimatedEndTime && (
          <div className={`mb-6 p-3 rounded-lg ${currentTheme?.inputBg || 'bg-blue-50'} ${currentTheme?.borderColor || 'border border-blue-200'}`}>
            <div className="flex items-center justify-center space-x-2">
              <FiClock className={`w-4 h-4 ${currentTheme?.textColor || 'text-blue-600'}`} />
              <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-blue-700'}`}>
                예상 종료: {maintenanceInfo.estimatedEndTime.toDate().toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* 새로고침 버튼 */}
        <button
          onClick={handleRefresh}
          className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-600'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90`}
        >
          <FiRefreshCw className="w-4 h-4" />
          <span>새로고침</span>
        </button>

        {/* 안내 메시지 */}
        <p className={`text-xs mt-4 opacity-70 ${currentTheme?.textColor || 'text-gray-500'}`}>
          점검이 완료되면 자동으로 서비스가 재개됩니다.
        </p>
      </div>
    </div>
  );
}

export default MaintenancePage; 