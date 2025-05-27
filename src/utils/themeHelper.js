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

/**
 * 테마 클래스를 조합하여 반환하는 헬퍼 함수들
 */

// 기본 배경 및 텍스트 조합
export const getPageTheme = (theme) => {
  return `${theme.bgColor} ${theme.textColor} ${theme.fontStyle}`;
};

// 카드/모달 테마 조합
export const getCardTheme = (theme) => {
  return `${theme.cardBg} ${theme.textColor} ${theme.borderColor} ${theme.shadowColor}`;
};

// 모달 테마 조합
export const getModalTheme = (theme) => {
  return `${theme.modalBgColor} ${theme.textColor} ${theme.borderColor} ${theme.shadowColor}`;
};

// 버튼 테마 조합
export const getButtonTheme = (theme, variant = 'primary') => {
  const baseClasses = `${theme.buttonBg} ${theme.buttonText} ${theme.buttonHover}`;
  
  switch (variant) {
    case 'secondary':
      return `${theme.cardBg} ${theme.textColor} ${theme.borderColor} hover:${theme.hoverBg}`;
    case 'success':
      return `bg-green-600 text-white hover:bg-green-700`;
    case 'error':
      return `bg-red-600 text-white hover:bg-red-700`;
    case 'warning':
      return `bg-yellow-600 text-white hover:bg-yellow-700`;
    case 'info':
      return `bg-blue-600 text-white hover:bg-blue-700`;
    default:
      return baseClasses;
  }
};

// 입력 필드 테마 조합
export const getInputTheme = (theme) => {
  return `${theme.inputBg} ${theme.inputText} ${theme.inputBorder} ${theme.inputFocus}`;
};

// 링크 테마
export const getLinkTheme = (theme) => {
  return `${theme.linkColor} hover:underline`;
};

// 상태별 텍스트 색상
export const getStatusTextTheme = (theme, status) => {
  switch (status) {
    case 'success':
      return theme.successColor || 'text-green-600';
    case 'error':
      return theme.errorColor || 'text-red-600';
    case 'warning':
      return theme.warningColor || 'text-yellow-600';
    case 'info':
      return theme.infoColor || 'text-blue-600';
    default:
      return theme.textColor;
  }
};

// 상태별 배경 색상
export const getStatusBgTheme = (theme, status) => {
  switch (status) {
    case 'success':
      return theme.successBg || 'bg-green-50';
    case 'error':
      return theme.errorBg || 'bg-red-50';
    case 'warning':
      return theme.warningBg || 'bg-yellow-50';
    case 'info':
      return theme.infoBg || 'bg-blue-50';
    default:
      return theme.cardBg;
  }
};

// 그라데이션 테마
export const getGradientTheme = (theme, type = 'bg') => {
  switch (type) {
    case 'text':
      return theme.gradientText || 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent';
    case 'bg':
    default:
      return theme.gradientBg || 'bg-gradient-to-r from-blue-50 to-indigo-50';
  }
};

// 구분선 테마
export const getDividerTheme = (theme) => {
  return theme.dividerColor || theme.borderColor || 'border-gray-200';
};

// 호버 효과 테마
export const getHoverTheme = (theme) => {
  return theme.hoverBg || 'hover:bg-gray-100';
};

// 복합 테마 조합 (자주 사용되는 조합들)
export const getContainerTheme = (theme) => {
  return `${getPageTheme(theme)} min-h-screen transition-colors duration-200`;
};

export const getContentCardTheme = (theme) => {
  return `${getCardTheme(theme)} rounded-lg p-6 transition-all duration-200`;
};

export const getHeaderTheme = (theme) => {
  return `${theme.cardBg} ${theme.textColor} ${theme.borderColor} shadow-sm`;
};

export const getNavigationTheme = (theme) => {
  return `${theme.cardBg} ${theme.textColor} ${theme.borderColor}`;
};

