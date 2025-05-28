/**
 * 감정 통계 대시보드 컴포넌트
 * 
 * 주요 기능:
 * - 감정 분포 차트
 * - 월별 감정 통계
 * - 최근 감정 기록
 * - 감정 트렌드 분석
 */
import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useSelector } from 'react-redux';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import { EMOTION_TYPES, EMOTION_META } from '@/utils/emotionConstants';
import ThemedButton from '@/components/ui/ThemedButton';

const EmotionDashboard = forwardRef((props, ref) => {
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  
  const [emotionData, setEmotionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, all

  // 감정 데이터 로딩 함수
  const loadEmotionData = async () => {
    if (!auth.currentUser) {
      console.log('🔍 [EmotionDashboard] 사용자 인증 없음');
      return;
    }

    console.log('📥 [EmotionDashboard] 감정 데이터 로딩 시작');
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('📊 [EmotionDashboard] 로드된 사용자 데이터:', userData);
        
        const emotionDataToSet = {
          distribution: userData.emotionDistribution || {},
          tracking: userData.emotionTracking || { dailyEmotions: [] }
        };
        
        console.log('🎭 [EmotionDashboard] 설정할 감정 데이터:', emotionDataToSet);
        setEmotionData(emotionDataToSet);
      } else {
        console.warn('⚠️ [EmotionDashboard] 사용자 문서가 존재하지 않음');
      }
    } catch (error) {
      console.error('❌ [EmotionDashboard] 감정 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
      console.log('🏁 [EmotionDashboard] 로딩 완료');
    }
  };

  // 외부에서 호출할 수 있는 새로고침 함수
  const refreshData = async () => {
    setLoading(true);
    await loadEmotionData();
  };

  // ref를 통해 외부에서 refreshData 함수에 접근할 수 있도록 설정
  useImperativeHandle(ref, () => ({
    refreshData
  }));

  // 감정 데이터 로딩
  useEffect(() => {
    loadEmotionData();
  }, []);

  // 기간별 감정 데이터 필터링
  const getFilteredEmotions = () => {
    if (!emotionData?.tracking?.dailyEmotions) return [];

    const now = new Date();
    const emotions = emotionData.tracking.dailyEmotions
      .filter(emotion => {
        // 감정 일기인 경우 (type: 'diary')
        if (emotion.type === 'diary') {
          return true; // 감정 일기는 emotions 배열을 가지므로 별도 처리
        }
        // 대표 감정인 경우
        return emotion.emotion && EMOTION_META[emotion.emotion];
      });

    switch (selectedPeriod) {
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return emotions.filter(emotion => new Date(emotion.date) >= weekAgo);
      }
      case 'month': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return emotions.filter(emotion => new Date(emotion.date) >= monthAgo);
      }
      default:
        return emotions;
    }
  };

  // 감정 일기 기반 통계 계산
  const getEmotionStats = () => {
    console.log('📊 [EmotionDashboard] 감정 일기 통계 계산 시작');
    console.log('📊 [EmotionDashboard] dailyEmotions:', emotionData?.tracking?.dailyEmotions);
    
    const stats = {};
    const dailyEmotions = emotionData?.tracking?.dailyEmotions || [];

    Object.keys(EMOTION_META).forEach(emotion => {
      // 감정 일기에서 해당 감정이 포함된 기록들 찾기
      const emotionRecords = dailyEmotions.filter(record => {
        if (record.type === 'diary') {
          // 감정 일기의 경우 emotions 배열에서 확인
          return record.emotions && record.emotions.includes(emotion);
        }
        return false; // 대표 감정은 더 이상 사용하지 않음
      });

      // 평균 강도 계산 (감정 일기의 intensity 사용)
      const avgIntensity = emotionRecords.length > 0 ? 
        Math.round(emotionRecords.reduce((sum, record) => sum + (record.intensity || 0), 0) / emotionRecords.length) : 0;

      stats[emotion] = {
        count: emotionRecords.length,
        avgIntensity: avgIntensity,
        totalIntensity: avgIntensity // 감정 일기만 사용하므로 평균 강도가 총 강도
      };

      console.log(`📊 [EmotionDashboard] ${emotion}:`, {
        count: emotionRecords.length,
        avgIntensity: avgIntensity,
        recordsCount: emotionRecords.length
      });
    });

    return stats;
  };



  if (loading) {
    return (
      <div className={`p-6 rounded-lg shadow animate-pulse ${currentTheme.modalBgColor}`}>
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const emotionStats = getEmotionStats();
  const filteredEmotions = getFilteredEmotions();
  
  // 전체 감정 기록이 있는지 확인
  const hasAnyEmotionRecords = emotionData?.tracking?.dailyEmotions?.length > 0;

  return (
    <div className="space-y-6">
      {/* 헤더 - 모바일 최적화 */}
      <div className="text-center">
        <h2 className={`text-xl sm:text-2xl font-bold ${currentTheme.textColor}`}>
          📝 감정 일기 대시보드
        </h2>
        <p className={`text-sm ${currentTheme.textColor} opacity-70 mt-2`}>
          감정 일기를 통해 나만의 감정 패턴을 발견해보세요
        </p>
      </div>

      {/* 감정 기록이 있을 때만 기간 선택과 분포 그리드 표시 */}
      {hasAnyEmotionRecords && (
        <>
          {/* 기간 선택 - 모바일 최적화 */}
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {[
              { key: 'week', label: '최근 1주일' },
              { key: 'month', label: '최근 1개월' },
              { key: 'all', label: '전체' }
            ].map(period => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  selectedPeriod === period.key
                    ? `${currentTheme.buttonBg} ${currentTheme.buttonText}`
                    : `${currentTheme.modalBgColor} ${currentTheme.textColor} opacity-70 hover:opacity-100`
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* 감정 분포 그리드 - 모바일 최적화 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {Object.entries(EMOTION_META).map(([key, emotion]) => {
              const stats = emotionStats[key];
              const intensity = stats.totalIntensity;
              const count = stats.count;
              
              return (
                <div
                  key={key}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${currentTheme.modalBgColor}`}
                  style={{
                    borderColor: intensity > 0 ? emotion.color : currentTheme.textColor + '20',
                    backgroundColor: intensity > 0 ? `${emotion.color}10` : currentTheme.modalBgColor
                  }}
                >
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{emotion.emoji}</div>
                    <div className={`text-xs sm:text-sm font-medium mb-1 ${currentTheme.textColor}`}>
                      {emotion.name}
                    </div>
                    <div className={`text-xs ${currentTheme.textColor} opacity-70`}>
                      강도: {intensity}/10
                    </div>
                    <div className={`text-xs ${currentTheme.textColor} opacity-60`}>
                      {count}회 기록
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 최근 감정 기록 */}
      {filteredEmotions.length > 0 && (
        <div className={`p-6 rounded-lg shadow ${currentTheme.modalBgColor}`}>
          <h3 className={`text-lg font-semibold mb-4 ${currentTheme.textColor}`}>
            최근 감정 기록
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {filteredEmotions
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 10)
              .map((emotion, index) => {
                // 감정 일기인 경우
                if (emotion.type === 'diary') {
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${currentTheme.bgColor} hover:opacity-80`}
                    >
                      <span className="text-2xl">📝</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${currentTheme.textColor}`}>
                            감정 일기
                          </span>
                          <span className={`text-sm ${currentTheme.textColor} opacity-60`}>
                            강도 {emotion.intensity}/10
                          </span>
                        </div>
                        <div className={`text-sm ${currentTheme.textColor} opacity-70`}>
                          {new Date(emotion.date).toLocaleDateString('ko-KR')} {emotion.time}
                        </div>
                        {emotion.emotions && emotion.emotions.length > 0 && (
                          <div className={`text-sm ${currentTheme.textColor} opacity-80 mt-1`}>
                            감정: {emotion.emotions.map(e => EMOTION_META[e]?.name || e).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                
                // 대표 감정인 경우
                if (!emotion.emotion || !EMOTION_META[emotion.emotion]) {
                  console.warn('유효하지 않은 감정 타입:', emotion.emotion);
                  return null;
                }
                
                const emotionType = EMOTION_META[emotion.emotion];
                
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${currentTheme.bgColor} hover:opacity-80`}
                  >
                    <span className="text-2xl">{emotionType.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${currentTheme.textColor}`}>
                          {emotionType.name}
                        </span>
                        <span className={`text-sm ${currentTheme.textColor} opacity-60`}>
                          강도 {emotion.intensity}/10
                        </span>
                      </div>
                      <div className={`text-sm ${currentTheme.textColor} opacity-70`}>
                        {new Date(emotion.date).toLocaleDateString('ko-KR')}
                      </div>
                      {emotion.note && (
                        <div className={`text-sm ${currentTheme.textColor} opacity-80 mt-1`}>
                          "{emotion.note}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 빈 상태 - 감정 기록이 전혀 없을 때 */}
      {!hasAnyEmotionRecords && (
        <div className={`text-center py-12 ${currentTheme.modalBgColor} rounded-lg`}>
          <div className="text-6xl mb-4">📝</div>
          <h3 className={`text-xl font-semibold mb-2 ${currentTheme.textColor}`}>
            아직 감정 일기가 없습니다
          </h3>
          <p className={`mb-6 ${currentTheme.textColor} opacity-70`}>
            첫 번째 감정 일기를 작성해서 나만의 감정 여행을 시작해보세요!
          </p>
          <p className={`text-sm ${currentTheme.textColor} opacity-60 mb-6`}>
            감정 일기는 암호화되어 안전하게 보관됩니다.
          </p>
        </div>
      )}
    </div>
  );
});

EmotionDashboard.displayName = 'EmotionDashboard';

export default EmotionDashboard; 