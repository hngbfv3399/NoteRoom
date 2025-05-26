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

  // 강화된 보안 설정
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
      'class', 'target', 'rel'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    FORBID_TAGS: [
      'script', 'object', 'embed', 'form', 'input', 'button',
      'select', 'textarea', 'iframe', 'frame', 'frameset',
      'applet', 'base', 'link', 'meta', 'style'
    ],
    FORBID_ATTR: [
      'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout',
      'onmousedown', 'onmouseup', 'onkeydown', 'onkeyup', 'onkeypress',
      'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
      'onselect', 'onabort', 'ondragdrop', 'onresize', 'onactivate',
      'onafterprint', 'onmove', 'onstart', 'onfinish', 'onbounce',
      'onbeforeunload', 'onhashchange', 'onmessage', 'onoffline',
      'ononline', 'onpagehide', 'onpageshow', 'onpopstate',
      'onredo', 'onstorage', 'onundo', 'onunload', 'style'
    ],
    KEEP_CONTENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false,
    SANITIZE_DOM: true,
    WHOLE_DOCUMENT: false,
    ...options
  };

  try {
    // DOMPurify로 정화
    const cleaned = DOMPurify.sanitize(html, defaultConfig);
    
    // 추가 보안 검사: 스크립트 태그나 이벤트 핸들러가 남아있는지 확인
    if (cleaned.includes('<script') || 
        cleaned.includes('javascript:') || 
        /on\w+\s*=/.test(cleaned) ||
        cleaned.includes('data:text/html')) {
      console.warn('Potentially dangerous content detected, stripping all HTML');
      return stripAllHtml(html);
    }
    
    return cleaned;
  } catch (error) {
    console.error('HTML 정화 중 오류 발생:', error);
    // 정화 실패 시 모든 HTML 태그 제거
    return stripAllHtml(html);
  }
};

/**
 * 모든 HTML 태그를 제거하는 안전한 함수
 * @param {string} html - HTML 문자열
 * @returns {string} 순수 텍스트
 */
const stripAllHtml = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    // DOMParser를 사용하여 안전하게 텍스트 추출
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const textContent = doc.body.textContent || doc.body.innerText || '';
    
    // 추가 정화: 특수 문자 및 제어 문자 제거
    return textContent
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // 제어 문자 제거
      .replace(/\s+/g, ' ') // 연속된 공백 정리
      .trim();
  } catch (error) {
    console.warn('DOMParser 실패, 정규식 사용:', error);
    // DOMParser 실패 시 정규식으로 기본적인 태그 제거
    return html
      .replace(/<[^>]*>/g, '') // HTML 태그 제거
      .replace(/&[a-zA-Z0-9#]+;/g, '') // HTML 엔티티 제거
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // 제어 문자 제거
      .replace(/\s+/g, ' ') // 연속된 공백 정리
      .trim();
  }
};

/**
 * HTML에서 텍스트만 추출하는 함수 (보안 강화)
 * 
 * @param {string} html - HTML 문자열
 * @param {number} maxLength - 최대 길이 (선택사항)
 * @returns {string} 순수 텍스트
 */
export const extractTextFromHtml = (html, maxLength = null) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const text = stripAllHtml(html);
  
  if (maxLength && typeof maxLength === 'number' && maxLength > 0) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
  
  return text;
};

/**
 * URL의 안전성을 검증하는 함수
 * @param {string} url - 검증할 URL
 * @returns {boolean} 안전한 URL인지 여부
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // 위험한 프로토콜 차단
  const dangerousProtocols = [
    'javascript:', 'data:', 'vbscript:', 'file:', 'about:',
    'chrome:', 'chrome-extension:', 'moz-extension:'
  ];

  const lowerUrl = url.toLowerCase().trim();
  
  if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
    return false;
  }

  // 허용된 프로토콜만 통과
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
  
  try {
    const urlObj = new URL(url);
    return allowedProtocols.includes(urlObj.protocol);
  } catch {
    // 상대 URL인 경우 허용
    return !lowerUrl.includes(':');
  }
};

/**
 * 이미지 URL의 안전성을 검증하는 함수
 * @param {string} src - 이미지 URL
 * @returns {boolean} 안전한 이미지 URL인지 여부
 */
export const isValidImageUrl = (src) => {
  if (!isValidUrl(src)) {
    return false;
  }

  // 허용된 이미지 확장자
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const lowerSrc = src.toLowerCase();
  
  // 확장자 검사 (쿼리 파라미터 고려)
  const urlWithoutQuery = lowerSrc.split('?')[0];
  const hasValidExtension = allowedExtensions.some(ext => 
    urlWithoutQuery.endsWith(ext)
  );

  // Firebase Storage, 신뢰할 수 있는 CDN 등 허용
  const trustedDomains = [
    'firebasestorage.googleapis.com',
    'storage.googleapis.com',
    'images.unsplash.com',
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com'
  ];

  try {
    const urlObj = new URL(src);
    const isTrustedDomain = trustedDomains.some(domain => 
      urlObj.hostname.includes(domain)
    );
    
    return hasValidExtension || isTrustedDomain;
  } catch {
    // 상대 URL인 경우 확장자로만 판단
    return hasValidExtension;
  }
};

/**
 * 사용자 입력 텍스트를 안전하게 정화하는 함수
 * @param {string} text - 정화할 텍스트
 * @param {Object} options - 옵션
 * @returns {string} 정화된 텍스트
 */
export const sanitizeUserInput = (text, options = {}) => {
  const {
    maxLength = 10000,
    allowLineBreaks = true,
    allowBasicFormatting = false
  } = options;

  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = text;

  // 길이 제한
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  if (allowBasicFormatting) {
    // 기본 포맷팅만 허용 (볼드, 이탤릭 등)
    sanitized = sanitizeHtml(sanitized, {
      ALLOWED_TAGS: ['strong', 'em', 'u', 'br', 'p'],
      ALLOWED_ATTR: []
    });
  } else {
    // 모든 HTML 제거
    sanitized = stripAllHtml(sanitized);
  }

  if (!allowLineBreaks) {
    sanitized = sanitized.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  }

  return sanitized.trim();
};

export default {
  sanitizeHtml,
  extractTextFromHtml,
  isValidUrl,
  isValidImageUrl,
  sanitizeUserInput,
}; 