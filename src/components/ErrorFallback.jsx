import React from 'react';
import { useSelector } from 'react-redux';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

function ErrorFallback({ error, resetErrorBoundary }) {
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${currentTheme?.bgColor || 'bg-gray-50'}`}>
      <div className={`max-w-md w-full p-8 rounded-xl border shadow-lg text-center ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
        {/* 에러 아이콘 */}
        <div className="mb-6">
          <FiAlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
        </div>

        {/* 에러 제목 */}
        <h1 className={`text-2xl font-bold mb-4 ${currentTheme?.textColor || 'text-gray-900'}`}>
          문제가 발생했습니다
        </h1>

        {/* 에러 설명 */}
        <p className={`text-sm mb-6 ${currentTheme?.textColor || 'text-gray-600'}`}>
          예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>

        {/* 에러 상세 메시지 (개발 환경에서만 표시) */}
        {import.meta.env.DEV && error?.message && (
          <div className={`mb-6 p-4 rounded-lg text-left ${currentTheme?.inputBg || 'bg-gray-100'}`}>
            <h3 className={`text-sm font-semibold mb-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
              오류 상세:
            </h3>
            <pre className={`text-xs overflow-auto max-h-32 ${currentTheme?.textColor || 'text-gray-600'}`}>
              {error.message}
            </pre>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* 재시도 버튼 */}
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <FiRefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </button>
          )}

          {/* 홈으로 가기 버튼 */}
          <button
            onClick={handleGoHome}
            className={`flex items-center justify-center px-4 py-2 rounded-lg border transition-colors duration-200 ${currentTheme?.inputBg || 'bg-gray-100'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-700'} hover:bg-gray-200`}
          >
            <FiHome className="w-4 h-4 mr-2" />
            홈으로 가기
          </button>
        </div>

        {/* 추가 도움말 */}
        <div className={`mt-6 pt-6 border-t text-xs ${currentTheme?.inputBorder || 'border-gray-200'} ${currentTheme?.textColor || 'text-gray-500'}`}>
          <p>문제가 지속되면 관리자에게 문의해주세요.</p>
        </div>
      </div>
    </div>
  );
}

export default ErrorFallback;
