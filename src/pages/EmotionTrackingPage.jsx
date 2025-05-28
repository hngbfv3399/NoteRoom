/**
 * 감정 추적 메인 페이지
 * 
 * 주요 기능:
 * - 감정 대시보드 표시
 * - 감정 선택 모달 관리
 * - 감정 알림 시스템
 * - 월별 초기화 기능
 * - AI 월별 감정 분석
 */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import { createEmotionDistribution } from '@/utils/emotionConstants';
import { getThemeClass, getModalThemeClass } from '@/utils/themeHelper';
import EmotionDashboard from '@/features/EmotionTracking/EmotionDashboard';
import EmotionReminder from '@/features/EmotionTracking/EmotionReminder';
import EmotionAnalysisModal from '@/features/EmotionTracking/EmotionAnalysisModal';
import EmotionDiaryModal from '@/features/EmotionTracking/EmotionDiaryModal';
import ThemedButton from '@/components/ui/ThemedButton';
import ModalOne from '@/features/MainHome/ModalOne';
import { ROUTES } from '@/constants/routes';

function EmotionTrackingPage() {
  const navigate = useNavigate();
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const themeClass = getThemeClass(currentTheme);
  const modalBgClass = getModalThemeClass(currentTheme);
  
  // 대시보드 ref 추가
  const dashboardRef = useRef();
  
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [emotionDataForAnalysis, setEmotionDataForAnalysis] = useState(null);
  const [monthlyStatsForAnalysis, setMonthlyStatsForAnalysis] = useState(null);

  // 감정 일기 모달 열기
  const handleOpenDiaryModal = () => {
    setShowDiaryModal(true);
  };

  // 감정 일기 모달 닫기
  const handleCloseDiaryModal = () => {
    setShowDiaryModal(false);
  };

  // AI 분석 모달 열기
  const handleOpenAnalysisModal = async () => {
    try {
      if (!auth.currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }

      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        alert('사용자 데이터를 찾을 수 없습니다.');
        return;
      }

      const userData = userDoc.data();
      const emotionTracking = userData.emotionTracking || {};
      const dailyEmotions = emotionTracking.dailyEmotions || [];
      const monthlyStats = emotionTracking.monthlyStats || {};

      if (dailyEmotions.length === 0) {
        alert('분석할 감정 데이터가 없습니다. 먼저 감정을 기록해주세요.');
        return;
      }

      setEmotionDataForAnalysis(dailyEmotions);
      setMonthlyStatsForAnalysis(monthlyStats);
      setShowAnalysisModal(true);
    } catch (error) {
      console.error('감정 데이터 로드 실패:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // AI 분석 모달 닫기
  const handleCloseAnalysisModal = () => {
    setShowAnalysisModal(false);
    setEmotionDataForAnalysis(null);
    setMonthlyStatsForAnalysis(null);
  };

  // 월 1일 이후인지 확인하는 함수
  const isAfterFirstOfMonth = () => {
    const today = new Date();
    return today.getDate() > 1;
  };



  // 감정 일기 저장 완료 콜백
  const handleDiarySaved = async () => {
    if (dashboardRef.current) {
      await dashboardRef.current.refreshData();
    }
  };

  // 월별 초기화 핸들러
  const handleMonthlyReset = async () => {
    if (!auth.currentUser) return;

    setIsResetting(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();
      const newEmotionDistribution = createEmotionDistribution();
      
      const currentSettings = userData.emotionTracking?.settings || {
        reminderTime: "21:00",
        reminderEnabled: true,
        lastReminder: null
      };
      
      const resetEmotionTracking = {
        dailyEmotions: [],
        monthlyStats: {},
        settings: {
          ...currentSettings,
          monthlyResetDate: new Date().toISOString().split('T')[0]
        }
      };

      const updateData = {
        emotionDistribution: newEmotionDistribution,
        emotionTracking: resetEmotionTracking
      };

      await updateDoc(userRef, updateData);
      alert('감정 데이터가 성공적으로 초기화되었습니다!');
      setShowResetModal(false);
      
      if (dashboardRef.current) {
        await dashboardRef.current.refreshData();
      }
      
    } catch (error) {
      console.error('월별 초기화 실패:', error);
      alert('초기화 중 오류가 발생했습니다.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className={`min-h-screen ${themeClass}`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* 페이지 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${currentTheme.textColor}`}>
              🎭 감정 추적
            </h1>
            <p className={`${currentTheme.textColor} opacity-70`}>
              매일의 감정을 기록하고 나만의 감정 패턴을 발견해보세요.
            </p>
          </div>
          
          <div className="flex gap-3">
            {/* AI 분석 버튼 */}
            {isAfterFirstOfMonth() && (
              <ThemedButton
                onClick={handleOpenAnalysisModal}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <span>🧠</span>
                AI 감정 분석
              </ThemedButton>
            )}
            
            <ThemedButton
              onClick={() => setShowResetModal(true)}
              variant="secondary"
              className="text-sm"
            >
              월별 초기화
            </ThemedButton>
            
            <ThemedButton
              onClick={() => navigate(ROUTES.SETTING)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90`}
            >
              설정으로 돌아가기
            </ThemedButton>
          </div>
        </div>

        {/* 감정 대시보드 */}
        <EmotionDashboard 
          ref={dashboardRef}
        />

        {/* 감정 기록 섹션 */}
        <div className="mt-8">
          <h3 className={`text-xl font-semibold mb-4 ${currentTheme.textColor}`}>
            📝 감정 기록하기
          </h3>
          <div className="max-w-2xl mx-auto">
            {/* 감정 일기만 */}
            <div className={`p-8 rounded-lg border ${currentTheme.cardBg} ${currentTheme.borderColor} text-center`}>
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-4xl">📝</span>
                <h4 className={`text-2xl font-semibold ${currentTheme.textColor}`}>
                  감정 일기
                </h4>
              </div>
              <p className={`text-lg ${currentTheme.textColor} opacity-70 mb-6`}>
                언제든지 자유롭게 감정을 기록해보세요.<br />
                암호화되어 안전하게 보관됩니다.
              </p>
              <ThemedButton
                onClick={handleOpenDiaryModal}
                className="w-full max-w-md mx-auto text-lg py-3"
              >
                감정 일기 작성하기
              </ThemedButton>
            </div>
          </div>
        </div>

        {/* 감정 알림 시스템 */}
        <div className="mt-8">
          <EmotionReminder onOpenEmotionModal={handleOpenDiaryModal} />
        </div>



        {/* 월별 초기화 확인 모달 */}
        <ModalOne isOpen={showResetModal} onClose={() => setShowResetModal(false)}>
          <div className={`p-6 max-w-md mx-auto rounded-lg ${modalBgClass}`}>
            <h3 className={`text-lg font-semibold mb-4 ${currentTheme.textColor}`}>
              🔄 월별 초기화
            </h3>
            <p className={`mb-6 ${currentTheme.textColor} opacity-80`}>
              모든 감정 기록과 통계를 초기화하시겠습니까?
            </p>

            <div className="flex gap-3 justify-end">
              <ThemedButton
                onClick={() => setShowResetModal(false)}
                variant="secondary"
                disabled={isResetting}
              >
                취소
              </ThemedButton>
              <ThemedButton
                onClick={handleMonthlyReset}
                disabled={isResetting}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? '초기화 중...' : '초기화'}
              </ThemedButton>
            </div>
          </div>
        </ModalOne>

        {/* AI 감정 분석 모달 */}
        <EmotionAnalysisModal
          isOpen={showAnalysisModal}
          onClose={handleCloseAnalysisModal}
          emotionData={emotionDataForAnalysis}
          monthlyStats={monthlyStatsForAnalysis}
        />

        {/* 감정 일기 모달 */}
        <EmotionDiaryModal
          isOpen={showDiaryModal}
          onClose={handleCloseDiaryModal}
          onDiarySaved={handleDiarySaved}
        />
      </div>
    </div>
  );
}

export default EmotionTrackingPage; 