/**
 * 입력 검증 유틸리티 함수들
 * 클라이언트 사이드 검증을 강화하여 보안을 향상시킵니다.
 */

// 텍스트 길이 제한
export const TEXT_LIMITS = {
  TITLE_MAX: 100,
  CONTENT_MAX: 50000,
  COMMENT_MAX: 1000,
  CATEGORY_MAX: 50,
  USERNAME_MAX: 50,
  USERNAME_MIN: 2
};

// 파일 크기 제한 (바이트)
export const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
};

/**
 * 문자열 길이 검증
 */
export const validateTextLength = (text, minLength = 0, maxLength = Infinity) => {
  if (typeof text !== 'string') {
    return { isValid: false, error: '텍스트 형식이 올바르지 않습니다.' };
  }
  
  const trimmedText = text.trim();
  
  if (trimmedText.length < minLength) {
    return { isValid: false, error: `최소 ${minLength}자 이상 입력해주세요.` };
  }
  
  if (trimmedText.length > maxLength) {
    return { isValid: false, error: `최대 ${maxLength}자까지 입력 가능합니다.` };
  }
  
  return { isValid: true, value: trimmedText };
};

/**
 * 노트 제목 검증
 */
export const validateNoteTitle = (title) => {
  const result = validateTextLength(title, 1, TEXT_LIMITS.TITLE_MAX);
  if (!result.isValid) return result;
  
  // 특수문자 제한 (기본적인 문장부호는 허용)
  const invalidChars = /[<>{}[\]\\]/;
  if (invalidChars.test(result.value)) {
    return { isValid: false, error: '제목에 사용할 수 없는 특수문자가 포함되어 있습니다.' };
  }
  
  return result;
};

/**
 * 노트 내용 검증
 */
export const validateNoteContent = (content) => {
  const result = validateTextLength(content, 1, TEXT_LIMITS.CONTENT_MAX);
  if (!result.isValid) return result;
  
  // HTML 태그 개수 제한 (과도한 중첩 방지)
  const tagCount = (content.match(/<[^>]*>/g) || []).length;
  if (tagCount > 1000) {
    return { isValid: false, error: '내용이 너무 복잡합니다. 태그 사용을 줄여주세요.' };
  }
  
  return result;
};

/**
 * 카테고리 검증
 */
export const validateCategory = (category) => {
  const allowedCategories = [
    "일상", "기술", "여행", "음식", "영화/드라마", 
    "음악", "독서", "취미", "기타"
  ];
  
  if (!allowedCategories.includes(category)) {
    return { isValid: false, error: '유효하지 않은 카테고리입니다.' };
  }
  
  return { isValid: true, value: category };
};

/**
 * 파일 검증
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { isValid: false, error: '파일이 선택되지 않았습니다.' };
  }
  
  // 파일 크기 검증
  if (file.size > FILE_LIMITS.IMAGE_MAX_SIZE) {
    return { 
      isValid: false, 
      error: `파일 크기는 ${FILE_LIMITS.IMAGE_MAX_SIZE / 1024 / 1024}MB를 초과할 수 없습니다.` 
    };
  }
  
  // 파일 타입 검증
  if (!FILE_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { 
      isValid: false, 
      error: '지원하지 않는 파일 형식입니다. (JPG, PNG, GIF, WebP만 허용)' 
    };
  }
  
  // 파일명 검증 (경로 순회 공격 방지)
  const fileName = file.name;
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return { isValid: false, error: '유효하지 않은 파일명입니다.' };
  }
  
  return { isValid: true, file };
};

/**
 * URL 검증
 */
export const validateUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL이 입력되지 않았습니다.' };
  }
  
  try {
    const urlObj = new URL(url);
    
    // HTTP/HTTPS만 허용
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'HTTP 또는 HTTPS URL만 허용됩니다.' };
    }
    
    // 로컬 IP 주소 차단 (SSRF 공격 방지)
    const hostname = urlObj.hostname;
    const localPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./, // Link-local
      /^::1$/, // IPv6 localhost
      /^fc00:/, // IPv6 private
      /^fe80:/ // IPv6 link-local
    ];
    
    if (localPatterns.some(pattern => pattern.test(hostname))) {
      return { isValid: false, error: '내부 네트워크 주소는 허용되지 않습니다.' };
    }
    
    return { isValid: true, value: url };
  } catch {
    return { isValid: false, error: '유효하지 않은 URL 형식입니다.' };
  }
};

/**
 * 사용자명 검증
 */
export const validateUsername = (username) => {
  const result = validateTextLength(username, TEXT_LIMITS.USERNAME_MIN, TEXT_LIMITS.USERNAME_MAX);
  if (!result.isValid) return result;
  
  // 영문, 숫자, 한글, 일부 특수문자만 허용
  const validPattern = /^[a-zA-Z0-9가-힣\s._-]+$/;
  if (!validPattern.test(result.value)) {
    return { isValid: false, error: '사용자명에 허용되지 않는 문자가 포함되어 있습니다.' };
  }
  
  return result;
};

/**
 * 댓글 검증
 */
export const validateComment = (comment) => {
  const result = validateTextLength(comment, 1, TEXT_LIMITS.COMMENT_MAX);
  if (!result.isValid) return result;
  
  // 스팸 패턴 검사 (기본적인)
  const spamPatterns = [
    /(.)\1{10,}/, // 같은 문자 10개 이상 반복
    /https?:\/\/[^\s]+/gi // URL 포함 (필요시 주석 해제)
  ];
  
  if (spamPatterns.some(pattern => pattern.test(result.value))) {
    return { isValid: false, error: '스팸으로 의심되는 내용입니다.' };
  }
  
  return result;
};

/**
 * 종합 노트 검증
 */
export const validateNote = (noteData) => {
  const errors = [];
  
  // 제목 검증
  const titleResult = validateNoteTitle(noteData.title);
  if (!titleResult.isValid) errors.push(titleResult.error);
  
  // 내용 검증
  const contentResult = validateNoteContent(noteData.content);
  if (!contentResult.isValid) errors.push(contentResult.error);
  
  // 카테고리 검증
  const categoryResult = validateCategory(noteData.category);
  if (!categoryResult.isValid) errors.push(categoryResult.error);
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  return { 
    isValid: true, 
    data: {
      title: titleResult.value,
      content: contentResult.value,
      category: categoryResult.value
    }
  };
}; 