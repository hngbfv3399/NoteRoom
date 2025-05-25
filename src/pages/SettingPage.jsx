import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import ModalOne from '@/features/MainHome/ModalOne';
import ThemeSelector from '@/features/SettingPage/ThemeSelector';
import ProfileActions from '@/features/SettingPage/ProfileActions';
import { migrateUserNameToDisplayName } from '@/utils/dataStructureUpgrade';
import { getModalThemeClass } from '@/utils/themeHelper';
import { useSelector } from 'react-redux';
function SettingPage() {
  const { current, themes } = useSelector((state) => state.theme);
  const modalBgClass = themes[current] ? getModalThemeClass(themes[current]) : "bg-white";
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [userData, setUserData] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);

  // 관리자 이메일 목록
  const ADMIN_EMAILS = ['jiho3894@gmail.com'];

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData({ uid: user.uid, ...userDoc.data() });
        }
      } catch (error) {
        console.error('유저 데이터 로딩 실패:', error);
        setModalMessage('유저 정보를 불러오는 중 오류가 발생했습니다.');
        setShowModal(true);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      setModalMessage('로그아웃 중 오류가 발생했습니다.');
      setShowModal(true);
    }
  };

  const handleMigration = async () => {
    if (!window.confirm('정말로 마이그레이션을 실행하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setIsMigrating(true);
    try {
      const result = await migrateUserNameToDisplayName();
      setModalMessage(`마이그레이션 완료!\n총: ${result.total}명\n성공: ${result.migrated}명\n실패: ${result.errors}명`);
      setShowModal(true);
    } catch (error) {
      console.error('마이그레이션 실패:', error);
      setModalMessage('마이그레이션 중 오류가 발생했습니다.');
      setShowModal(true);
    } finally {
      setIsMigrating(false);
    }
  };

  if (!userData) {
    return <div>로딩 중...</div>;
  }

  const isAdmin = ADMIN_EMAILS.includes(userData.email);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">설정</h1>
      
      <div className="space-y-8">
        {/* 프로필 설정 섹션 */}
        <section className="p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">프로필 설정</h2>
          <div className="mb-4">
            <p className="text-gray-600">이메일: {userData.email}</p>
            <p className="text-gray-600">닉네임: {userData.displayName}</p>
          </div>
          <ProfileActions uid={userData.uid} />
        </section>

        {/* 테마 설정 섹션 */}
        <section className="p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">테마 설정</h2>
          <ThemeSelector />
        </section>

        {/* 관리자 섹션 */}
        {isAdmin && (
          <section className="p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">관리자 도구</h2>
            <button
              onClick={handleMigration}
              disabled={isMigrating}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors disabled:bg-gray-400"
            >
              {isMigrating ? '마이그레이션 중...' : 'userName → displayName 마이그레이션'}
            </button>
          </section>
        )}

        {/* 로그아웃 섹션 */}
        <section className="p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">계정 관리</h2>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            로그아웃
          </button>
        </section>
      </div>

    </div>
  );
}

export default SettingPage;
