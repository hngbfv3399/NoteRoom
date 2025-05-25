import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';

function LoginPage() {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' or 'signup'
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        {/* 탭 버튼 */}
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

        {/* 폼 컴포넌트 */}
        <div className="mt-8">
          {activeTab === 'signin' ? (
            <SignInForm onSuccess={() => navigate('/')} />
          ) : (
            <SignUpForm onSuccess={() => navigate('/')} />
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage; 