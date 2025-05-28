/**
 * 감정 일기 작성 모달 컴포넌트
 * 
 * 주요 기능:
 * - 무제한 감정 일기 작성
 * - 암호화된 일기 내용 저장
 * - 감정 태그 선택
 * - 시간별 기록 관리
 */
import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import { EMOTION_TYPES, EMOTION_META } from '@/utils/emotionConstants';
import { getModalThemeClass } from '@/utils/themeHelper';
import { encryptEmotionNote } from '@/utils/encryption';
import ThemedButton from '@/components/ui/ThemedButton';

function EmotionDiaryModal({ isOpen, onClose, onDiarySaved }) {
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const modalBgClass = getModalThemeClass(currentTheme);
  
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [diaryContent, setDiaryContent] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [isSaving, setIsSaving] = useState(false);

  // 감정 태그 토글
  const toggleEmotion = useCallback((emotionKey) => {
    setSelectedEmotions(prev => {
      if (prev.includes(emotionKey)) {
        return prev.filter(e => e !== emotionKey);
      } else {
        return [...prev, emotionKey];
      }
    });
  }, []);

  // 일기 내용 변경
  const handleContentChange = useCallback((e) => {
    setDiaryContent(e.target.value);
  }, []);

  // 감정 일기 저장
  const handleSaveDiary = async () => {
    if (!diaryContent.trim() || !auth.currentUser) return;

    setIsSaving(true);
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timeString = now.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // 일기 내용 암호화
      const encryptedContent = await encryptEmotionNote(
        diaryContent.trim(), 
        auth.currentUser.uid
      );

      const diaryEntry = {
        date: today,
        time: timeString,
        emotions: selectedEmotions,
        content: encryptedContent,
        intensity,
        timestamp: now.toISOString(),
        encrypted: true,
        type: 'diary' // 일기 타입 구분
      };

      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // arrayUnion을 사용해서 감정 일기를 배열에 추가 (덮어쓰기 없이 계속 추가)
      await updateDoc(userRef, {
        'emotionTracking.dailyEmotions': arrayUnion(diaryEntry)
      });

      // 성공 콜백 호출
      if (onDiarySaved) {
        onDiarySaved(diaryEntry);
      }

      // 모달 닫기 및 상태 초기화
      handleClose();
      
    } catch (error) {
      console.error('감정 일기 저장 실패:', error);
      alert('일기를 저장하는 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 모달 닫기 및 상태 초기화
  const handleClose = () => {
    setSelectedEmotions([]);
    setDiaryContent('');
    setIntensity(5);
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
          <div className={`relative p-6 max-w-3xl mx-auto rounded-lg ${modalBgClass} max-h-[90vh] overflow-y-auto`}>
            {/* 닫기 버튼 */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 transition-colors p-2"
            >
              ✕
            </button>
            
            <h2 className={`text-2xl font-bold mb-6 text-center ${currentTheme.textColor}`}>
              📝 감정 일기 작성
            </h2>

            {/* 감정 태그 선택 */}
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-3 ${currentTheme.textColor}`}>
                지금 느끼는 감정들을 선택해주세요 (복수 선택 가능)
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {Object.entries(EMOTION_META).map(([key, emotion]) => {
                  const isSelected = selectedEmotions.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleEmotion(key)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${currentTheme.modalBgColor}`}
                      style={{
                        borderColor: isSelected ? emotion.color : '#d1d5db',
                        backgroundColor: isSelected ? `${emotion.color}20` : currentTheme.modalBgColor,
                        boxShadow: isSelected ? `0 2px 8px ${emotion.color}30` : 'none'
                      }}
                    >
                      <div className="text-2xl mb-1">{emotion.emoji}</div>
                      <div className={`text-xs font-medium ${currentTheme.textColor}`}>
                        {emotion.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 감정 강도 */}
            <div className="mb-6">
              <label className={`block text-lg font-semibold mb-3 ${currentTheme.textColor}`}>
                전체적인 감정 강도: {intensity}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${intensity * 10}%, #e5e7eb ${intensity * 10}%, #e5e7eb 100%)`
                }}
              />
              <div className={`flex justify-between text-sm mt-2 ${currentTheme.textColor} opacity-60`}>
                <span>매우 약함</span>
                <span>보통</span>
                <span>매우 강함</span>
              </div>
            </div>

            {/* 일기 내용 작성 */}
            <div className="mb-6">
              <label className={`block text-lg font-semibold mb-3 ${currentTheme.textColor}`}>
                오늘의 감정 일기 ✨
              </label>
              <textarea
                value={diaryContent}
                onChange={handleContentChange}
                placeholder="오늘 하루 어떤 일이 있었나요? 어떤 감정을 느꼈나요? 자유롭게 적어보세요..."
                className={`w-full p-4 rounded-lg resize-none border-2 focus:outline-none transition-colors ${currentTheme.inputBg} ${currentTheme.inputText} ${currentTheme.inputBorder} ${currentTheme.inputFocus}`}
                rows="8"
                maxLength="2000"
                autoComplete="off"
                spellCheck="false"
              />
              <div className={`flex justify-between items-center text-sm mt-2 ${currentTheme.textColor} opacity-60`}>
                <span>🔒 일기 내용은 암호화되어 안전하게 보관됩니다</span>
                <span>{diaryContent.length}/2000</span>
              </div>
            </div>

            {/* 선택된 감정 미리보기 */}
            {selectedEmotions.length > 0 && (
              <div className="mb-6">
                <h4 className={`text-sm font-medium mb-2 ${currentTheme.textColor}`}>
                  선택된 감정들:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEmotions.map(emotionKey => {
                    const emotion = EMOTION_META[emotionKey];
                    return (
                      <span
                        key={emotionKey}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${currentTheme.textColor}`}
                        style={{
                          backgroundColor: `${emotion.color}20`,
                          border: `1px solid ${emotion.color}50`
                        }}
                      >
                        {emotion.emoji} {emotion.name}
                      </span>
                    );
                  })}
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
                onClick={handleSaveDiary}
                disabled={!diaryContent.trim() || isSaving}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '저장 중...' : '일기 저장하기'}
              </ThemedButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EmotionDiaryModal; 