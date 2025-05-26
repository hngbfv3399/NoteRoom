/**
 * 로그인/회원가입 통합 페이지 컴포넌트
 * 
 * 주요 기능:
 * - 로그인과 회원가입 탭 전환
 * - 각 탭에 해당하는 폼 컴포넌트 렌더링
 * - 인증 성공 시 메인 페이지로 리다이렉트
 * 
 * NOTE: 비로그인 상태에서만 접근 가능한 페이지
 * TODO: 소셜 로그인 기능 추가 고려
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';

function LoginPage() {
  // 현재 활성화된 탭 상태 ('signin' | 'signup')
  const [activeTab, setActiveTab] = useState('signin');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        {/* 로그인/회원가입 탭 버튼 */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-2 text-center ${
              activeTab === 'signin'
                ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('signin')}
          >
            로그인
          </button>
          <button
            className={`flex-1 py-2 text-center ${
              activeTab === 'signup'
                ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('signup')}
          >
            회원가입
          </button>
        </div>

        {/* 선택된 탭에 따른 폼 컴포넌트 렌더링 */}
        <div className="mt-8">
          {activeTab === 'signin' ? (
            // 로그인 폼 - 성공 시 메인 페이지로 이동
            <SignInForm onSuccess={() => navigate('/')} />
          ) : (
            // 회원가입 폼 - 성공 시 메인 페이지로 이동
            <SignUpForm onSuccess={() => navigate('/')} />
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage; 