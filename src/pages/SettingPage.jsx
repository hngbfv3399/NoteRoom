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
 * IMPROVED: 모달 컴포넌트 분리로 재사용성 향상, 에러 처리 개선, 토스트 알림 추가
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { auth, db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import AlertModal from '@/components/common/AlertModal';
import ThemeSelector from '@/features/SettingPage/ThemeSelector';
import ProfileActions from '@/features/SettingPage/ProfileActions';
import ThemedButton from '@/components/ui/ThemedButton';
import EmotionMigrationTool from '@/components/EmotionMigrationTool';
import NotificationSettings from '@/components/NotificationSettings';
import LoadingSpinner from '@/components/LoadingSpinner';
import { migrateUserNameToDisplayName } from '@/utils/dataStructureUpgrade';
import { isCurrentUserAdmin } from '@/utils/adminUtils';
import { showToast } from '@/store/toast/slice';
import { ADMIN_ROUTES, ROUTES } from '@/constants/routes';

function SettingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // 컴포넌트 상태
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '알림',
    message: '',
    showCancel: false,
    onConfirm: null
  });
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 사용자 데이터 로딩 (개선된 에러 처리)
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        dispatch(showToast({
          type: 'error',
          message: '로그인이 필요합니다.'
        }));
        navigate('/');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData({ uid: user.uid, ...userDoc.data() });
        } else {
          // 사용자 문서가 없는 경우 기본 정보만 설정
          setUserData({ 
            uid: user.uid, 
            email: user.email,
            displayName: user.displayName || '설정되지 않음'
          });
        }

        // 관리자 권한 확인
        const adminStatus = await isCurrentUserAdmin(user);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('유저 데이터 로딩 실패:', error);
        
        const errorMessage = error.code === 'permission-denied'
          ? '사용자 정보에 접근할 권한이 없습니다.'
          : error.code === 'unavailable'
          ? '네트워크 연결을 확인해주세요.'
          : '사용자 정보를 불러오는 중 오류가 발생했습니다.';
        
        setModalConfig({
          type: 'error',
          title: '오류',
          message: errorMessage,
          showCancel: false,
          onConfirm: () => {
            setShowModal(false);
            navigate('/');
          }
        });
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, dispatch]);

  // 로그아웃 핸들러 (개선된 에러 처리)
  const handleLogout = async () => {
    setModalConfig({
      type: 'warning',
      title: '로그아웃',
      message: '정말로 로그아웃하시겠습니까?',
      showCancel: true,
      onConfirm: async () => {
        try {
          await signOut(auth);
          dispatch(showToast({
            type: 'success',
            message: '성공적으로 로그아웃되었습니다.'
          }));
          navigate('/');
        } catch (error) {
          console.error('로그아웃 실패:', error);
          dispatch(showToast({
            type: 'error',
            message: '로그아웃 중 오류가 발생했습니다.'
          }));
        }
        setShowModal(false);
      }
    });
    setShowModal(true);
  };

  // 데이터 마이그레이션 핸들러 (관리자 전용, 개선된 확인 및 에러 처리)
  const handleMigration = async () => {
    setModalConfig({
      type: 'warning',
      title: '데이터 마이그레이션',
      message: '정말로 마이그레이션을 실행하시겠습니까?\n이 작업은 되돌릴 수 없으며 시스템 전체에 영향을 미칩니다.',
      showCancel: true,
      onConfirm: async () => {
        setIsMigrating(true);
        setShowModal(false);
        
        try {
          const result = await migrateUserNameToDisplayName();
          
          setModalConfig({
            type: 'success',
            title: '마이그레이션 완료',
            message: `마이그레이션이 성공적으로 완료되었습니다!\n\n총 사용자: ${result.total}명\n성공: ${result.migrated}명\n실패: ${result.errors}명`,
            showCancel: false,
            onConfirm: () => setShowModal(false)
          });
          setShowModal(true);
          
          dispatch(showToast({
            type: 'success',
            message: `마이그레이션 완료: ${result.migrated}/${result.total}명 성공`
          }));
        } catch (error) {
          console.error('마이그레이션 실패:', error);
          
          const errorMessage = error.code === 'permission-denied'
            ? '마이그레이션 권한이 없습니다.'
            : '마이그레이션 중 오류가 발생했습니다.';
          
          setModalConfig({
            type: 'error',
            title: '마이그레이션 실패',
            message: errorMessage,
            showCancel: false,
            onConfirm: () => setShowModal(false)
          });
          setShowModal(true);
          
          dispatch(showToast({
            type: 'error',
            message: errorMessage
          }));
        } finally {
          setIsMigrating(false);
        }
      }
    });
    setShowModal(true);
  };

  // 로딩 상태 (개선된 UI)
  if (loading || !userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">설정을 불러오는 중...</p>
      </div>
    );
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

        {/* 알림 설정 섹션 */}
        <section className="p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">🔔 알림 설정</h2>
          <p className="mb-4">푸시 알림을 설정하여 실시간으로 소식을 받아보세요.</p>
          <NotificationSettings />
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

      {/* 개선된 알림 모달 */}
      <AlertModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        showCancel={modalConfig.showCancel}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setShowModal(false)}
      />
    </div>
  );
}

export default SettingPage;