// 반응형 테마 적용
export const getResponsiveTheme = (theme, breakpoint = 'base') => {
  const baseTheme = getPageTheme(theme);
  
  switch (breakpoint) {
    case 'mobile':
      return `${baseTheme} px-4 py-2`;
    case 'tablet':
      return `${baseTheme} px-6 py-4`;
    case 'desktop':
      return `${baseTheme} px-8 py-6`;
    default:
      return baseTheme;
  }
};

// 애니메이션과 함께 테마 적용
export const getAnimatedTheme = (theme, animation = 'fade') => {
  const baseTheme = getPageTheme(theme);
  
  switch (animation) {
    case 'slide':
      return `${baseTheme} transform transition-all duration-300 ease-in-out`;
    case 'scale':
      return `${baseTheme} transform transition-transform duration-200 hover:scale-105`;
    case 'fade':
    default:
      return `${baseTheme} transition-opacity duration-300`;
  }
};

// 테마별 아이콘 색상
export const getIconTheme = (theme, variant = 'default') => {
  switch (variant) {
    case 'primary':
      return theme.linkColor || 'text-blue-600';
    case 'secondary':
      return theme.textSecondary || 'text-gray-500';
    case 'success':
      return theme.successColor || 'text-green-600';
    case 'error':
      return theme.errorColor || 'text-red-600';
    case 'warning':
      return theme.warningColor || 'text-yellow-600';
    case 'info':
      return theme.infoColor || 'text-blue-600';
    default:
      return theme.textColor || 'text-gray-800';
  }
};

// 테마 전환 애니메이션
export const getThemeTransition = () => {
  return 'transition-all duration-300 ease-in-out';
};

// 다크모드 감지 및 자동 테마 적용
export const getAutoTheme = (themes, prefersDark = false) => {
  if (prefersDark && themes.dark) {
    return themes.dark;
  }
  return themes.modern || Object.values(themes)[0];
};

// 접근성을 고려한 테마 적용
export const getAccessibleTheme = (theme, highContrast = false) => {
  if (highContrast) {
    return {
      ...theme,
      textColor: 'text-black',
      bgColor: 'bg-white',
      borderColor: 'border-black',
    };
  }
  return theme;
};

// 비활성화 상태 테마
export const getDisabledTheme = (theme) => {
  return `${theme.disabledBg || 'bg-gray-100'} ${theme.disabledText || 'text-gray-400'} ${theme.disabledBorder || 'border-gray-200'} cursor-not-allowed`;
};

// 선택 영역 테마
export const getSelectionTheme = (theme) => {
  return `${theme.selectionBg || 'selection:bg-blue-200'} ${theme.selectionText || 'selection:text-blue-900'}`;
};

// 포커스 링 테마
export const getFocusRingTheme = (theme) => {
  return theme.focusRing || 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
};

// 스크롤바 테마
export const getScrollbarTheme = (theme) => {
  return `${theme.scrollbarTrack || 'scrollbar-track-gray-100'} ${theme.scrollbarThumb || 'scrollbar-thumb-gray-300'} ${theme.scrollbarThumbHover || 'scrollbar-thumb-gray-400'}`;
};

// 스켈레톤/로딩 테마
export const getSkeletonTheme = (theme) => {
  return {
    background: theme.skeletonBg || 'bg-gray-200',
    shimmer: theme.skeletonShimmer || 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200'
  };
};

// 오버레이 테마
export const getOverlayTheme = (theme) => {
  return `${theme.overlayBg || 'bg-black/50'} ${theme.backdropBlur || 'backdrop-blur-sm'}`;
};

// 활성 상태 테마
export const getActiveTheme = (theme) => {
  return `${theme.activeBg || 'bg-blue-100'} ${theme.activeText || 'text-blue-700'} ${theme.activeBorder || 'border-blue-300'}`;
};

// 복합 입력 필드 테마 (포커스 링 포함)
export const getEnhancedInputTheme = (theme) => {
  return `${getInputTheme(theme)} ${getFocusRingTheme(theme)} ${getSelectionTheme(theme)}`;
};

