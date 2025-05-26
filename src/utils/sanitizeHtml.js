import DOMPurify from 'dompurify';

/**
 * HTML 콘텐츠를 안전하게 정화하는 함수
 * XSS 공격을 방지하기 위해 위험한 태그와 속성을 제거합니다.
 * 
 * @param {string} html - 정화할 HTML 문자열
 * @param {Object} options - DOMPurify 옵션
 * @returns {string} 정화된 HTML 문자열
 */
export const sanitizeHtml = (html, options = {}) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // 기본 설정: 안전한 태그와 속성만 허용
  const defaultConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'sub', 'sup',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'width', 'height',
      'class', 'style', 'target', 'rel'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    ...options
  };

  try {
    return DOMPurify.sanitize(html, defaultConfig);
  } catch (error) {
    console.error('HTML 정화 중 오류 발생:', error);
    // 정화 실패 시 모든 HTML 태그 제거
    return html.replace(/<[^>]*>/g, '').trim();
  }
};

/**
 * HTML에서 텍스트만 추출하는 함수
 * 
 * @param {string} html - HTML 문자열
 * @returns {string} 순수 텍스트
 */
export const extractTextFromHtml = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    // DOMParser를 사용하여 안전하게 텍스트 추출
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent || doc.body.innerText || '';
  } catch (error) {
    console.warn('텍스트 추출 중 오류, 정규식 사용:', error);
    // 정규식으로 기본적인 태그 제거
    return html.replace(/<[^>]*>/g, '').trim();
  }
};

/**
 * HTML 콘텐츠의 미리보기 텍스트를 생성하는 함수
 * 
 * @param {string} html - HTML 문자열
 * @param {number} maxLength - 최대 길이
 * @returns {string} 미리보기 텍스트
 */
export const getHtmlPreview = (html, maxLength = 100) => {
  const text = extractTextFromHtml(html);
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}; 