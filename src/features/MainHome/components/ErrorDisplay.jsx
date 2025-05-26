/**
 * 에러 상태를 표시하는 컴포넌트
 * 
 * 기능:
 * - 에러 메시지를 사용자 친화적으로 표시
 * - 에러 타입에 따른 다른 메시지 제공
 * 
 * TODO: 에러 타입별 아이콘 추가, 재시도 버튼 추가
 */
import PropTypes from 'prop-types';

const ErrorDisplay = ({ error, onRetry }) => (
  <div className="text-center p-8">
    <div className="text-red-500 mb-4">
      <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <h3 className="text-lg font-semibold mb-2">문제가 발생했습니다</h3>
      <p className="text-sm text-gray-600">
        {error?.message || "알 수 없는 오류가 발생했습니다"}
      </p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        다시 시도
      </button>
    )}
  </div>
);

ErrorDisplay.propTypes = {
  error: PropTypes.object,
  onRetry: PropTypes.func,
};

export default ErrorDisplay; 