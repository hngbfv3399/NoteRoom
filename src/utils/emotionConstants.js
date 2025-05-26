/**
 * 감정 추적 시스템 상수 및 유틸리티
 * 
 * 주요 기능:
 * - 감정 타입 정의 및 관리
 * - 감정별 색상, 이모지, 설명 제공
 * - 감정 데이터 초기화 함수
 * - 감정 관련 헬퍼 함수들
 */

// 감정 타입 정의
export const EMOTION_TYPES = {
  JOY: 'joy',
  SADNESS: 'sadness', 
  ANGER: 'anger',
  EXCITED: 'excited',
  CALM: 'calm',
  STRESSED: 'stressed',
  GRATEFUL: 'grateful',
  ANXIOUS: 'anxious',
  CONFIDENT: 'confident',
  LONELY: 'lonely',
  HOPEFUL: 'hopeful',
  TIRED: 'tired',
};

// 감정별 메타데이터
export const EMOTION_META = {
  [EMOTION_TYPES.JOY]: {
    name: '기쁨',
    emoji: '😊',
    color: '#FFD700',
    bgColor: '#FFF9C4',
    description: '행복하고 즐거운 기분'
  },
  [EMOTION_TYPES.SADNESS]: {
    name: '슬픔',
    emoji: '😢',
    color: '#4A90E2',
    bgColor: '#E3F2FD',
    description: '우울하고 슬픈 기분'
  },
  [EMOTION_TYPES.ANGER]: {
    name: '화남',
    emoji: '😠',
    color: '#E74C3C',
    bgColor: '#FFEBEE',
    description: '화나고 짜증나는 기분'
  },
  [EMOTION_TYPES.EXCITED]: {
    name: '신남',
    emoji: '🤩',
    color: '#FF6B6B',
    bgColor: '#FFE0E0',
    description: '흥미롭고 신나는 기분'
  },
  [EMOTION_TYPES.CALM]: {
    name: '평온',
    emoji: '😌',
    color: '#2ECC71',
    bgColor: '#E8F5E8',
    description: '차분하고 평온한 기분'
  },
  [EMOTION_TYPES.STRESSED]: {
    name: '스트레스',
    emoji: '😰',
    color: '#E67E22',
    bgColor: '#FFF3E0',
    description: '스트레스받고 압박감을 느끼는 기분'
  },
  [EMOTION_TYPES.GRATEFUL]: {
    name: '감사',
    emoji: '🙏',
    color: '#9B59B6',
    bgColor: '#F3E5F5',
    description: '고마움을 느끼는 기분'
  },
  [EMOTION_TYPES.ANXIOUS]: {
    name: '불안',
    emoji: '😟',
    color: '#95A5A6',
    bgColor: '#F5F5F5',
    description: '걱정되고 불안한 기분'
  },
  [EMOTION_TYPES.CONFIDENT]: {
    name: '자신감',
    emoji: '💪',
    color: '#3498DB',
    bgColor: '#EBF3FD',
    description: '자신있고 당당한 기분'
  },
  [EMOTION_TYPES.LONELY]: {
    name: '외로움',
    emoji: '😔',
    color: '#7F8C8D',
    bgColor: '#F8F9FA',
    description: '외롭고 쓸쓸한 기분'
  },
  [EMOTION_TYPES.HOPEFUL]: {
    name: '희망적',
    emoji: '🌟',
    color: '#F39C12',
    bgColor: '#FEF9E7',
    description: '희망적이고 긍정적인 기분'
  },
  [EMOTION_TYPES.TIRED]: {
    name: '피곤함',
    emoji: '😴',
    color: '#8E44AD',
    bgColor: '#F4ECF7',
    description: '피곤하고 지친 기분'
  },
};

// 감정 분포 초기 데이터 생성
export const createEmotionDistribution = () => {
  const distribution = {};
  Object.values(EMOTION_TYPES).forEach(emotion => {
    distribution[emotion] = 0;
  });
  return distribution;
};

// 감정 추적 초기 데이터 생성
export const createEmotionTracking = () => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  return {
    dailyEmotions: [],
    monthlyStats: {},
    settings: {
      reminderTime: "21:00",
      reminderEnabled: true,
      lastReminder: null,
      monthlyResetDate: nextMonth.toISOString().split('T')[0]
    }
  };
};

// 감정 강도 레벨 정의
export const EMOTION_INTENSITY = {
  VERY_LOW: 1,
  LOW: 2,
  MILD: 3,
  MODERATE: 4,
  MEDIUM: 5,
  STRONG: 6,
  HIGH: 7,
  VERY_HIGH: 8,
  INTENSE: 9,
  EXTREME: 10
};

// 강도별 설명
export const INTENSITY_LABELS = {
  [EMOTION_INTENSITY.VERY_LOW]: '아주 약함',
  [EMOTION_INTENSITY.LOW]: '약함',
  [EMOTION_INTENSITY.MILD]: '조금',
  [EMOTION_INTENSITY.MODERATE]: '보통',
  [EMOTION_INTENSITY.MEDIUM]: '중간',
  [EMOTION_INTENSITY.STRONG]: '강함',
  [EMOTION_INTENSITY.HIGH]: '높음',
  [EMOTION_INTENSITY.VERY_HIGH]: '아주 높음',
  [EMOTION_INTENSITY.INTENSE]: '강렬함',
  [EMOTION_INTENSITY.EXTREME]: '극도로 강함'
};

// 감정 목록 가져오기 (정렬된)
export const getEmotionList = () => {
  return Object.values(EMOTION_TYPES).map(emotion => ({
    type: emotion,
    ...EMOTION_META[emotion]
  }));
};

// 특정 감정의 메타데이터 가져오기
export const getEmotionMeta = (emotionType) => {
  return EMOTION_META[emotionType] || null;
};

// 감정 강도 색상 계산 (1-10 강도에 따른 색상 농도)
export const getEmotionIntensityColor = (emotionType, intensity) => {
  const meta = EMOTION_META[emotionType];
  if (!meta) return '#CCCCCC';
  
  const opacity = Math.max(0.1, Math.min(1, intensity / 10));
  return `${meta.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

// 오늘 날짜 문자열 생성 (YYYY-MM-DD)
export const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

// 월 문자열 생성 (YYYY-MM)
export const getMonthString = (date = new Date()) => {
  return date.toISOString().slice(0, 7);
};

// 감정 기록 유효성 검사
export const validateEmotionRecord = (record) => {
  if (!record || typeof record !== 'object') return false;
  if (!record.date || !record.emotion || !record.intensity) return false;
  if (!Object.values(EMOTION_TYPES).includes(record.emotion)) return false;
  if (record.intensity < 1 || record.intensity > 10) return false;
  return true;
};

export default {
  EMOTION_TYPES,
  EMOTION_META,
  EMOTION_INTENSITY,
  INTENSITY_LABELS,
  createEmotionDistribution,
  createEmotionTracking,
  getEmotionList,
  getEmotionMeta,
  getEmotionIntensityColor,
  getTodayDateString,
  getMonthString,
  validateEmotionRecord
}; 