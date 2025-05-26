/**
 * 설정 페이지 컴포넌트
 * 
 * 주요 기능:
 * - 사용자 프로필 정보 표시 및 관리
 * - 테마 설정 변경
 * - 관리자 전용 도구 (데이터 마이그레이션)
 * - 로그아웃 기능
 * 
 * NOTE: 관리자 권한은 하드코딩된 이메일 목록으로 관리
 * TODO: 권한 관리 시스템 개선, 설정 항목 추가 (알림, 개인정보)
 * FIXME: 모달 컴포넌트 분리 필요, 에러 처리 개선
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import ModalOne from '@/features/MainHome/ModalOne';
import ThemeSelector from '@/features/SettingPage/ThemeSelector';
import ProfileActions from '@/features/SettingPage/ProfileActions';
import ThemedButton from '@/components/ui/ThemedButton';
import EmotionMigrationTool from '@/components/EmotionMigrationTool';
import { migrateUserNameToDisplayName } from '@/utils/dataStructureUpgrade';
import { getModalThemeClass } from '@/utils/themeHelper';
import { isCurrentUserAdmin } from '@/utils/adminUtils';
import { useSelector } from 'react-redux';
import { ADMIN_ROUTES, ROUTES } from '@/constants/routes';

function SettingPage() {
  // 테마 상태
  const { current, themes } = useSelector((state) => state.theme);
  const modalBgClass = themes[current] ? getModalThemeClass(themes[current]) : "bg-white";
  
  const navigate = useNavigate();
  
  // 컴포넌트 상태
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [userData, setUserData] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 사용자 데이터 로딩
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

        // 관리자 권한 확인
        const adminStatus = await isCurrentUserAdmin(user);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('유저 데이터 로딩 실패:', error);
        setModalMessage('유저 정보를 불러오는 중 오류가 발생했습니다.');
        setShowModal(true);
      }
    };

    fetchUserData();
  }, [navigate]);

  // 로그아웃 핸들러
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

  // 데이터 마이그레이션 핸들러 (관리자 전용)
  // NOTE: userName 필드를 displayName으로 변경하는 마이그레이션
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

  // 로딩 상태
  // TODO: 스켈레톤 로딩으로 개선
  if (!userData) {
    return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">설정</h1>
      
      <div className="space-y-8">
        {/* 프로필 설정 섹션 */}
        <section className="p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">프로필 설정</h2>
          <div className="mb-4">
            <p className="mb-2">
              <span className="font-medium">이메일:</span> {userData.email}
            </p>
            <p>
              <span className="font-medium">닉네임:</span> {userData.displayName || '설정되지 않음'}
            </p>
          </div>
          <ProfileActions uid={userData.uid} />
        </section>

        {/* 테마 설정 섹션 */}
        <section className="p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">테마 설정</h2>
          <p className="mb-4">원하는 테마를 선택하여 개성을 표현해보세요.</p>
          <ThemeSelector />
        </section>

        {/* 공지사항 섹션 */}
        <section className="p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">📢 공지사항</h2>
          <p className="mb-4">최신 업데이트 소식과 앱 소개를 확인해보세요.</p>
          <ThemedButton
            onClick={() => navigate(ROUTES.ANNOUNCEMENT)}
            className="w-full"
          >
            공지사항 보기
          </ThemedButton>
        </section>

        {/* 감정 추적 기능 섹션 */}
        <section className="p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">🎭 감정 추적 기능</h2>
          <p className="mb-4">일일 감정을 기록하고 통계를 확인해보세요.</p>
          <EmotionMigrationTool />
        </section>

        {/* 신고 내역 섹션 */}
        <section className="p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">🚨 신고 내역</h2>
          <p className="mb-4">신고한 콘텐츠들의 처리 상태를 확인할 수 있습니다.</p>
          <ThemedButton
            onClick={() => navigate(ROUTES.MY_REPORTS)}
            className="w-full"
          >
            내 신고 내역 보기
          </ThemedButton>
        </section>

        {/* 관리자 전용 섹션 */}
        {isAdmin && (
          <section className="p-6 rounded-lg shadow bg-yellow-50 border border-yellow-200">
            <h2 className="text-xl font-semibold mb-4 text-yellow-800">
              🔧 관리자 도구
            </h2>
            <p className="text-yellow-700 mb-4 text-sm">
              주의: 이 도구들은 시스템 전체에 영향을 미칩니다.
            </p>
            <div className="space-y-3">
              <ThemedButton
                onClick={() => navigate(ADMIN_ROUTES.DASHBOARD)}
                className="w-full"
              >
                🛠️ 관리자 대시보드
              </ThemedButton>
              <ThemedButton
                onClick={() => navigate(ADMIN_ROUTES.ANNOUNCEMENT)}
                className="w-full"
              >
                📢 공지사항 관리
              </ThemedButton>
              <ThemedButton
                onClick={handleMigration}
                disabled={isMigrating}
                className="disabled:opacity-50 disabled:cursor-not-allowed w-full"
              >
                {isMigrating ? '마이그레이션 중...' : 'userName → displayName 마이그레이션'}
              </ThemedButton>
            </div>
          </section>
        )}

        {/* 계정 관리 섹션 */}
        <section className="p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">계정 관리</h2>
          <p className="mb-4">계정에서 로그아웃하거나 계정을 관리할 수 있습니다.</p>
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              로그아웃
            </button>
            {/* TODO: 계정 삭제, 비밀번호 변경 기능 추가 */}
          </div>
        </section>
      </div>

      {/* 알림 모달 */}
      {/* FIXME: 모달 컴포넌트를 별도 파일로 분리하고 재사용성 향상 */}
      <ModalOne isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className={`p-6 rounded-lg ${modalBgClass}`}>
          <h3 className="text-lg font-semibold mb-4">알림</h3>
          <p className="whitespace-pre-line">{modalMessage}</p>
          <ThemedButton
            onClick={() => setShowModal(false)}
            className="mt-4"
          >
            확인
          </ThemedButton>
        </div>
      </ModalOne>
    </div>
  );
}

export default SettingPage;
