/**
 * 날짜 관련 유틸리티 함수들
 * 
 * 기능:
 * - Firebase Timestamp와 일반 Date 객체 처리
 * - 다양한 날짜 포맷 제공
 * - 에러 처리 포함
 * 
 * NOTE: dayjs를 사용하여 일관된 날짜 처리
 */
import dayjs from 'dayjs';

/**
 * Firebase Timestamp 또는 Date 객체를 포맷된 문자열로 변환
 * @param {Object|Date|string} dateValue - 변환할 날짜 값
 * @param {string} format - 날짜 포맷 (기본: "YY.MM.DD HH:mm")
 * @returns {string} 포맷된 날짜 문자열
 */
export const formatDate = (dateValue, format = "YY.MM.DD HH:mm") => {
  if (!dateValue) return "";

  try {
    // Firebase Timestamp 객체인 경우
    if (typeof dateValue.toDate === "function") {
      return dayjs(dateValue.toDate()).format(format);
    }
    
    // 일반 Date 객체나 문자열인 경우
    return dayjs(dateValue).format(format);
  } catch (error) {
    console.error("Date formatting error:", error);
    return "날짜 없음";
  }
};

/**
 * 상대적 시간 표시 (예: "3분 전", "2시간 전")
 * @param {Object|Date|string} dateValue - 변환할 날짜 값
 * @returns {string} 상대적 시간 문자열
 */
export const formatRelativeTime = (dateValue) => {
  if (!dateValue) return "";

  try {
    let date;
    if (typeof dateValue.toDate === "function") {
      date = dayjs(dateValue.toDate());
    } else {
      date = dayjs(dateValue);
    }

    const now = dayjs();
    const diffInMinutes = now.diff(date, 'minute');
    const diffInHours = now.diff(date, 'hour');
    const diffInDays = now.diff(date, 'day');

    if (diffInMinutes < 1) return "방금 전";
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    // 일주일 이상은 날짜로 표시
    return date.format("MM.DD");
  } catch (error) {
    console.error("Relative time formatting error:", error);
    return "알 수 없음";
  }
};

/**
 * 날짜가 오늘인지 확인
 * @param {Object|Date|string} dateValue - 확인할 날짜 값
 * @returns {boolean} 오늘 여부
 */
export const isToday = (dateValue) => {
  if (!dateValue) return false;

  try {
    let date;
    if (typeof dateValue.toDate === "function") {
      date = dayjs(dateValue.toDate());
    } else {
      date = dayjs(dateValue);
    }

    return date.isSame(dayjs(), 'day');
  } catch (error) {
    console.error("Date comparison error:", error);
    return false;
  }
}; 