/**
 * 사용자 친화적 에러 메시지 처리 유틸리티
 * 
 * 기능:
 * - Firebase 에러 코드를 한국어 메시지로 변환
 * - 일반적인 에러 상황에 대한 친화적 메시지 제공
 * - 토스트 알림과 연동
 */

// Firebase 에러 코드 매핑
const FIREBASE_ERROR_MESSAGES = {
  // 인증 관련
  'auth/user-not-found': '사용자를 찾을 수 없습니다.',
  'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
  'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
  'auth/weak-password': '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.',
  'auth/invalid-email': '올바르지 않은 이메일 형식입니다.',
  'auth/user-disabled': '비활성화된 계정입니다. 관리자에게 문의하세요.',
  'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
  'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
  'auth/popup-closed-by-user': '로그인이 취소되었습니다.',
  'auth/cancelled-popup-request': '로그인이 취소되었습니다.',

  // Firestore 관련
  'firestore/permission-denied': '접근 권한이 없습니다.',
  'firestore/not-found': '요청한 데이터를 찾을 수 없습니다.',
  'firestore/already-exists': '이미 존재하는 데이터입니다.',
  'firestore/resource-exhausted': '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  'firestore/failed-precondition': '작업을 완료할 수 없습니다. 페이지를 새로고침해주세요.',
  'firestore/aborted': '작업이 중단되었습니다. 다시 시도해주세요.',
  'firestore/out-of-range': '잘못된 요청입니다.',
  'firestore/unimplemented': '지원하지 않는 기능입니다.',
  'firestore/internal': '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  'firestore/unavailable': '서비스를 일시적으로 사용할 수 없습니다.',
  'firestore/data-loss': '데이터 손실이 발생했습니다. 관리자에게 문의하세요.',

  // Storage 관련
  'storage/object-not-found': '파일을 찾을 수 없습니다.',
  'storage/bucket-not-found': '저장소를 찾을 수 없습니다.',
  'storage/project-not-found': '프로젝트를 찾을 수 없습니다.',
  'storage/quota-exceeded': '저장 용량이 부족합니다.',
  'storage/unauthenticated': '로그인이 필요합니다.',
  'storage/unauthorized': '파일 업로드 권한이 없습니다.',
  'storage/retry-limit-exceeded': '업로드 재시도 한도를 초과했습니다.',
  'storage/invalid-checksum': '파일이 손상되었습니다. 다시 업로드해주세요.',
  'storage/canceled': '업로드가 취소되었습니다.',
  'storage/invalid-event-name': '잘못된 요청입니다.',
  'storage/invalid-url': '잘못된 파일 주소입니다.',
  'storage/invalid-argument': '잘못된 파일 형식입니다.',
  'storage/no-default-bucket': '기본 저장소가 설정되지 않았습니다.',
  'storage/cannot-slice-blob': '파일 처리 중 오류가 발생했습니다.',
  'storage/server-file-wrong-size': '파일 크기가 올바르지 않습니다.',

  // 일반적인 네트워크 에러
  'permission-denied': '접근 권한이 없습니다.',
  'not-found': '요청한 데이터를 찾을 수 없습니다.',
  'already-exists': '이미 존재하는 데이터입니다.',
  'resource-exhausted': '요청 한도를 초과했습니다.',
  'failed-precondition': '작업 조건이 맞지 않습니다.',
  'aborted': '작업이 중단되었습니다.',
  'out-of-range': '범위를 벗어난 요청입니다.',
  'unimplemented': '지원하지 않는 기능입니다.',
  'internal': '서버 내부 오류가 발생했습니다.',
  'unavailable': '서비스를 일시적으로 사용할 수 없습니다.',
  'data-loss': '데이터 손실이 발생했습니다.',
  'unauthenticated': '로그인이 필요합니다.',
};

// 일반적인 에러 상황별 메시지
const COMMON_ERROR_MESSAGES = {
  NETWORK_ERROR: '인터넷 연결을 확인해주세요.',
  TIMEOUT_ERROR: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
  VALIDATION_ERROR: '입력한 정보를 다시 확인해주세요.',
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다. 5MB 이하의 파일을 선택해주세요.',
  INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다.',
  EMPTY_CONTENT: '내용을 입력해주세요.',
  INVALID_INPUT: '올바르지 않은 입력입니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  MAINTENANCE_MODE: '서비스 점검 중입니다. 잠시 후 다시 이용해주세요.',
};

