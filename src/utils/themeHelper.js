//src/utils/themeHelper.js

/**
 * 테마 관련 유틸리티 함수들
 * 
 * 기능:
 * - 테마 객체를 TailwindCSS 클래스 문자열로 변환
 * - 안전한 테마 속성 접근 및 기본값 제공
 * - 다양한 컴포넌트 타입별 테마 클래스 생성
 * - 테마 유효성 검증
 * 
 * NOTE: Redux 테마 상태와 UI 컴포넌트 간의 브리지 역할
 */

// 기본 테마 설정
const DEFAULT_THEME = {
  bgColor: 'bg-white',
  textColor: 'text-gray-900',
  textSecondary: 'text-gray-600',
  fontStyle: 'font-sans',
  cardBg: 'bg-white',
  buttonBg: 'bg-blue-500',
  buttonText: 'text-white',
  inputBg: 'bg-white',
  inputBorder: 'border-gray-300',
  linkColor: 'text-blue-600',
  hoverBg: 'hover:bg-gray-100',
  borderColor: 'border-gray-200',
  dividerColor: 'border-gray-200',
  modalBgColor: 'bg-white',
  shadowColor: 'shadow-lg',
};

/**
 * 테마 속성의 유효성을 검증
 * @param {Object} theme - 검증할 테마 객체
 * @returns {boolean} 유효한 테마인지 여부
 */
export function validateTheme(theme) {
  if (!theme || typeof theme !== 'object') {
    return false;
  }

  // 필수 속성 확인
  const requiredProps = ['bgColor', 'textColor', 'fontStyle'];
  return requiredProps.every(prop => 
    Object.prototype.hasOwnProperty.call(theme, prop) && typeof theme[prop] === 'string'
  );
}

/**
 * 안전한 테마 속성 접근 함수
 * @param {Object} theme - 테마 객체
 * @param {string} property - 접근할 속성명
 * @param {string} fallback - 기본값 (선택사항)
 * @returns {string} 테마 속성값 또는 기본값
 */
export function getThemeProperty(theme, property, fallback = null) {
  if (!theme || typeof theme !== 'object') {
    return fallback || DEFAULT_THEME[property] || '';
  }

  return theme[property] || fallback || DEFAULT_THEME[property] || '';
}

/**
 * 테마 객체를 기본 컴포넌트용 CSS 클래스 문자열로 변환
 * @param {Object} theme - 테마 객체
 * @returns {string} 결합된 CSS 클래스 문자열
 */
export function getThemeClass(theme) {
  if (!validateTheme(theme)) {
    console.warn('Invalid theme provided, using default theme');
    theme = DEFAULT_THEME;
  }

  const bgColor = getThemeProperty(theme, 'bgColor');
  const textColor = getThemeProperty(theme, 'textColor');
  const fontStyle = getThemeProperty(theme, 'fontStyle');

  return `${bgColor} ${textColor} ${fontStyle}`.trim();
}

/**
 * 카드 컴포넌트용 테마 클래스 생성
 * @param {Object} theme - 테마 객체
 * @returns {string} 카드용 CSS 클래스 문자열
 */
export function getCardThemeClass(theme) {
  const cardBg = getThemeProperty(theme, 'cardBg');
  const textColor = getThemeProperty(theme, 'textColor');
  const borderColor = getThemeProperty(theme, 'borderColor');
  const shadowColor = getThemeProperty(theme, 'shadowColor');

  return `${cardBg} ${textColor} ${borderColor} ${shadowColor}`.trim();
}

/**
 * 버튼 컴포넌트용 테마 클래스 생성
 * @param {Object} theme - 테마 객체
 * @param {string} variant - 버튼 변형 ('primary', 'secondary', 'danger')
 * @returns {string} 버튼용 CSS 클래스 문자열
 */
export function getButtonThemeClass(theme, variant = 'primary') {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200';
  
  switch (variant) {
    case 'primary': {
      const buttonBg = getThemeProperty(theme, 'buttonBg');
      const buttonText = getThemeProperty(theme, 'buttonText');
      return `${baseClasses} ${buttonBg} ${buttonText} hover:opacity-90`.trim();
    }
    
    case 'secondary': {
      const borderColor = getThemeProperty(theme, 'borderColor');
      const textColor = getThemeProperty(theme, 'textColor');
      const hoverBg = getThemeProperty(theme, 'hoverBg');
      return `${baseClasses} border ${borderColor} ${textColor} ${hoverBg}`.trim();
    }
    
    case 'danger':
      return `${baseClasses} bg-red-500 text-white hover:bg-red-600`.trim();
    
    default:
      return getButtonThemeClass(theme, 'primary');
  }
}

/**
 * 입력 필드용 테마 클래스 생성
 * @param {Object} theme - 테마 객체
 * @returns {string} 입력 필드용 CSS 클래스 문자열
 */
export function getInputThemeClass(theme) {
  const inputBg = getThemeProperty(theme, 'inputBg');
  const inputBorder = getThemeProperty(theme, 'inputBorder');
  const textColor = getThemeProperty(theme, 'textColor');

  return `w-full px-3 py-2 rounded-lg border ${inputBg} ${inputBorder} ${textColor} focus:ring-2 focus:ring-blue-500 focus:border-transparent`.trim();
}

