//src/utils/themeHelper.js

/**
 * 테마 관련 유틸리티 함수들
 * 
 * 기능:
 * - 테마 객체를 TailwindCSS 클래스 문자열로 변환
 * - 일반 컴포넌트와 모달 컴포넌트의 테마 클래스 생성
 * 
 * NOTE: Redux 테마 상태와 UI 컴포넌트 간의 브리지 역할
 */

/**
 * 테마 객체를 기본 컴포넌트용 CSS 클래스 문자열로 변환
 * @param {Object} theme - 테마 객체 (bgColor, textColor, fontStyle 포함)
 * @returns {string} 결합된 CSS 클래스 문자열
 */
export function getThemeClass(theme) {
    return `${theme.bgColor} ${theme.textColor} ${theme.fontStyle}`;
  }
  
/**
 * 모달 컴포넌트용 배경색 CSS 클래스 반환
 * @param {Object} theme - 테마 객체
 * @returns {string} 모달 배경색 CSS 클래스 (기본값: "bg-white")
 */
export function getModalThemeClass(theme) {
    return theme.modalBgColor || "bg-white";
  }
  