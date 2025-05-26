/**
 * 사용자 프로필 페이지 컴포넌트
 * 
 * 주요 기능:
 * - 사용자 정보 표시 (프로필 헤더, 정보 카드)
 * - 사용자가 작성한 노트 목록 표시
 * - 노트 클릭 시 상세 모달 표시
 * - 감정 기록 모달 표시
 * - 실시간 시간 표시
 * - 테마 시스템 적용
 * - 두 섹션으로 분리된 레이아웃 (프로필 + 노트)
 * - 구독 시스템 지원
 * 
 * NOTE: NoteModal 컴포넌트로 모달 분리 완료
 * TODO: 에러 처리 개선, 로딩 상태 세분화, 무한 스크롤 추가
 */

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getUserDataByUid, loadNotesPage, updateUserNoteCount, deleteNoteFromFirestore } from "@/utils/firebaseNoteDataUtil"
import { auth } from "@/services/firebase";
import ProfileInfoCard from "@/features/UserProfile/ProfileInfoCard";
import NoteGrid from "@/features/UserProfile/NoteGrid";
import NoteEditModal from "@/components/NoteEditModal";
import EmotionSelectionModal from "@/features/EmotionTracking/EmotionSelectionModal";
import ProfileSkeleton from "@/features/UserProfile/ProfileSkeleton";
import SubscribeButton from "@/components/SubscribeButton";
import { getThemeClass } from "@/utils/themeHelper";
import { useNoteInteraction } from "@/hooks/useNoteInteraction";
import { ROUTES } from '@/constants/routes';

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const isOwnProfile = currentUser?.uid === userId;

  // 테마 상태
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const themeClass = currentTheme ? getThemeClass(currentTheme) : "";

  // 컴포넌트 상태
  const [userData, setUserData] = useState(null);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEditNote, setSelectedEditNote] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmotionModal, setShowEmotionModal] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // 실시간 시간 업데이트 로직
  // NOTE: 1분마다 업데이트하여 성능 최적화
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }));
    };

    updateTime(); // 초기 시간 설정
    const timer = setInterval(updateTime, 60000); // 1분마다 업데이트
    
    return () => clearInterval(timer); // 컴포넌트 언마운트 시 타이머 정리
  }, []);

  // 사용자 데이터 페칭 로직
  // TODO: React Query로 캐싱 및 에러 처리 개선
  const fetchUserData = useCallback(async () => {
    if (!userId) {
      setError("유효하지 않은 사용자 ID입니다.");
      setIsLoading(false);
      return;
    }

    try {
      const userFromDB = await getUserDataByUid(userId);
      if (!userFromDB) {
        setError("사용자를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      // noteCount를 실제 노트 수에 맞게 업데이트
      let actualNoteCount = userFromDB.noteCount ?? 0;
      try {
        actualNoteCount = await updateUserNoteCount(userId);
      } catch (updateError) {
        console.warn("noteCount 업데이트 실패:", updateError);
        // 업데이트 실패해도 기존 데이터는 표시
      }

      // 사용자 데이터 기본값 설정
      setUserData({
        displayName: userFromDB.displayName ?? "이름 없음",
        birthDate: userFromDB.birthDate ?? "정보 없음",
        favorites: userFromDB.favorites ?? "정보 없음",
        mood: userFromDB.mood ?? "정보 없음",
        favoriteQuote: userFromDB.favoriteQuote ?? "정보 없음",
        hobbies: userFromDB.hobbies ?? "정보 없음",
        email: userFromDB.email ?? "",
        noteCount: actualNoteCount, // 업데이트된 실제 노트 수 사용
        themeColor: userFromDB.themeColor ?? "defaultThemeColor",
        profileImage: userFromDB.profileImage ?? "",
        subscriberCount: userFromDB.subscriberCount ?? 0, // 구독자 수 추가
        subscriptionCount: userFromDB.subscriptionCount ?? 0, // 구독 수 추가
      });
    } catch (error) {
      setError("사용자 데이터를 불러오는 중 오류가 발생했습니다.");
      console.error("유저 데이터 불러오기 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 사용자 노트 데이터 페칭 로직
  // TODO: 무한 스크롤 구현, 페이지네이션 개선
  const fetchNotes = useCallback(async () => {
    try {
      const userNotes = await loadNotesPage(null, 10, userId);
      if (userNotes?.notes) {
        setNotes(userNotes.notes);
      } else {
        setNotes([]);
        console.log("사용자의 노트가 없습니다.");
      }
    } catch (error) {
      console.error("노트 불러오기 실패:", error);
      setError("노트를 불러오는 중 오류가 발생했습니다.");
    }
  }, [userId]);

  // 컴포넌트 마운트 시 데이터 페칭
  useEffect(() => {
    fetchUserData();
    fetchNotes();
  }, [fetchUserData, fetchNotes]);

  // 노트 상호작용 관리 (클릭 → 페이지 이동으로 공유 가능)
  const { handleNoteClick } = useNoteInteraction({ 
    useModal: false,  // 페이지 이동 사용 (공유 가능한 URL)
    enableViewIncrement: true 
  });

  // 노트 수정 핸들러 - /write 페이지로 이동
  const handleEditNote = (note) => {
    navigate(`${ROUTES.WRITE}?editId=${note.id}`);
  };

  // 노트 수정 모달 닫기 핸들러
  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setTimeout(() => setSelectedEditNote(null), 300);
  }, []);

  // 감정 모달 핸들러
  const handleOpenEmotionModal = useCallback(() => {
    if (isOwnProfile) {
      setShowEmotionModal(true);
    }
  }, [isOwnProfile]);

  const handleCloseEmotionModal = useCallback(() => {
    setShowEmotionModal(false);
  }, []);

  // 감정 기록 완료 후 프로필 새로고침
  const handleEmotionRecorded = useCallback(() => {
    // 프로필 정보 새로고침을 위해 컴포넌트 리렌더링
    setUserData(prev => ({ ...prev }));
  }, []);

  // 노트 업데이트 후 처리
  const handleNoteUpdated = useCallback((updatedNote) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      )
    );
    // 사용자 데이터도 새로고침 (noteCount 등)
    fetchUserData();
  }, []);

  // 노트 삭제 후 처리
  const handleNoteDeleted = useCallback((deletedNoteId) => {
    setNotes(prevNotes => 
      prevNotes.filter(note => note.id !== deletedNoteId)
    );
    // 사용자 데이터도 새로고침 (noteCount 감소)
    fetchUserData();
  }, []);

  // 노트 삭제 핸들러 추가
  const handleDeleteNote = useCallback(async (note) => {
    try {
      await deleteNoteFromFirestore(note.id, currentUser.uid);
      
      // 성공 시 노트 목록에서 제거
      handleNoteDeleted(note.id);
      
      // 성공 메시지 표시
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('노트가 성공적으로 삭제되었습니다.', 'success');
      }
    } catch (error) {
      console.error("노트 삭제 실패:", error);
      
      // 에러 메시지 표시
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('노트 삭제에 실패했습니다. 다시 시도해주세요.', 'error');
      }
    }
  }, [currentUser?.uid, handleNoteDeleted]);

  // 노트 섹션으로 스크롤하는 함수
  const scrollToNotes = () => {
    const notesSection = document.getElementById('notes-section');
    if (notesSection) {
      notesSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // 기본 아바타 생성 함수 (DiceBear API 사용)
  const getDefaultAvatar = (name) => {
    const seed = name || 'default';
    const colors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd93d', 'ffb3ba', 'bae1ff'];
    const randomColor = colors[Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length];
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${randomColor}`;
  };

  // 구독 상태 변경 핸들러
  const handleSubscriptionChange = useCallback((isSubscribed, newSubscriberCount) => {
    setUserData(prev => ({
      ...prev,
      subscriberCount: newSubscriberCount
    }));
  }, []);

  // 로딩 상태 처리
  if (isLoading) return <ProfileSkeleton />;
  
  // 에러 상태 처리 개선
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-6 ${themeClass}`}>
        <div className="text-center max-w-md">
          {/* 에러 아이콘 */}
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
            오류가 발생했습니다
          </h2>
          <p className={`mb-6 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
            {error}
          </p>
          
          <button
            onClick={() => window.location.reload()}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:shadow-lg`}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClass}`}>
      {/* 섹션 1: 프로필 정보 */}
      <section id="profile-section" className="relative flex flex-col py-8 sm:py-12 lg:py-16">
        {/* 배경 이미지 */}
        <div className="absolute inset-0">
          {userData.profileImage ? (
            <img
              src={userData.profileImage}
              alt="프로필 배경"
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                // 이미지 로드 실패 시 부모 요소를 숨기고 기본 배경 표시
                e.target.parentElement.style.display = 'none';
              }}
            />
          ) : (
            // 기본 그라데이션 배경 (저작권 걱정 없음)
            <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500" />
          )}
          
          {/* 프로필 이미지가 없거나 로드 실패 시 표시되는 기본 배경 */}
          {!userData.profileImage && (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500" />
          )}
          
          {/* 그라데이션 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          {/* 테마 색상 오버레이 */}
          <div className={`absolute inset-0 ${currentTheme?.overlayBg || 'bg-black/10'}`} />
        </div>
        
        {/* 프로필 정보 카드 */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
          <div className="flex flex-col items-center space-y-6">
            <ProfileInfoCard 
              userData={userData} 
              currentTime={currentTime}
              onOpenEmotionModal={isOwnProfile ? handleOpenEmotionModal : null}
            />
            
            {/* 구독 버튼 */}
            <SubscribeButton
              targetUserId={userId}
              targetUserName={userData.displayName}
              subscriberCount={userData.subscriberCount}
              onSubscriptionChange={handleSubscriptionChange}
            />
          </div>
        </div>

        {/* 하단 스크롤 안내 */}
        <div className="relative z-20 text-center pb-8">
          <div className="max-w-md mx-auto">
            <p className="text-white/80 text-sm mb-4 font-medium">
              {userData.displayName}님의 노트 보기
            </p>
            <button
              onClick={scrollToNotes}
              className="group flex flex-col items-center space-y-2 text-white/70 hover:text-white transition-all duration-300 mx-auto"
              aria-label="노트 섹션으로 이동"
            >
              <div className="w-8 h-8 rounded-full border-2 border-white/50 flex items-center justify-center group-hover:border-white group-hover:bg-white/10 transition-all duration-300">
                <svg 
                  className="w-4 h-4 animate-bounce" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                  />
                </svg>
              </div>
              <span className="text-xs font-medium">스크롤하여 노트 보기</span>
            </button>
          </div>
        </div>
      </section>

      {/* 섹션 2: 노트 목록 */}
      <section 
        id="notes-section" 
        className={`min-h-screen ${currentTheme?.bgColor || 'bg-gray-50'} transition-colors duration-300`}
      >
        {/* 섹션 헤더 */}
        <div className={`sticky top-0 z-10 backdrop-blur-md ${currentTheme?.modalBgColor || 'bg-white'}/90 border-b border-gray-200/50 py-4`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* 프로필 아바타 */}
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                  <img
                    src={userData.profileImage || getDefaultAvatar(userData.displayName)}
                    alt={userData.displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // 이미지 로드 실패 시 기본 아바타로 대체
                      e.target.src = getDefaultAvatar(userData.displayName);
                    }}
                  />
                </div>
                
                <div>
                  <h2 className={`text-xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                    {userData.displayName}님의 노트
                  </h2>
                  <p className={`text-sm opacity-70 ${currentTheme?.textColor || 'text-gray-600'}`}>
                    총 {notes.length}개의 노트
                  </p>
                </div>
              </div>

              {/* 상단으로 이동 버튼 */}
              <button
                onClick={() => {
                  const profileSection = document.getElementById('profile-section');
                  if (profileSection) {
                    profileSection.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start'
                    });
                  }
                }}
                className={`p-2 rounded-full transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} ${currentTheme?.buttonHover || 'hover:shadow-lg'}`}
                aria-label="프로필로 돌아가기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 노트 그리드 */}
        <div className="py-8">
          <NoteGrid 
            notes={notes} 
            onNoteClick={handleNoteClick}
            onNoteEdit={isOwnProfile ? handleEditNote : null}
            onNoteDelete={isOwnProfile ? handleDeleteNote : null}
            isOwnProfile={isOwnProfile}
          />
        </div>
      </section>

      {/* 노트 수정 모달 */}
      <NoteEditModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        note={selectedEditNote}
        onNoteUpdated={handleNoteUpdated}
        onNoteDeleted={handleDeleteNote}
      />

      {/* 감정 선택 모달 */}
      {isOwnProfile && (
        <EmotionSelectionModal
          isOpen={showEmotionModal}
          onClose={handleCloseEmotionModal}
          onEmotionRecorded={handleEmotionRecorded}
        />
      )}
    </div>
  );
}

export default UserProfile;
