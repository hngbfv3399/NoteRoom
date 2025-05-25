import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@/services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

function RegisterPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    displayName: '',
    birthDate: '',
  });

  useEffect(() => {
    const checkUserAndSetData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/auth/login');
        return;
      }

      // 이미 가입된 사용자인지 확인
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        // 이미 가입된 사용자는 메인 페이지로 리다이렉트
        navigate('/');
        return;
      }

      // 기본값 설정
      setUserData(prev => ({
        ...prev,
        displayName: user.displayName || '',
      }));
    };

    checkUserAndSetData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('로그인이 필요합니다.');
        navigate('/auth/login');
        return;
      }

      if (!userData.displayName.trim()) {
        alert('닉네임을 입력해주세요.');
        return;
      }
      if (!userData.birthDate) {
        alert('생년월일을 입력해주세요.');
        return;
      }

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
        favorites: '',
        favoriteQuote: '',
        hobbies: '',
      });

      // 메인 페이지로 이동
      navigate('/');
    } catch (error) {
      console.error('회원가입 실패:', error);
      alert('회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">회원가입</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          가입 완료
        </button>
      </form>
    </div>
  );
}

export default RegisterPage; 