/**
 * 감정 선택 모달 컴포넌트
 * 
 * 주요 기능:
 * - 12가지 감정 타입 선택
 * - 감정 강도 선택 (1-10)
 * - 오늘의 감정 기록
 * - 테마 시스템 적용
 */
import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import { EMOTION_TYPES, EMOTION_META } from '@/utils/emotionConstants';
import { getModalThemeClass } from '@/utils/themeHelper';
import ThemedButton from '@/components/ui/ThemedButton';

// 슬라이더 스타일링을 위한 CSS
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid #4f46e5;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid #4f46e5;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

function EmotionSelectionModal({ isOpen, onClose, onEmotionSaved }) {
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const modalBgClass = getModalThemeClass(currentTheme);
  
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 메모 입력 핸들러
  const handleNoteChange = useCallback((e) => {
    setNote(e.target.value);
  }, []);

  // 감정 저장 핸들러
  const handleSaveEmotion = async () => {
    if (!selectedEmotion || !auth.currentUser) return;

    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
      const now = new Date();
      
      const emotionEntry = {
        date: today,
        emotion: selectedEmotion,
        intensity,
        note: note.trim(),
        timestamp: now.toISOString()
      };

      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // 현재 사용자 데이터 먼저 가져오기
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();
      
      // 감정 분포 업데이트 준비
      const currentEmotionDistribution = userData.emotionDistribution || {};
      const updatedEmotionDistribution = {
        ...currentEmotionDistribution,
        [selectedEmotion]: intensity
      };

      // 감정 추적 업데이트 준비
      const currentEmotionTracking = userData.emotionTracking || { 
        dailyEmotions: [], 
        settings: { reminderTime: "21:00", reminderEnabled: true } 
      };
      
      // 기존 감정 기록에서 오늘 날짜 기록 제거 (중복 방지)
      const existingEmotions = currentEmotionTracking.dailyEmotions || [];
      const filteredEmotions = existingEmotions.filter(emotion => emotion.date !== today);
      
      // 새로운 감정 기록 추가
      const updatedDailyEmotions = [...filteredEmotions, emotionEntry];
      
      const updatedEmotionTracking = {
        ...currentEmotionTracking,
        dailyEmotions: updatedDailyEmotions,
        settings: {
          ...currentEmotionTracking.settings,
          lastReminder: serverTimestamp()
        }
      };

      // 프로필 기분 상태 업데이트
      const emotionMeta = EMOTION_META[selectedEmotion];
      const updatedMood = `${emotionMeta.emoji} ${emotionMeta.name} (강도 ${intensity}/10)`;

      // 단일 업데이트로 모든 필드 한 번에 처리
      const updateData = {
        emotionDistribution: updatedEmotionDistribution,
        emotionTracking: updatedEmotionTracking,
        mood: updatedMood
      };

      await updateDoc(userRef, updateData);

      // 성공 콜백 호출
      if (onEmotionSaved) {
        onEmotionSaved(emotionEntry);
      }

      // 모달 닫기 및 상태 초기화
      handleClose();
      
    } catch (error) {
      console.error('감정 저장 실패:', error);
      
      // 더 구체적인 에러 메시지 제공
      let errorMessage = '감정을 저장하는 중 오류가 발생했습니다.';
      
      if (error.code === 'permission-denied') {
        errorMessage = '감정 데이터를 저장할 권한이 없습니다. 다시 로그인해주세요.';
      } else if (error.code === 'unavailable') {
        errorMessage = '네트워크 연결을 확인하고 다시 시도해주세요.';
      } else if (error.code === 'not-found') {
        errorMessage = '사용자 정보를 찾을 수 없습니다.';
      }
      
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // 모달 닫기 및 상태 초기화
  const handleClose = () => {
    setSelectedEmotion(null);
    setIntensity(5);
    setNote('');
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 배경 오버레이 */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={handleClose}
          />
          
          {/* 모달 컨텐츠 */}
          <div className={`relative p-6 max-w-2xl mx-auto rounded-lg ${modalBgClass} max-h-[90vh] overflow-y-auto`}>
            <style>{sliderStyles}</style>
            
            {/* 닫기 버튼 */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 transition-colors p-2"
            >
              ✕
            </button>
            
            <h2 className={`text-2xl font-bold mb-6 text-center ${currentTheme.textColor}`}>
              🎭 오늘의 대표 감정은?
            </h2>
            <p className={`text-center mb-6 ${currentTheme.textColor} opacity-70`}>
              하루 한 번, 오늘을 대표하는 감정을 선택해주세요
            </p>

            {/* 감정 선택 그리드 */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {Object.entries(EMOTION_META).map(([key, emotion]) => (
                <button
                  key={key}
                  onClick={() => setSelectedEmotion(key)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${currentTheme.modalBgColor}`}
                  style={{
                    borderColor: selectedEmotion === key ? emotion.color : '#d1d5db',
                    backgroundColor: selectedEmotion === key ? `${emotion.color}20` : currentTheme.modalBgColor,
                    boxShadow: selectedEmotion === key ? `0 4px 12px ${emotion.color}30` : 'none'
                  }}
                >
                  <div className="text-3xl mb-2">{emotion.emoji}</div>
                  <div className={`text-sm font-medium ${currentTheme.textColor}`}>
                    {emotion.name}
                  </div>
                </button>
              ))}
            </div>

            {/* 선택된 감정 정보 */}
            {selectedEmotion && (
              <div className="mb-6">
                <div className={`p-4 rounded-lg border ${currentTheme.bgColor}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{EMOTION_META[selectedEmotion].emoji}</span>
                    <div>
                      <h3 className={`font-semibold ${currentTheme.textColor}`}>
                        {EMOTION_META[selectedEmotion].name}
                      </h3>
                      <p className={`text-sm ${currentTheme.textColor} opacity-70`}>
                        {EMOTION_META[selectedEmotion].description}
                      </p>
                    </div>
                  </div>

                  {/* 감정 강도 선택 */}
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${currentTheme.textColor}`}>
                      감정 강도: {intensity}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={intensity}
                      onChange={(e) => setIntensity(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, ${EMOTION_META[selectedEmotion].color} 0%, ${EMOTION_META[selectedEmotion].color} ${intensity * 10}%, #e5e7eb ${intensity * 10}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className={`flex justify-between text-xs mt-1 ${currentTheme.textColor} opacity-60`}>
                      <span>약함</span>
                      <span>보통</span>
                      <span>강함</span>
                    </div>
                  </div>

                  {/* 메모 입력 */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${currentTheme.textColor}`}>
                      간단한 메모 (선택사항)
                    </label>
                    <textarea
                      value={note}
                      onChange={handleNoteChange}
                      placeholder="오늘의 대표 감정에 대해 간단히 적어보세요..."
                      className={`w-full p-3 rounded-lg resize-none border-2 focus:outline-none transition-colors ${currentTheme.inputBg} ${currentTheme.inputText} ${currentTheme.inputBorder} ${currentTheme.inputFocus}`}
                      rows="3"
                      maxLength="200"
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <div className={`text-xs mt-1 ${currentTheme.textColor} opacity-60`}>
                      {note.length}/200
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-3 justify-end">
              <ThemedButton
                onClick={handleClose}
                variant="secondary"
                disabled={isSaving}
              >
                취소
              </ThemedButton>
              <ThemedButton
                onClick={handleSaveEmotion}
                disabled={!selectedEmotion || isSaving}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '저장 중...' : '대표 감정 기록하기'}
              </ThemedButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EmotionSelectionModal; 