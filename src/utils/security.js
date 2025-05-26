/**
 * 보안 유틸리티 함수들
 * 다양한 보안 위협으로부터 애플리케이션을 보호합니다.
 */

/**
 * CSRF 토큰 생성
 */
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * 세션 토큰 생성
 */
export const generateSessionToken = () => {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * 안전한 랜덤 문자열 생성
 */
export const generateSecureRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
};

/**
 * 민감한 정보 마스킹
 */
export const maskSensitiveInfo = (text, type = 'email') => {
  if (!text || typeof text !== 'string') return '';
  
  switch (type) {
    case 'email': {
      const emailParts = text.split('@');
      if (emailParts.length !== 2) return text;
      const username = emailParts[0];
      const domain = emailParts[1];
      const maskedUsername = username.length > 2 
        ? username.substring(0, 2) + '*'.repeat(username.length - 2)
        : username;
      return `${maskedUsername}@${domain}`;
    }
      
    case 'phone':
      return text.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
      
    case 'name':
      if (text.length <= 2) return text;
      return text.substring(0, 1) + '*'.repeat(text.length - 2) + text.substring(text.length - 1);
      
    default:
      return text.replace(/./g, '*');
  }
};

/**
 * IP 주소 검증 및 차단 목록 확인
 */
export const isBlockedIP = (ip) => {
  // 기본적인 차단 IP 패턴들
  const blockedPatterns = [
    /^0\.0\.0\.0$/, // Invalid IP
    /^127\./, // Localhost
    /^10\./, // Private network
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private network
    /^192\.168\./, // Private network
    /^169\.254\./, // Link-local
  ];
  
  return blockedPatterns.some(pattern => pattern.test(ip));
};

/**
 * User Agent 검증 (봇 탐지)
 */
export const isSuspiciousUserAgent = (userAgent) => {
  if (!userAgent || typeof userAgent !== 'string') return true;
  
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /^$/,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
};

/**
 * 요청 헤더 검증
 */
export const validateRequestHeaders = (headers) => {
  const issues = [];
  
  // Content-Type 검증
  if (headers['content-type'] && !headers['content-type'].includes('application/json')) {
    issues.push('Invalid Content-Type');
  }
  
  // Origin 검증 (개발 환경에서는 localhost 허용)
  const allowedOrigins = [
    'http://localhost:3000',
    'https://your-domain.com', // 실제 도메인으로 변경 필요
  ];
  
  if (headers.origin && !allowedOrigins.includes(headers.origin)) {
    issues.push('Invalid Origin');
  }
  
  // Referer 검증
  if (headers.referer && !allowedOrigins.some(origin => headers.referer.startsWith(origin))) {
    issues.push('Invalid Referer');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

/**
 * 세션 보안 검증
 */
export const validateSession = (sessionData) => {
  if (!sessionData) return false;
  
  const now = Date.now();
  
  // 세션 만료 확인
  if (sessionData.expiresAt && now > sessionData.expiresAt) {
    return false;
  }
  
  // 세션 생성 시간 확인 (24시간 이상 된 세션은 무효)
  if (sessionData.createdAt && now - sessionData.createdAt > 24 * 60 * 60 * 1000) {
    return false;
  }
  
  // 마지막 활동 시간 확인 (2시간 이상 비활성 시 무효)
  if (sessionData.lastActivity && now - sessionData.lastActivity > 2 * 60 * 60 * 1000) {
    return false;
  }
  
  return true;
};

/**
 * 로그 데이터 정화 (민감한 정보 제거)
 */
export const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'auth',
    'email', 'phone', 'ssn', 'credit', 'card'
  ];
  
  const sanitized = { ...data };
  
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const lowerKey = key.toLowerCase();
        
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    }
  };
  
  sanitizeObject(sanitized);
  return sanitized;
};

/**
 * 안전한 에러 메시지 생성
 */
export const createSafeErrorMessage = (error, isProduction = true) => {
  if (!isProduction) {
    return error.message || '알 수 없는 오류가 발생했습니다.';
  }
  
  // 프로덕션 환경에서는 일반적인 메시지만 반환
  const safeMessages = {
    'auth': '인증에 실패했습니다.',
    'permission': '권한이 없습니다.',
    'validation': '입력 데이터가 올바르지 않습니다.',
    'network': '네트워크 오류가 발생했습니다.',
    'server': '서버 오류가 발생했습니다.',
    'default': '요청을 처리할 수 없습니다.'
  };
  
  const errorType = error.code || error.type || 'default';
  return safeMessages[errorType] || safeMessages.default;
};

/**
 * 파일 업로드 보안 검증
 */
export const validateFileUpload = (file) => {
  const issues = [];
  
  // 파일 크기 검증
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    issues.push('파일 크기가 너무 큽니다.');
  }
  
  // 파일 타입 검증
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    issues.push('허용되지 않는 파일 형식입니다.');
  }
  
  // 파일명 검증
  const fileName = file.name;
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    issues.push('유효하지 않은 파일명입니다.');
  }
  
  // 파일 확장자 이중 검증
  const fileExtension = fileName.split('.').pop().toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  if (!allowedExtensions.includes(fileExtension)) {
    issues.push('허용되지 않는 파일 확장자입니다.');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

/**
 * 보안 헤더 생성
 */
export const generateSecurityHeaders = () => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
};

/**
 * 입력 데이터 정규화
 */
export const normalizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/\s+/g, ' ') // 연속된 공백을 하나로
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // 보이지 않는 문자 제거
    .normalize('NFC'); // 유니코드 정규화
}; 