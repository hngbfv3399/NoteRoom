/**
 * AI 감정 분석 모달 컴포넌트
 * 
 * 주요 기능:
 * - 월별 감정 데이터 AI 분석 결과 표시
 * - 감정 점수 시각화
 * - 개인화된 조언 및 인사이트 제공
 * - 다음 달 목표 제안
 */
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getModalThemeClass } from '@/utils/themeHelper';
import { analyzeMonthlyEmotions, getBasicEmotionAnalysis, isGeminiAPIAvailable } from '@/services/geminiAI';
import ModalOne from '@/features/MainHome/ModalOne';
import ThemedButton from '@/components/ui/ThemedButton';

function EmotionAnalysisModal({ isOpen, onClose, emotionData, monthlyStats }) {
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const modalBgClass = getModalThemeClass(currentTheme);

  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // 모달이 열릴 때 분석 시작
  useEffect(() => {
    if (isOpen && !analysisResult) {
      performAnalysis();
    }
  }, [isOpen]);

  // AI 분석 수행
  const performAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      let result;
      
      if (isGeminiAPIAvailable()) {
        console.log('🤖 Gemini AI로 감정 분석 시작...');
        result = await analyzeMonthlyEmotions(emotionData, monthlyStats);
      } else {
        console.log('📊 기본 감정 분석 수행...');
        result = getBasicEmotionAnalysis(emotionData);
      }

      if (result.success) {
        setAnalysisResult(result.data);
      } else {
        setError(result.error || '분석 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('감정 분석 실패:', err);
      setError('분석 서비스에 연결할 수 없습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 모달 닫기 시 상태 초기화
  const handleClose = () => {
    setAnalysisResult(null);
    setError(null);
    onClose();
  };

  // 감정 점수에 따른 색상 반환
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // 감정 점수에 따른 이모지 반환
  const getScoreEmoji = (score) => {
    if (score >= 80) return '😊';
    if (score >= 60) return '😐';
    return '😔';
  };

  return (
    <ModalOne isOpen={isOpen} onClose={handleClose}>
      <div className={`max-w-4xl mx-auto p-6 rounded-lg ${modalBgClass} max-h-[90vh] overflow-y-auto`}>
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <h2 className={`text-2xl font-bold ${currentTheme.textColor}`}>
              AI 월별 감정 분석
            </h2>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg hover:bg-opacity-20 hover:bg-gray-500 transition-colors ${currentTheme.textColor}`}
          >
            ✕
          </button>
        </div>

        {/* 로딩 상태 */}
        {isAnalyzing && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className={`${currentTheme.textColor} opacity-70`}>
              AI가 당신의 감정 패턴을 분석하고 있습니다...
            </p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">😔</span>
            <p className={`${currentTheme.textColor} mb-4`}>
              {error}
            </p>
            <ThemedButton onClick={performAnalysis}>
              다시 시도
            </ThemedButton>
          </div>
        )}

        {/* 분석 결과 */}
        {analysisResult && (
          <div className="space-y-6">
            {/* 감정 점수 */}
            <div className={`text-center p-6 rounded-lg ${currentTheme.cardBg} border ${currentTheme.borderColor}`}>
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-4xl">{getScoreEmoji(analysisResult.emotionScore)}</span>
                <span className={`text-4xl font-bold ${getScoreColor(analysisResult.emotionScore)}`}>
                  {analysisResult.emotionScore}
                </span>
                <span className={`text-2xl ${currentTheme.textColor} opacity-70`}>/100</span>
              </div>
              <p className={`text-lg ${currentTheme.textColor} opacity-80`}>
                이번 달 감정 건강 점수
              </p>
            </div>

            {/* 요약 */}
            <div className={`p-6 rounded-lg ${currentTheme.cardBg} border ${currentTheme.borderColor}`}>
              <h3 className={`text-lg font-semibold mb-3 ${currentTheme.textColor} flex items-center gap-2`}>
                <span>📋</span> 한 줄 요약
              </h3>
              <p className={`${currentTheme.textColor} opacity-90 text-lg`}>
                {analysisResult.summary}
              </p>
            </div>

            {/* 감정 패턴 분석 */}
            <div className={`p-6 rounded-lg ${currentTheme.cardBg} border ${currentTheme.borderColor}`}>
              <h3 className={`text-lg font-semibold mb-3 ${currentTheme.textColor} flex items-center gap-2`}>
                <span>📊</span> 감정 패턴 분석
              </h3>
              <p className={`${currentTheme.textColor} opacity-90 leading-relaxed`}>
                {analysisResult.patterns}
              </p>
            </div>

            {/* 긍정적 요소 & 개선 포인트 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-lg ${currentTheme.cardBg} border ${currentTheme.borderColor}`}>
                <h3 className={`text-lg font-semibold mb-3 ${currentTheme.textColor} flex items-center gap-2`}>
                  <span>✨</span> 긍정적 요소
                </h3>
                <p className={`${currentTheme.textColor} opacity-90 leading-relaxed`}>
                  {analysisResult.positives}
                </p>
              </div>

              <div className={`p-6 rounded-lg ${currentTheme.cardBg} border ${currentTheme.borderColor}`}>
                <h3 className={`text-lg font-semibold mb-3 ${currentTheme.textColor} flex items-center gap-2`}>
                  <span>🎯</span> 개선 포인트
                </h3>
                <p className={`${currentTheme.textColor} opacity-90 leading-relaxed`}>
                  {analysisResult.improvements}
                </p>
              </div>
            </div>

            {/* 실용적 조언 */}
            <div className={`p-6 rounded-lg ${currentTheme.cardBg} border ${currentTheme.borderColor}`}>
              <h3 className={`text-lg font-semibold mb-4 ${currentTheme.textColor} flex items-center gap-2`}>
                <span>💡</span> 실용적 조언
              </h3>
              <div className="space-y-3">
                {analysisResult.advice.map((advice, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${currentTheme.buttonBg} ${currentTheme.buttonText}`}>
                      {index + 1}
                    </span>
                    <p className={`${currentTheme.textColor} opacity-90 leading-relaxed flex-1`}>
                      {advice}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 다음 달 목표 */}
            <div className={`p-6 rounded-lg ${currentTheme.cardBg} border ${currentTheme.borderColor}`}>
              <h3 className={`text-lg font-semibold mb-3 ${currentTheme.textColor} flex items-center gap-2`}>
                <span>🎯</span> 다음 달 목표
              </h3>
              <p className={`${currentTheme.textColor} opacity-90 leading-relaxed text-lg`}>
                {analysisResult.nextGoal}
              </p>
            </div>

            {/* API 정보 */}
            <div className={`text-center text-sm ${currentTheme.textColor} opacity-50`}>
              {isGeminiAPIAvailable() ? (
                <p>🤖 Powered by Google Gemini AI</p>
              ) : (
                <p>📊 기본 분석 모드 (Gemini API 키를 설정하면 더 상세한 분석을 받을 수 있습니다)</p>
              )}
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <ThemedButton
            onClick={handleClose}
            variant="secondary"
          >
            닫기
          </ThemedButton>
          {analysisResult && (
            <ThemedButton
              onClick={performAnalysis}
              disabled={isAnalyzing}
            >
              다시 분석하기
            </ThemedButton>
          )}
        </div>
      </div>
    </ModalOne>
  );
}

export default EmotionAnalysisModal; 