import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

function SignUpForm({ onSuccess }) {
  const [userData, setUserData] = useState({
    displayName: '',
    birthDate: '',
    favorites: '',
    favoriteQuote: '',
    hobbies: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoogleSignUp = async () => {
    // 필수 필드 검사
    if (!userData.displayName.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }
    if (!userData.birthDate) {
      alert('생년월일을 입력해주세요.');
      return;
    }
    if (!userData.favorites.trim()) {
      alert('좋아하는 것을 입력해주세요.');
      return;
    }
    if (!userData.favoriteQuote.trim()) {
      alert('좋아하는 명언을 입력해주세요.');
      return;
    }
    if (!userData.hobbies.trim()) {
      alert('취미를 입력해주세요.');
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, 'users', user.uid), {
        displayName: userData.displayName.trim(),
        birthDate: userData.birthDate,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date(),
        updatedAt: new Date(),
        noteCount: 0,
        emotionalTemperature: 36.5,
        favorites: userData.favorites.trim(),
        favoriteQuote: userData.favoriteQuote.trim(),
        hobbies: userData.hobbies.trim(),
        
        // 감정 분포 데이터
        emotionDistribution: {
          joy: 0,        // 기쁨
          sadness: 0,    // 슬픔
          anger: 0,      // 화남
          excited: 0,    // 신남
          calm: 0,       // 평온
          stressed: 0,   // 스트레스
          grateful: 0,   // 감사
          anxious: 0,    // 불안
          confident: 0,  // 자신감
          lonely: 0,     // 외로움
          hopeful: 0,    // 희망적
          tired: 0,      // 피곤함
        },
        
        // 감정 추적 시스템
        emotionTracking: {
          dailyEmotions: [], // 일일 감정 기록 배열
          monthlyStats: {}, // 월간 통계
          settings: {
            reminderTime: "21:00", // 기본 알림 시간
            reminderEnabled: true,
            lastReminder: null,
            monthlyResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0]
          }
        },
      });

      onSuccess();
    } catch (error) {
      console.error('회원가입 실패:', error);
      alert('회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">회원가입</h2>
        <p className="mt-2 text-sm text-gray-600">
          기본 정보를 입력하고 Google 계정으로 가입하세요
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            닉네임
          </label>
          <input
            type="text"
            name="displayName"
            value={userData.displayName}
            onChange={handleInputChange}
            placeholder="사용하실 닉네임을 입력해주세요"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            생년월일
          </label>
          <input
            type="date"
            name="birthDate"
            value={userData.birthDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            좋아하는 것
          </label>
          <input
            type="text"
            name="favorites"
            value={userData.favorites}
            onChange={handleInputChange}
            placeholder="좋아하는 것을 입력해주세요"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            좋아하는 명언
          </label>
          <input
            type="text"
            name="favoriteQuote"
            value={userData.favoriteQuote}
            onChange={handleInputChange}
            placeholder="좋아하는 명언을 입력해주세요"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            취미
          </label>
          <input
            type="text"
            name="hobbies"
            value={userData.hobbies}
            onChange={handleInputChange}
            placeholder="취미를 입력해주세요"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        onClick={handleGoogleSignUp}
        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <img
          src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
          alt="Google"
          className="w-6 h-6"
        />
        Google로 가입하기
      </button>
    </div>
  );
}

export default SignUpForm; 