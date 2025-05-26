/**
 * 로딩 상태를 표시하는 컴포넌트
 * 
 * 기능:
 * - 스켈레톤 카드를 이용한 로딩 UI
 * - 다양한 로딩 타입 지원
 * 
 * TODO: 로딩 애니메이션 개선, 로딩 메시지 커스터마이징
 */
import SkeletonCard from '@/components/SkeletonCard';

const LoadingState = ({ 
  type = 'skeleton', 
  count = 6, 
  message = '노트를 불러오는 중...' 
}) => {
  if (type === 'skeleton') {
    return (
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: count }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      </div>
    );
  }

  // 스피너 타입 로딩
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-500">{message}</p>
    </div>
  );
};

export default LoadingState; 