/**
 * 에러 객체를 사용자 친화적인 메시지로 변환
 * @param {Error|Object} error - 에러 객체
 * @param {string} fallbackMessage - 기본 메시지
 * @returns {string} 사용자 친화적인 에러 메시지
 */
export const getErrorMessage = (error, fallbackMessage = COMMON_ERROR_MESSAGES.UNKNOWN_ERROR) => {
  if (!error) return fallbackMessage;

  // 문자열인 경우 그대로 반환
  if (typeof error === 'string') {
    return error;
  }

  // Firebase 에러 코드 확인
  if (error.code) {
    const firebaseMessage = FIREBASE_ERROR_MESSAGES[error.code];
    if (firebaseMessage) {
      return firebaseMessage;
    }
  }

  // 에러 메시지에서 키워드 검색
  const errorMessage = error.message || error.toString();
  
  if (errorMessage.includes('network') || errorMessage.includes('Network')) {
    return COMMON_ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    return COMMON_ERROR_MESSAGES.TIMEOUT_ERROR;
  }
  
  if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
    return FIREBASE_ERROR_MESSAGES['permission-denied'];
  }
  
  if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
    return FIREBASE_ERROR_MESSAGES['not-found'];
  }

  // 기본 메시지 반환
  return fallbackMessage;
};

/**
 * 에러를 로깅하고 사용자 친화적 메시지를 토스트로 표시
 * @param {Error|Object} error - 에러 객체
 * @param {string} context - 에러 발생 컨텍스트
 * @param {string} fallbackMessage - 기본 메시지
 * @param {string} toastType - 토스트 타입 ('error', 'warning', 'info')
 */
export const handleError = (error, context = '', fallbackMessage = '', toastType = 'error') => {
  // 개발자용 로깅
  console.error(`[${context}] 에러 발생:`, error);
  
  // 사용자 친화적 메시지 생성
  const userMessage = getErrorMessage(error, fallbackMessage);
  
  // 토스트 알림 표시
  if (typeof window !== 'undefined' && window.showToast) {
    window.showToast(userMessage, toastType, 4000);
  }
  
  return userMessage;
};

/**
 * 특정 상황별 에러 핸들러들
 */
export const errorHandlers = {
  // 로그인 관련 에러
  auth: (error) => handleError(error, 'AUTH', '로그인 중 오류가 발생했습니다.'),
  
  // 데이터 로딩 에러
  dataLoad: (error) => handleError(error, 'DATA_LOAD', '데이터를 불러오는 중 오류가 발생했습니다.'),
  
  // 데이터 저장 에러
  dataSave: (error) => handleError(error, 'DATA_SAVE', '저장 중 오류가 발생했습니다.'),
  
  // 파일 업로드 에러
  fileUpload: (error) => handleError(error, 'FILE_UPLOAD', '파일 업로드 중 오류가 발생했습니다.'),
  
  // 댓글 관련 에러
  comment: (error) => handleError(error, 'COMMENT', '댓글 처리 중 오류가 발생했습니다.'),
  
  // 네트워크 에러
  network: (error) => handleError(error, 'NETWORK', COMMON_ERROR_MESSAGES.NETWORK_ERROR),
  
  // 권한 에러
  permission: (error) => handleError(error, 'PERMISSION', '접근 권한이 없습니다.'),
  
  // 일반적인 에러
  general: (error) => handleError(error, 'GENERAL', COMMON_ERROR_MESSAGES.UNKNOWN_ERROR),
};

/**
 * 에러 타입별 아이콘 반환
 * @param {string} errorType - 에러 타입
 * @returns {string} 이모지 아이콘
 */
export const getErrorIcon = (errorType) => {
  const icons = {
    auth: '🔐',
    network: '🌐',
    permission: '🚫',
    file: '📁',
    data: '💾',
    server: '🖥️',
    validation: '⚠️',
    unknown: '❓',
  };
  
  return icons[errorType] || icons.unknown;
};

export default {
  getErrorMessage,
  handleError,
  errorHandlers,
  getErrorIcon,
  COMMON_ERROR_MESSAGES,
  FIREBASE_ERROR_MESSAGES,
}; 