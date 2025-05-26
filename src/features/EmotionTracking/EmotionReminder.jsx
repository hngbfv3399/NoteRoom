/**
 * 감정 알림 시스템 컴포넌트
 * 
 * 주요 기능:
 * - 일일 감정 기록 알림
 * - 알림 설정 관리
 * - 자동 알림 스케줄링
 */
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import ThemedButton from '@/components/ui/ThemedButton';

function EmotionReminder({ onOpenEmotionModal }) {
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  
  const [showReminder, setShowReminder] = useState(false);
  const [reminderSettings, setReminderSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // 알림 설정 로딩
  useEffect(() => {
    const loadReminderSettings = async () => {
      if (!auth.currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const settings = userData.emotionTracking?.settings || {};
          setReminderSettings(settings);
          
          // 알림 표시 여부 확인
          checkShouldShowReminder(settings, userData.emotionTracking?.dailyEmotions || []);
        }
      } catch (error) {
        console.error('알림 설정 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReminderSettings();
  }, []);

  // 알림 표시 여부 확인
  const checkShouldShowReminder = (settings, dailyEmotions) => {
    if (!settings.reminderEnabled) return;

    const today = new Date().toISOString().split('T')[0];
    const hasRecordedToday = dailyEmotions.some(emotion => emotion.date === today);
    
    if (hasRecordedToday) {
      setShowReminder(false);
      return;
    }

    // 마지막 알림 시간 확인
    const lastReminder = settings.lastReminder;
    if (lastReminder) {
      const lastReminderDate = new Date(lastReminder.seconds * 1000);
      const lastReminderDay = lastReminderDate.toISOString().split('T')[0];
      
      // 오늘 이미 알림을 보여줬다면 표시하지 않음
      if (lastReminderDay === today) {
        setShowReminder(false);
        return;
      }
    }

    // 설정된 시간 확인
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const reminderTime = settings.reminderTime || '21:00';

    // 설정된 시간이 지났고 오늘 기록이 없으면 알림 표시
    if (currentTime >= reminderTime) {
      setShowReminder(true);
    }
  };

  // 알림 닫기
  const handleCloseReminder = async () => {
    setShowReminder(false);
    
    // 마지막 알림 시간 업데이트
    if (auth.currentUser) {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentEmotionTracking = userData.emotionTracking || {};
          
          const updatedEmotionTracking = {
            ...currentEmotionTracking,
            settings: {
              ...currentEmotionTracking.settings,
              lastReminder: new Date()
            }
          };

          await updateDoc(userRef, {
            emotionTracking: updatedEmotionTracking
          });
        }
      } catch (error) {
        console.error('알림 시간 업데이트 실패:', error);
      }
    }
  };

  // 감정 기록하기 버튼 클릭
  const handleRecordEmotion = () => {
    handleCloseReminder();
    onOpenEmotionModal();
  };

  // 알림 설정 토글
  const toggleReminder = async () => {
    if (!auth.currentUser || !reminderSettings) return;

    const newEnabled = !reminderSettings.reminderEnabled;
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentEmotionTracking = userData.emotionTracking || {};
        
        const updatedEmotionTracking = {
          ...currentEmotionTracking,
          settings: {
            ...currentEmotionTracking.settings,
            reminderEnabled: newEnabled
          }
        };

        await updateDoc(userRef, {
          emotionTracking: updatedEmotionTracking
        });
        
        setReminderSettings(prev => ({
          ...prev,
          reminderEnabled: newEnabled
        }));
        
        if (!newEnabled) {
          setShowReminder(false);
        }
      }
    } catch (error) {
      console.error('알림 설정 업데이트 실패:', error);
    }
  };

  // 알림 시간 변경
  const updateReminderTime = async (newTime) => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentEmotionTracking = userData.emotionTracking || {};
        
        const updatedEmotionTracking = {
          ...currentEmotionTracking,
          settings: {
            ...currentEmotionTracking.settings,
            reminderTime: newTime
          }
        };

        await updateDoc(userRef, {
          emotionTracking: updatedEmotionTracking
        });
        
        setReminderSettings(prev => ({
          ...prev,
          reminderTime: newTime
        }));
      }
    } catch (error) {
      console.error('알림 시간 업데이트 실패:', error);
    }
  };

  if (loading) return null;

  return (
    <>
      {/* 감정 기록 알림 팝업 */}
      {showReminder && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`${currentTheme.modalBgColor} rounded-lg shadow-lg border p-4 animate-in slide-in-from-right duration-300`}
               style={{ borderColor: currentTheme.textColor + '20' }}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">🎭</div>
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${currentTheme.textColor}`}>
                  오늘 기분이 어떠신가요?
                </h3>
                <p className={`text-sm mb-3 ${currentTheme.textColor} opacity-70`}>
                  하루를 마무리하며 오늘의 감정을 기록해보세요.
                </p>
                <div className="flex gap-2">
                  <ThemedButton
                    onClick={handleRecordEmotion}
                    className="text-sm px-3 py-1"
                  >
                    기록하기
                  </ThemedButton>
                  <button
                    onClick={handleCloseReminder}
                    className={`text-sm px-3 py-1 ${currentTheme.textColor} opacity-60 hover:opacity-100`}
                  >
                    나중에
                  </button>
                </div>
              </div>
              <button
                onClick={handleCloseReminder}
                className={`${currentTheme.textColor} opacity-40 hover:opacity-70`}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 알림 설정 패널 */}
      {reminderSettings && (
        <div className={`p-4 rounded-lg border ${currentTheme.bgColor}`}
             style={{ borderColor: currentTheme.textColor + '20' }}>
          <h4 className={`font-medium mb-3 ${currentTheme.textColor}`}>
            🔔 감정 기록 알림 설정
          </h4>
          
          <div className="space-y-3">
            {/* 알림 활성화/비활성화 */}
            <div className="flex items-center justify-between">
              <span className={`text-sm ${currentTheme.textColor}`}>일일 알림</span>
              <button
                onClick={toggleReminder}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  reminderSettings.reminderEnabled ? currentTheme.buttonBg : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    reminderSettings.reminderEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 알림 시간 설정 */}
            {reminderSettings.reminderEnabled && (
              <div className="flex items-center justify-between">
                <span className={`text-sm ${currentTheme.textColor}`}>알림 시간</span>
                <input
                  type="time"
                  value={reminderSettings.reminderTime || '21:00'}
                  onChange={(e) => updateReminderTime(e.target.value)}
                  className={`text-sm rounded px-2 py-1 ${currentTheme.inputBg} ${currentTheme.inputText} ${currentTheme.inputBorder}`}
                />
              </div>
            )}
          </div>

          <p className={`text-xs mt-3 ${currentTheme.textColor} opacity-60`}>
            설정된 시간에 감정 기록 알림을 받을 수 있습니다.
          </p>
        </div>
      )}
    </>
  );
}

export default EmotionReminder; 