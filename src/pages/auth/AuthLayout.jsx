/**
 * 인증 페이지 레이아웃 컴포넌트
 * 
 * 주요 기능:
 * - 로그인/회원가입 페이지의 공통 레이아웃 제공
 * - 중앙 정렬된 카드 형태의 UI
 * - NoteRoom 브랜드 로고 표시
 * 
 * NOTE: React Router의 Outlet을 사용하여 하위 라우트 렌더링
 * TODO: 브랜드 로고 이미지 추가, 배경 패턴 또는 이미지 적용
 */
import React from 'react';
import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 브랜드 로고/제목 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            NoteRoom
          </h1>
          <p className="text-gray-600 text-sm">
            당신의 생각을 기록하고 공유하세요
          </p>
        </div>
        
        {/* 하위 라우트 컴포넌트 렌더링 */}
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout; 