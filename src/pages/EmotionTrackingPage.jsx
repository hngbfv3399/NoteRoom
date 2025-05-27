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
import EmotionSelectionModal from '@/features/EmotionTracking/EmotionSelectionModal';
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
  
  const [showEmotionModal, setShowEmotionModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [emotionDataForAnalysis, setEmotionDataForAnalysis] = useState(null);
  const [monthlyStatsForAnalysis, setMonthlyStatsForAnalysis] = useState(null);

  // 감정 선택 모달 열기
  const handleOpenEmotionModal = () => {
    setShowEmotionModal(true);
  };

  // 감정 선택 모달 닫기
  const handleCloseEmotionModal = () => {
    setShowEmotionModal(false);
  };

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

      // 현재 사용자의 감정 데이터 가져오기
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

  // 감정 저장 완료 콜백 - 대시보드 새로고침 추가
  const handleEmotionSaved = async (emotionEntry) => {
    console.log('감정이 저장되었습니다:', emotionEntry);
    
    // 대시보드 즉시 새로고침
    if (dashboardRef.current) {
      await dashboardRef.current.refreshData();
    }
  };

  // 감정 일기 저장 완료 콜백
  const handleDiarySaved = async (diaryEntry) => {
    console.log('감정 일기가 저장되었습니다:', diaryEntry);
    
    // 대시보드 즉시 새로고침
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
      
      // 현재 사용자 데이터 먼저 가져오기
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();
      
      // 감정 분포 초기화
      const newEmotionDistribution = createEmotionDistribution();
      
      // 감정 추적 데이터 초기화 (기존 설정은 유지)
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

      // 단일 업데이트로 모든 필드 처리
      const updateData = {
        emotionDistribution: newEmotionDistribution,
        emotionTracking: resetEmotionTracking
      };

      await updateDoc(userRef, updateData);

      alert('감정 데이터가 성공적으로 초기화되었습니다!');
      setShowResetModal(false);
      
      // 대시보드 즉시 새로고침
      if (dashboardRef.current) {
        await dashboardRef.current.refreshData();
      }
      
    } catch (error) {
      console.error('월별 초기화 실패:', error);
      
      // 더 구체적인 에러 메시지 제공
      let errorMessage = '초기화 중 오류가 발생했습니다.';
      
      if (error.code === 'permission-denied') {
        errorMessage = '데이터를 초기화할 권한이 없습니다. 다시 로그인해주세요.';
      } else if (error.code === 'unavailable') {
        errorMessage = '네트워크 연결을 확인하고 다시 시도해주세요.';
      } else if (error.code === 'not-found') {
        errorMessage = '사용자 정보를 찾을 수 없습니다.';
      }
      
      alert(errorMessage);
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
            {/* AI 분석 버튼 - 월 1일 이후에만 표시 */}
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

        {/* 감정 대시보드 - ref 추가 */}
        <EmotionDashboard 
          ref={dashboardRef}
          onOpenEmotionModal={handleOpenEmotionModal} 
        />

        {/* 감정 기록 섹션 */}
        <div className="mt-8">
          <h3 className={`text-xl font-semibold mb-4 ${currentTheme.textColor}`}>
            📝 감정 기록하기
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* 대표 감정 기록 */}
            <div className={`p-6 rounded-lg border ${currentTheme.cardBg} ${currentTheme.borderColor}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🎭</span>
                <h4 className={`text-lg font-semibold ${currentTheme.textColor}`}>
                  오늘의 대표 감정
                </h4>
              </div>
              <p className={`text-sm ${currentTheme.textColor} opacity-70 mb-4`}>
                하루 한 번, 오늘을 대표하는 감정을 선택해주세요. AI 분석의 주요 데이터로 활용됩니다.
              </p>
              <ThemedButton
                onClick={handleOpenEmotionModal}
                className="w-full"
              >
                대표 감정 기록하기
              </ThemedButton>
            </div>

            {/* 감정 일기 */}
            <div className={`p-6 rounded-lg border ${currentTheme.cardBg} ${currentTheme.borderColor}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📝</span>
                <h4 className={`text-lg font-semibold ${currentTheme.textColor}`}>
                  감정 일기
                </h4>
              </div>
              <p className={`text-sm ${currentTheme.textColor} opacity-70 mb-4`}>
                언제든지 자유롭게 감정을 기록해보세요. 암호화되어 안전하게 보관됩니다.
              </p>
              <ThemedButton
                onClick={handleOpenDiaryModal}
                variant="secondary"
                className="w-full"
              >
                감정 일기 작성하기
              </ThemedButton>
            </div>
          </div>
        </div>

        {/* 감정 알림 시스템 */}
        <div className="mt-8">
          <EmotionReminder onOpenEmotionModal={handleOpenEmotionModal} />
        </div>

        {/* 감정 선택 모달 */}
        <EmotionSelectionModal
          isOpen={showEmotionModal}
          onClose={handleCloseEmotionModal}
          onEmotionSaved={handleEmotionSaved}
        />

        {/* 월별 초기화 확인 모달 */}
        <ModalOne isOpen={showResetModal} onClose={() => setShowResetModal(false)}>
          <div className={`p-6 max-w-md mx-auto rounded-lg ${modalBgClass}`}>
            <h3 className={`text-lg font-semibold mb-4 ${currentTheme.textColor}`}>
              🔄 월별 초기화
            </h3>
            <p className={`mb-6 ${currentTheme.textColor} opacity-80`}>
              모든 감정 기록과 통계를 초기화하시겠습니까?
              <br />
              <span className="text-red-500 text-sm font-medium">
                이 작업은 되돌릴 수 없습니다.
              </span>
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <span className="text-yellow-500">⚠️</span>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">초기화되는 데이터:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>모든 일일 감정 기록</li>
                    <li>감정 분포 통계</li>
                    <li>월별 통계 데이터</li>
                  </ul>
                  <p className="mt-2 text-xs">
                    알림 설정은 유지됩니다.
                  </p>
                </div>
              </div>
            </div>

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

        {/* 도움말 섹션 */}
        <div className={`mt-12 p-6 rounded-lg border ${currentTheme.modalBgColor} ${currentTheme.textColor}`} 
             style={{ borderColor: currentTheme.textColor + '20' }}>
          <h3 className={`text-lg font-semibold mb-3 ${currentTheme.textColor}`}>
            💡 감정 추적 가이드
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className={`font-medium mb-2 ${currentTheme.textColor}`}>📝 감정 기록하기</h4>
              <ul className={`space-y-1 list-disc list-inside ${currentTheme.textColor} opacity-80`}>
                <li>매일 하루 한 번 감정을 기록해보세요</li>
                <li>감정의 강도(1-10)도 함께 기록합니다</li>
                <li>간단한 메모로 그날의 상황을 남겨보세요</li>
              </ul>
            </div>
            <div>
              <h4 className={`font-medium mb-2 ${currentTheme.textColor}`}>📊 통계 활용하기</h4>
              <ul className={`space-y-1 list-disc list-inside ${currentTheme.textColor} opacity-80`}>
                <li>기간별 감정 변화를 확인해보세요</li>
                <li>자주 느끼는 감정 패턴을 파악해보세요</li>
                <li>월말에 초기화하여 새로운 시작을 해보세요</li>
              </ul>
            </div>
          </div>
          
          {/* AI 분석 안내 */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className={`font-medium mb-2 ${currentTheme.textColor} flex items-center gap-2`}>
              <span>🧠</span> AI 감정 분석
            </h4>
            <p className={`text-sm ${currentTheme.textColor} opacity-80`}>
              월 1일 이후부터 AI가 당신의 감정 패턴을 분석하여 개인화된 인사이트와 조언을 제공합니다.
            </p>
          </div>
        </div>

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