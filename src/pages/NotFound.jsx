/**
 * 404 에러 페이지 컴포넌트
 * 
 * 주요 기능:
 * - 존재하지 않는 페이지 접근 시 표시
 * - 홈으로 돌아가기 버튼 제공
 * 
 * TODO: 애니메이션 효과, 추천 페이지 링크 추가
 */
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-gray-500 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

export default NotFound;