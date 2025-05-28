/**
 * 🚀 최적화된 사용자 프로필 페이지 컴포넌트
 * 
 * 주요 개선사항:
 * - React Query로 완전 전환 (캐싱, 에러 처리, 로딩 상태)
 * - 병렬 데이터 로딩으로 성능 향상
 * - 메모이제이션으로 불필요한 리렌더링 방지
 * - 에러 바운더리 및 폴백 UI 개선
 * 
 * 성능 최적화:
 * - 사용자 데이터 + 노트 데이터 병렬 로딩
 * - React Query 캐싱으로 중복 요청 방지
 * - 메모이제이션된 컴포넌트 및 콜백
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { auth } from "@/services/firebase";
import { deleteNoteFromFirestore } from "@/utils/firebaseNoteDataUtil";
import { getThemeClass } from "@/utils/themeHelper";
import { useNoteInteraction } from "@/hooks/useNoteInteraction";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ROUTES } from '@/constants/routes';

// 컴포넌트 imports
import ProfileSkeleton from "@/features/UserProfile/ProfileSkeleton";
import ProfileInfoCard from "@/features/UserProfile/ProfileInfoCard";
import NoteGrid from "@/features/UserProfile/NoteGrid";
import NoteEditModal from "@/components/NoteEditModal";
import EmotionSelectionModal from "@/features/EmotionTracking/EmotionSelectionModal";
import SubscribeButton from "@/components/SubscribeButton";

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const isOwnProfile = currentUser?.uid === userId;

  // 🚀 React Query로 최적화된 데이터 로딩
  const { 
    data: profileData, 
    isLoading, 
    error: profileError,
    refetch: refetchProfile 
  } = useUserProfile(userId);

  // 테마 상태 (메모이제이션)
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = useMemo(() => themes[current], [themes, current]);
  const themeClass = useMemo(() => 
    currentTheme ? getThemeClass(currentTheme) : "", 
    [currentTheme]
  );

  // 로컬 상태 (최소화)
  const [selectedEditNote, setSelectedEditNote] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmotionModal, setShowEmotionModal] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // 실시간 시간 업데이트 (메모이제이션)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }));
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // 노트 상호작용 관리 (메모이제이션)
  const { handleNoteClick } = useNoteInteraction({ 
    useModal: false,
    enableViewIncrement: true 
  });

  // 이벤트 핸들러들 (메모이제이션)
  const handleEditNote = useCallback((note) => {
    navigate(`${ROUTES.WRITE}?editId=${note.id}`);
  }, [navigate]);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setTimeout(() => setSelectedEditNote(null), 300);
  }, []);

  const handleOpenEmotionModal = useCallback(() => {
    if (isOwnProfile) {
      setShowEmotionModal(true);
    }
  }, [isOwnProfile]);

  const handleCloseEmotionModal = useCallback(() => {
    setShowEmotionModal(false);
  }, []);

  const handleEmotionRecorded = useCallback(() => {
    refetchProfile(); // React Query 캐시 갱신
  }, [refetchProfile]);

  const handleDeleteNote = useCallback(async (note) => {
    if (!confirm('정말로 이 노트를 삭제하시겠습니까?')) return;

    try {
      await deleteNoteFromFirestore(note.id, currentUser.uid);
      refetchProfile(); // 삭제 후 프로필 데이터 갱신
      
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('노트가 성공적으로 삭제되었습니다.', 'success');
      }
    } catch (error) {
      console.error("노트 삭제 실패:", error);
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('노트 삭제에 실패했습니다.', 'error');
      }
    }
  }, [currentUser?.uid, refetchProfile]);

  const handleNoteUpdated = useCallback(() => {
    refetchProfile(); // 수정 후 프로필 데이터 갱신
  }, [refetchProfile]);

  const scrollToNotes = useCallback(() => {
    const notesSection = document.getElementById('notes-section');
    if (notesSection) {
      notesSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, []);

  const getDefaultAvatar = useCallback((name) => {
    const seed = name || 'default';
    const colors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd93d', 'ffb3ba', 'bae1ff'];
    const randomColor = colors[Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length];
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${randomColor}`;
  }, []);

  const handleSubscriptionChange = useCallback(() => {
    // 구독 상태 변경 후 백그라운드에서 refetch
    setTimeout(() => refetchProfile(), 1000);
  }, [refetchProfile]);

  // 로딩 상태
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // 에러 상태 (개선된 UI)
  if (profileError) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-6 ${themeClass}`}>
        <div className="text-center max-w-md">
          <div className="mb-6">
            <svg 
              className={`w-16 h-16 mx-auto ${currentTheme?.textSecondary || 'text-red-400'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          
          <h2 className={`text-xl font-semibold mb-3 ${currentTheme?.textPrimary || 'text-gray-900'}`}>
            프로필을 불러올 수 없습니다
          </h2>
          <p className={`mb-6 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
            {profileError.message || '사용자 정보를 찾을 수 없습니다.'}
          </p>
          
          <div className="space-x-3">
            <button
              onClick={() => refetchProfile()}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:shadow-lg`}
            >
              다시 시도
            </button>
            <button
              onClick={() => navigate('/')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 border ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-700'} hover:bg-gray-50`}
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!profileData) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-6 ${themeClass}`}>
        <div className="text-center">
          <h2 className={`text-xl font-semibold mb-3 ${currentTheme?.textPrimary || 'text-gray-900'}`}>
            사용자를 찾을 수 없습니다
          </h2>
          <button
            onClick={() => navigate('/')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:shadow-lg`}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const { user: userData, notes, noteCount } = profileData;

  return (
    <div className={`min-h-screen ${themeClass}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 프로필 헤더 */}
        <div className="mb-8">
          <ProfileInfoCard
            userData={{
              ...userData,
              noteCount // 실제 노트 수 사용
            }}
            currentTime={currentTime}
            isOwnProfile={isOwnProfile}
            onEmotionClick={handleOpenEmotionModal}
            onNotesClick={scrollToNotes}
            getDefaultAvatar={getDefaultAvatar}
          />
          
          {/* 구독 버튼 (다른 사용자 프로필인 경우) */}
          {!isOwnProfile && currentUser && (
            <div className="mt-6 flex justify-center">
              <SubscribeButton
                targetUserId={userId}
                targetUserName={userData.displayName}
                onSubscriptionChange={handleSubscriptionChange}
              />
            </div>
          )}
        </div>

        {/* 노트 섹션 */}
        <div id="notes-section" className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${currentTheme?.textPrimary || 'text-gray-900'}`}>
              작성한 노트 ({noteCount})
            </h2>
            {isOwnProfile && (
              <button
                onClick={() => navigate(ROUTES.WRITE)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:shadow-lg`}
              >
                새 노트 작성
              </button>
            )}
          </div>

          <NoteGrid
            notes={notes}
            isOwnProfile={isOwnProfile}
            onNoteClick={handleNoteClick}
            onNoteEdit={handleEditNote}
            onNoteDelete={handleDeleteNote}
          />
        </div>
      </div>

      {/* 모달들 */}
      {showEditModal && selectedEditNote && (
        <NoteEditModal
          note={selectedEditNote}
          onClose={handleCloseEditModal}
          onNoteUpdated={handleNoteUpdated}
        />
      )}

      {showEmotionModal && (
        <EmotionSelectionModal
          onClose={handleCloseEmotionModal}
          onEmotionRecorded={handleEmotionRecorded}
        />
      )}
    </div>
  );
}

export default UserProfile;
