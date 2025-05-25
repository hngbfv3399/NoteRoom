import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

function SignInForm({ onSuccess }) {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 사용자 정보 확인
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        onSuccess();
      } else {
        alert('회원가입이 필요합니다. 회원가입 페이지로 이동합니다.');
        await auth.signOut();  // 로그인 풀기
        window.location.href = '/signup';  // 회원가입 페이지로 이동
      }
      
    } catch (error) {
      console.error('구글 로그인 실패:', error);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">로그인</h2>
        <p className="mt-2 text-sm text-gray-600">
          NoteRoom에 오신 것을 환영합니다
        </p>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="flex items-center justify-center gap-2 w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <img
          src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
          alt="Google"
          className="w-6 h-6"
        />
        Google로 로그인
      </button>
    </div>
  );
}

export default SignInForm; 