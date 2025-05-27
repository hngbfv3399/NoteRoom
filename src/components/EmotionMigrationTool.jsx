/**
 * 감정 추적 데이터 추가 도구 컴포넌트
 * 
 * 주요 기능:
 * - 현재 사용자의 감정 추적 데이터 확인
 * - 없는 경우 추가 버튼 제공
 * - 추가 완료 후 상태 업데이트
 * 
 * NOTE: 기존 사용자들이 감정 추적 기능을 사용할 수 있도록 하는 임시 도구
 */
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { createEmotionDistribution, createEmotionTracking } from '@/utils/emotionConstants';
import { useSelector } from 'react-redux';

function EmotionMigrationTool() {
  const [hasEmotionData, setHasEmotionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);

  // 테마 상태
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // 현재 사용자의 감정 데이터 확인
  useEffect(() => {
    const checkEmotionData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const hasData = userData.emotionTracking && userData.emotionDistribution;
          setHasEmotionData(hasData);
        } else {
          setError('사용자 정보를 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('감정 데이터 확인 실패:', error);
        setError('데이터 확인 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    checkEmotionData();
  }, []);

  // 감정 추적 데이터 추가
  const handleAddEmotionData = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        setError('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      const userData = userDoc.data();
      const updateData = {};

      // emotionDistribution이 없는 경우 추가
      if (!userData.emotionDistribution) {
        updateData.emotionDistribution = createEmotionDistribution();
      }

      // emotionTracking이 없는 경우 추가
      if (!userData.emotionTracking) {
        updateData.emotionTracking = createEmotionTracking();
      }

      // 업데이트할 데이터가 있는 경우에만 실행
      if (Object.keys(updateData).length > 0) {
        await updateDoc(userDocRef, updateData);
        setHasEmotionData(true);
      } else {
        setHasEmotionData(true);
      }

    } catch (error) {
      console.error('감정 데이터 추가 실패:', error);
      setError('데이터 추가 중 오류가 발생했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={`p-4 rounded-lg border ${currentTheme?.cardBg || 'bg-white'} ${currentTheme?.borderColor || 'border-gray-200'}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className={currentTheme?.textSecondary || 'text-gray-600'}>
            감정 추적 데이터 확인 중...
          </span>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={`p-4 rounded-lg border border-red-200 bg-red-50`}>
        <div className="flex items-center space-x-2">
          <span className="text-red-600">⚠️</span>
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  // 이미 감정 데이터가 있는 경우
  if (hasEmotionData) {
    return (
      <div className={`p-4 rounded-lg border border-green-200 bg-green-50`}>
        <div className="flex items-center space-x-2">
          <span className="text-green-600">✅</span>
          <span className="text-green-700">
            감정 추적 기능이 이미 활성화되어 있습니다!
          </span>
        </div>
        <p className="text-green-600 text-sm mt-2">
          이제 일일 감정 기록과 통계를 확인할 수 있습니다.
        </p>
      </div>
    );
  }

  // 감정 데이터가 없는 경우 - 추가 버튼 표시
  return (
    <div className={`p-6 rounded-lg border ${currentTheme?.cardBg || 'bg-white'} ${currentTheme?.borderColor || 'border-gray-200'}`}>
      <div className="text-center">
        <div className="text-4xl mb-4">🎭</div>
        <h3 className={`text-lg font-semibold mb-2 ${currentTheme?.textPrimary || 'text-gray-900'}`}>
          감정 추적 기능 활성화
        </h3>
        <p className={`text-sm mb-4 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
          새로운 감정 추적 기능을 사용하려면 데이터를 추가해야 합니다.
        </p>
        
        <div className={`p-4 rounded-lg mb-4 ${currentTheme?.bgSecondary || 'bg-gray-50'}`}>
          <h4 className={`font-medium mb-2 ${currentTheme?.textPrimary || 'text-gray-900'}`}>
            추가될 기능:
          </h4>
          <ul className={`text-sm space-y-1 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
            <li>• 12가지 감정 타입 추적 (기쁨, 슬픔, 화남, 신남, 평온, 스트레스, 감사, 불안, 자신감, 외로움, 희망적, 피곤함)</li>
            <li>• 일일 감정 기록 및 강도 측정</li>
            <li>• 월간 감정 통계 및 그래프</li>
            <li>• 감정 알림 설정</li>
          </ul>
        </div>

        <button
          onClick={handleAddEmotionData}
          disabled={isAdding}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            isAdding 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:shadow-lg'
          } ${currentTheme?.buttonBg || 'bg-purple-500'} ${currentTheme?.buttonText || 'text-white'}`}
        >
          {isAdding ? (
            <span className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>데이터 추가 중...</span>
            </span>
          ) : (
            '🎭 감정 추적 기능 활성화하기'
          )}
        </button>
      </div>
    </div>
  );
}

export default EmotionMigrationTool; 