// 복합 버튼 테마 (포커스 링 포함)
export const getEnhancedButtonTheme = (theme, variant = 'primary') => {
  return `${getButtonTheme(theme, variant)} ${getFocusRingTheme(theme)} transition-all duration-200`;
};

// 인터랙티브 카드 테마
export const getInteractiveCardTheme = (theme) => {
  return `${getCardTheme(theme)} ${getHoverTheme(theme)} cursor-pointer transition-all duration-200 hover:scale-[1.02]`;
};

// 모달 컨테이너 테마 (오버레이 포함)
export const getModalContainerTheme = (theme) => {
  return {
    overlay: getOverlayTheme(theme),
    modal: `${getModalTheme(theme)} transform transition-all duration-300`
  };
};

// 네비게이션 아이템 테마
export const getNavItemTheme = (theme, isActive = false) => {
  const baseTheme = `${theme.textColor} ${getHoverTheme(theme)} transition-colors duration-200`;
  
  if (isActive) {
    return `${baseTheme} ${getActiveTheme(theme)}`;
  }
  
  return baseTheme;
};

// 폼 그룹 테마
export const getFormGroupTheme = (theme) => {
  return `space-y-2 ${theme.textColor}`;
};

// 라벨 테마
export const getLabelTheme = (theme) => {
  return `block text-sm font-medium ${theme.textPrimary || theme.textColor}`;
};

// 에러 메시지 테마
export const getErrorMessageTheme = (theme) => {
  return `text-sm ${getStatusTextTheme(theme, 'error')} mt-1`;
};

// 성공 메시지 테마
export const getSuccessMessageTheme = (theme) => {
  return `text-sm ${getStatusTextTheme(theme, 'success')} mt-1`;
};

// 배지/태그 테마
export const getBadgeTheme = (theme, variant = 'default') => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  switch (variant) {
    case 'success':
      return `${baseClasses} ${getStatusBgTheme(theme, 'success')} ${getStatusTextTheme(theme, 'success')}`;
    case 'error':
      return `${baseClasses} ${getStatusBgTheme(theme, 'error')} ${getStatusTextTheme(theme, 'error')}`;
    case 'warning':
      return `${baseClasses} ${getStatusBgTheme(theme, 'warning')} ${getStatusTextTheme(theme, 'warning')}`;
    case 'info':
      return `${baseClasses} ${getStatusBgTheme(theme, 'info')} ${getStatusTextTheme(theme, 'info')}`;
    default:
      return `${baseClasses} ${theme.cardBg} ${theme.textSecondary} ${theme.borderColor}`;
  }
};

// 프로그레스 바 테마
export const getProgressTheme = (theme) => {
  return {
    container: `w-full ${theme.cardBg} rounded-full h-2`,
    bar: `h-2 ${theme.buttonBg} rounded-full transition-all duration-300`
  };
};

// 툴팁 테마
export const getTooltipTheme = (theme) => {
  return `${theme.modalBgColor || theme.cardBg} ${theme.textColor} ${theme.shadowColor} px-2 py-1 text-sm rounded border ${theme.borderColor}`;
};

// 드롭다운 테마
export const getDropdownTheme = (theme) => {
  return `${theme.modalBgColor || theme.cardBg} ${theme.textColor} ${theme.shadowColor} border ${theme.borderColor} rounded-md py-1`;
};

// 체크박스/라디오 테마
export const getCheckboxTheme = (theme) => {
  return `${theme.buttonBg} border-2 ${theme.borderColor} ${getFocusRingTheme(theme)}`;
};

// 테이블 테마
export const getTableTheme = (theme) => {
  return {
    table: `${theme.cardBg} ${theme.textColor} border ${theme.borderColor}`,
    header: `${theme.buttonBg} ${theme.buttonText} font-medium`,
    row: `border-b ${theme.dividerColor} ${getHoverTheme(theme)}`,
    cell: 'px-4 py-2'
  };
};
  