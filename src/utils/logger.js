/**
 * 보안 강화된 로깅 유틸리티
 * 프로덕션 환경에서 민감한 정보 로깅을 방지합니다.
 */

const isDevelopment = import.meta.env.DEV;
const enableDebugLogs = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';

/**
 * 민감한 정보를 마스킹하는 함수
 */
const maskSensitiveData = (data) => {
  if (typeof data === 'string') {
    // 이메일 마스킹
    data = data.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, 
      (match, username, domain) => {
        const maskedUsername = username.length > 2 
          ? username.substring(0, 2) + '*'.repeat(username.length - 2)
          : username;
        return `${maskedUsername}@${domain}`;
      });
    
    // API 키 마스킹
    data = data.replace(/([A-Za-z0-9]{20,})/g, (match) => {
      return match.substring(0, 4) + '*'.repeat(match.length - 8) + match.substring(match.length - 4);
    });
    
    // 토큰 마스킹
    data = data.replace(/(token|key|secret|password)[\s:=]+([^\s,}]+)/gi, 
      (match, field) => `${field}: [REDACTED]`);
  }
  
  return data;
};

/**
 * 안전한 로깅 함수들
 */
export const logger = {
  info: (...args) => {
    if (isDevelopment || enableDebugLogs) {
      const maskedArgs = args.map(arg => 
        typeof arg === 'string' ? maskSensitiveData(arg) : arg
      );
      console.log('[INFO]', ...maskedArgs);
    }
  },
  
  warn: (...args) => {
    const maskedArgs = args.map(arg => 
      typeof arg === 'string' ? maskSensitiveData(arg) : arg
    );
    console.warn('[WARN]', ...maskedArgs);
  },
  
  error: (...args) => {
    const maskedArgs = args.map(arg => 
      typeof arg === 'string' ? maskSensitiveData(arg) : arg
    );
    console.error('[ERROR]', ...maskedArgs);
  },
  
  debug: (...args) => {
    if (isDevelopment && enableDebugLogs) {
      const maskedArgs = args.map(arg => 
        typeof arg === 'string' ? maskSensitiveData(arg) : arg
      );
      console.debug('[DEBUG]', ...maskedArgs);
    }
  },
  
  // 민감한 정보가 포함된 객체 로깅
  secureLog: (message, data) => {
    if (isDevelopment || enableDebugLogs) {
      const sanitizedData = sanitizeLogData(data);
      console.log(`[SECURE] ${message}`, sanitizedData);
    }
  }
};

/**
 * 로그 데이터 정화 함수
 */
const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'auth', 'apiKey',
    'email', 'phone', 'ssn', 'credit', 'card', 'uid'
  ];
  
  const sanitized = JSON.parse(JSON.stringify(data));
  
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

export default logger; 