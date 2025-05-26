/**
 * Rate Limiter 유틸리티
 * API 호출 빈도를 제한하여 남용을 방지합니다.
 */

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanup();
  }

  /**
   * 요청 제한 확인
   * @param {string} key - 제한할 키 (사용자 ID, IP 등)
   * @param {number} limit - 제한 횟수
   * @param {number} windowMs - 시간 윈도우 (밀리초)
   * @returns {boolean} - 허용 여부
   */
  isAllowed(key, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const userRequests = this.requests.get(key);
    
    // 시간 윈도우 밖의 요청들 제거
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= limit) {
      return false;
    }
    
    // 새 요청 추가
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  /**
   * 남은 요청 횟수 반환
   */
  getRemainingRequests(key, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(key)) {
      return limit;
    }
    
    const userRequests = this.requests.get(key);
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, limit - validRequests.length);
  }

  /**
   * 다음 요청 가능 시간 반환 (밀리초)
   */
  getResetTime(key, windowMs = 60000) {
    if (!this.requests.has(key)) {
      return 0;
    }
    
    const userRequests = this.requests.get(key);
    if (userRequests.length === 0) {
      return 0;
    }
    
    const oldestRequest = Math.min(...userRequests);
    const resetTime = oldestRequest + windowMs;
    
    return Math.max(0, resetTime - Date.now());
  }

  /**
   * 주기적으로 오래된 데이터 정리
   */
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24시간
      
      for (const [key, requests] of this.requests.entries()) {
        const validRequests = requests.filter(timestamp => now - timestamp < maxAge);
        
        if (validRequests.length === 0) {
          this.requests.delete(key);
        } else {
          this.requests.set(key, validRequests);
        }
      }
    }, 60 * 60 * 1000); // 1시간마다 정리
  }

  /**
   * 특정 키의 제한 초기화
   */
  reset(key) {
    this.requests.delete(key);
  }

  /**
   * 모든 제한 초기화
   */
  resetAll() {
    this.requests.clear();
  }
}

// 전역 Rate Limiter 인스턴스
const globalRateLimiter = new RateLimiter();

// 특정 작업별 Rate Limiter 설정
export const RATE_LIMITS = {
  // 노트 작성/수정
  NOTE_WRITE: { limit: 5, windowMs: 60000 }, // 1분에 5개
  
  // 댓글 작성
  COMMENT_WRITE: { limit: 10, windowMs: 60000 }, // 1분에 10개
  
  // 이미지 업로드
  IMAGE_UPLOAD: { limit: 3, windowMs: 60000 }, // 1분에 3개
  
  // 검색
  SEARCH: { limit: 30, windowMs: 60000 }, // 1분에 30회
  
  // 프로필 업데이트
  PROFILE_UPDATE: { limit: 3, windowMs: 300000 }, // 5분에 3회
  
  // 로그인 시도
  LOGIN_ATTEMPT: { limit: 5, windowMs: 300000 }, // 5분에 5회
};

/**
 * 노트 작성 제한 확인
 */
export const checkNoteWriteLimit = (userId) => {
  const { limit, windowMs } = RATE_LIMITS.NOTE_WRITE;
  return globalRateLimiter.isAllowed(`note_write_${userId}`, limit, windowMs);
};

/**
 * 댓글 작성 제한 확인
 */
export const checkCommentWriteLimit = (userId) => {
  const { limit, windowMs } = RATE_LIMITS.COMMENT_WRITE;
  return globalRateLimiter.isAllowed(`comment_write_${userId}`, limit, windowMs);
};

/**
 * 이미지 업로드 제한 확인
 */
export const checkImageUploadLimit = (userId) => {
  const { limit, windowMs } = RATE_LIMITS.IMAGE_UPLOAD;
  return globalRateLimiter.isAllowed(`image_upload_${userId}`, limit, windowMs);
};

/**
 * 검색 제한 확인
 */
export const checkSearchLimit = (userId) => {
  const { limit, windowMs } = RATE_LIMITS.SEARCH;
  return globalRateLimiter.isAllowed(`search_${userId}`, limit, windowMs);
};

/**
 * 프로필 업데이트 제한 확인
 */
export const checkProfileUpdateLimit = (userId) => {
  const { limit, windowMs } = RATE_LIMITS.PROFILE_UPDATE;
  return globalRateLimiter.isAllowed(`profile_update_${userId}`, limit, windowMs);
};

/**
 * 로그인 시도 제한 확인
 */
export const checkLoginAttemptLimit = (identifier) => {
  const { limit, windowMs } = RATE_LIMITS.LOGIN_ATTEMPT;
  return globalRateLimiter.isAllowed(`login_attempt_${identifier}`, limit, windowMs);
};

/**
 * 제한 정보 조회
 */
export const getRateLimitInfo = (userId, action) => {
  const config = RATE_LIMITS[action];
  if (!config) return null;
  
  const key = `${action.toLowerCase()}_${userId}`;
  const remaining = globalRateLimiter.getRemainingRequests(key, config.limit, config.windowMs);
  const resetTime = globalRateLimiter.getResetTime(key, config.windowMs);
  
  return {
    limit: config.limit,
    remaining,
    resetTime,
    resetDate: new Date(Date.now() + resetTime)
  };
};

export default globalRateLimiter; 