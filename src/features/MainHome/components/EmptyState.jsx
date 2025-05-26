/**
 * 빈 상태 표시 컴포넌트
 * 
 * 주요 기능:
 * - 노트가 없을 때 표시되는 빈 상태 UI
 * - 새 노트 작성 유도 버튼
 * - 친근한 메시지와 아이콘
 * - 테마 색깔 적용
 * 
 * TODO: 애니메이션 효과, 다양한 빈 상태 메시지 추가
 */
import React from 'react';
import { useSelector } from 'react-redux';
import ThemedButton from '@/components/ui/ThemedButton';
import { useNavigate } from 'react-router-dom';
import { getThemeClass } from '@/utils/themeHelper';
import { ROUTES } from '@/constants/routes';

const EmptyState = () => {
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* 아이콘 */}
      <div className="mb-6">
        <svg 
          className="w-24 h-24 mx-auto opacity-60" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: currentTheme?.primary || '#6B7280' }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
      </div>
      
      {/* 메시지 */}
      <h3 className="text-xl font-semibold mb-2" style={{ color: currentTheme?.text || '#374151' }}>
        아직 작성된 노트가 없습니다
      </h3>
      <p className="mb-8 max-w-md opacity-80" style={{ color: currentTheme?.text || '#6B7280' }}>
        첫 번째 노트를 작성해서 당신의 생각을 기록해보세요!
      </p>
      
      {/* 새 노트 작성 버튼 - 테마 버튼 사용 */}
      <ThemedButton
        onClick={() => navigate(ROUTES.WRITE)}
        className="inline-flex items-center px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105"
      >
        <svg 
          className="w-5 h-5 mr-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 4v16m8-8H4" 
          />
        </svg>
        새 노트 작성하기
      </ThemedButton>
      
      {/* 부가 설명 */}
      <p className="text-xs mt-6 opacity-60" style={{ color: currentTheme?.text || '#9CA3AF' }}>
        노트를 작성하면 다른 사용자들과 공유할 수 있습니다
      </p>
    </div>
  );
};

export default EmptyState; 