/**
 * 모달 컴포넌트용 배경색 CSS 클래스 반환
 * @param {Object} theme - 테마 객체
 * @returns {string} 모달 배경색 CSS 클래스
 */
export function getModalThemeClass(theme) {
  return getThemeProperty(theme, 'modalBgColor', 'bg-white');
}

/**
 * 링크 컴포넌트용 테마 클래스 생성
 * @param {Object} theme - 테마 객체
 * @returns {string} 링크용 CSS 클래스 문자열
 */
export function getLinkThemeClass(theme) {
  const linkColor = getThemeProperty(theme, 'linkColor');
  return `${linkColor} hover:underline transition-colors`.trim();
}

/**
 * 구분선용 테마 클래스 생성
 * @param {Object} theme - 테마 객체
 * @returns {string} 구분선용 CSS 클래스 문자열
 */
export function getDividerThemeClass(theme) {
  const dividerColor = getThemeProperty(theme, 'dividerColor');
  return `border-t ${dividerColor}`.trim();
}

/**
 * 텍스트 색상별 테마 클래스 생성
 * @param {Object} theme - 테마 객체
 * @param {string} type - 텍스트 타입 ('primary', 'secondary')
 * @returns {string} 텍스트용 CSS 클래스 문자열
 */
export function getTextThemeClass(theme, type = 'primary') {
  switch (type) {
    case 'primary':
      return getThemeProperty(theme, 'textColor');
    case 'secondary':
      return getThemeProperty(theme, 'textSecondary');
    default:
      return getThemeProperty(theme, 'textColor');
  }
}

/**
 * 호버 효과용 테마 클래스 생성
 * @param {Object} theme - 테마 객체
 * @returns {string} 호버 효과용 CSS 클래스 문자열
 */
export function getHoverThemeClass(theme) {
  const hoverBg = getThemeProperty(theme, 'hoverBg');
  return `${hoverBg} transition-colors cursor-pointer`.trim();
}

/**
 * 테마 기반 그라데이션 클래스 생성
 * @param {Object} theme - 테마 객체
 * @returns {string} 그라데이션 CSS 클래스 문자열
 */
export function getGradientThemeClass(theme) {
  // 테마의 주요 색상을 기반으로 그라데이션 생성
  const buttonBg = getThemeProperty(theme, 'buttonBg');
  
  // 간단한 그라데이션 매핑
  const gradientMap = {
    'bg-blue-500': 'bg-gradient-to-r from-blue-500 to-blue-600',
    'bg-green-500': 'bg-gradient-to-r from-green-500 to-green-600',
    'bg-purple-500': 'bg-gradient-to-r from-purple-500 to-purple-600',
    'bg-pink-500': 'bg-gradient-to-r from-pink-500 to-pink-600',
    'bg-indigo-500': 'bg-gradient-to-r from-indigo-500 to-indigo-600',
    'bg-teal-500': 'bg-gradient-to-r from-teal-500 to-teal-600',
  };

  return gradientMap[buttonBg] || 'bg-gradient-to-r from-blue-500 to-blue-600';
}

/**
 * 반응형 테마 클래스 생성
 * @param {Object} theme - 테마 객체
 * @param {Object} breakpoints - 반응형 설정 { sm: 'class', md: 'class', lg: 'class' }
 * @returns {string} 반응형 CSS 클래스 문자열
 */
export function getResponsiveThemeClass(theme, breakpoints = {}) {
  const baseClass = getThemeClass(theme);
  const responsiveClasses = Object.entries(breakpoints)
    .map(([breakpoint, className]) => `${breakpoint}:${className}`)
    .join(' ');

  return `${baseClass} ${responsiveClasses}`.trim();
}

/**
 * 다크모드 지원 테마 클래스 생성
 * @param {Object} lightTheme - 라이트 테마 객체
 * @param {Object} darkTheme - 다크 테마 객체
 * @returns {string} 다크모드 지원 CSS 클래스 문자열
 */
export function getDarkModeThemeClass(lightTheme, darkTheme) {
  const lightClass = getThemeClass(lightTheme);
  const darkClass = getThemeClass(darkTheme);
  
  // 다크모드 클래스에 dark: 접두사 추가
  const darkModeClass = darkClass
    .split(' ')
    .map(cls => `dark:${cls}`)
    .join(' ');

  return `${lightClass} ${darkModeClass}`.trim();
}

/**
 * 테마 디버깅 정보 출력
 * @param {Object} theme - 테마 객체
 */
export function debugTheme(theme) {
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    console.group('🎨 Theme Debug Info');
    console.log('Theme Object:', theme);
    console.log('Is Valid:', validateTheme(theme));
    console.log('Generated Classes:', getThemeClass(theme));
    console.log('Card Classes:', getCardThemeClass(theme));
    console.log('Button Classes:', getButtonThemeClass(theme));
    console.groupEnd();
  }
}

// 기본 내보내기
export default {
  validateTheme,
  getThemeProperty,
  getThemeClass,
  getCardThemeClass,
  getButtonThemeClass,
  getInputThemeClass,
  getModalThemeClass,
  getLinkThemeClass,
  getDividerThemeClass,
  getTextThemeClass,
  getHoverThemeClass,
  getGradientThemeClass,
  getResponsiveThemeClass,
  getDarkModeThemeClass,
  debugTheme,
  DEFAULT_THEME,
};
  