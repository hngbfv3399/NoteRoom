// TODO: LoginComponents 컴포넌트는 구글 로그인 처리와 사용자 프로필 정보 입력 기능을 담당함
// TODO: showModal 상태로 프로필 입력 모달 표시 여부 관리
// TODO: userData 상태로 사용자 프로필 정보를 관리 (닉네임, 생년월일 등)
// TODO: isUserDataComplete 함수로 사용자 데이터가 완전한지 체크 (닉네임, 생년월일, 감정온도, 노트 개수 포함)
// TODO: handleGoogleLogin 함수에서 Firebase Google 로그인 처리
// TODO: 로그인 후 Firestore에서 사용자 문서 조회
// TODO: 사용자 문서가 없거나 불완전할 경우 프로필 입력 모달 표시
// TODO: handleInputChange 함수로 모달 내 입력값 실시간 업데이트
// TODO: handleSubmitUserInfo 함수에서 사용자 입력 검증 (닉네임, 생년월일 필수 체크)
// TODO: Firestore에 사용자 정보 저장 및 업데이트 처리
// TODO: 신규 사용자라면 createdAt, noteCount, emotionalTemperature 등 초기값 추가 설정
// TODO: 로그인 버튼 클릭 시 구글 로그인 프로세스 시작
// TODO: 프로필 입력 모달은 ModalOne 컴포넌트를 사용하며, 닉네임과 생년월일 입력 폼과 저장 버튼 포함
// TODO: 에러 발생 시 콘솔에 로그 출력 및 사용자에게 alert로 알림

import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import ModalOne from '@/features/MainHome/ModalOne';

function LoginComponents() {
  const [showModal, setShowModal] = useState(false);
  const [userData, setUserData] = useState({
    displayName: '',
    birthDate: '',
  });

  // 사용자 정보가 완전한지 확인하는 함수
  const isUserDataComplete = (data) => {
    return data && 
           data.displayName && 
           data.birthDate && 
           data.emotionalTemperature !== undefined &&
           data.noteCount !== undefined;
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 사용자 정보 확인
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists() || !isUserDataComplete(userDoc.data())) {
        // 새로운 사용자이거나 불완전한 정보를 가진 기존 사용자인 경우
        const existingData = userDoc.exists() ? userDoc.data() : {};
        setUserData({
          displayName: existingData.displayName || user.displayName || '',
          birthDate: existingData.birthDate || '',
        });
        setShowModal(true);
      }
    } catch (error) {
      console.error('구글 로그인 실패:', error);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitUserInfo = async () => {
    try {
      if (!userData.displayName.trim()) {
        alert('닉네임을 입력해주세요.');
        return;
      }
      if (!userData.birthDate) {
        alert('생년월일을 입력해주세요.');
        return;
      }

      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, 'users', user.uid);
      const existingDoc = await getDoc(userDocRef);
      
      // 기존 데이터와 새로운 데이터 병합
      const updatedData = {
        ...existingDoc.exists() ? existingDoc.data() : {},
        displayName: userData.displayName.trim(),
        birthDate: userData.birthDate,
        email: user.email,
        photoURL: user.photoURL,
        updatedAt: new Date(),
      };

      // 새 사용자인 경우에만 초기값 설정
      if (!existingDoc.exists()) {
        updatedData.createdAt = new Date();
        updatedData.noteCount = 0;
        updatedData.emotionalTemperature = 36.5;
        updatedData.favorites = '';
        updatedData.favoriteQuote = '';
        updatedData.hobbies = '';
      }

      // Firestore에 사용자 정보 저장
      await setDoc(userDocRef, updatedData);
      setShowModal(false);
    } catch (error) {
      console.error('사용자 정보 저장 실패:', error);
      alert('정보 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">로그인</h2>
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

      <ModalOne isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">프로필 정보 입력</h2>
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
            <button
              onClick={handleSubmitUserInfo}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              정보 저장
            </button>
          </div>
        </div>
      </ModalOne>
    </div>
  );
}

export default LoginComponents;
