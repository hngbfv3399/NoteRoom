/**
 * 관리자 페이지 상수 정의
 */

// Mock 데이터 상수
export const MOCK_STATS = {
  TOTAL_USERS: 1250,
  ACTIVE_USERS: 890,
  TOTAL_NOTES: 3420,
  TOTAL_REPORTS: 15,
  SECURITY_ALERTS: 3,
  TOTAL_REQUESTS: 1250,
  BLOCKED_REQUESTS: 45,
};

// 요청 유형별 상수
export const REQUEST_TYPES = {
  NOTE_WRITE: 'NOTE_WRITE',
  COMMENT_WRITE: 'COMMENT_WRITE',
  IMAGE_UPLOAD: 'IMAGE_UPLOAD',
  SEARCH: 'SEARCH',
  PROFILE_UPDATE: 'PROFILE_UPDATE',
};

// Mock 요청 데이터
export const MOCK_REQUEST_DATA = {
  [REQUEST_TYPES.NOTE_WRITE]: 300,
  [REQUEST_TYPES.COMMENT_WRITE]: 450,
  [REQUEST_TYPES.IMAGE_UPLOAD]: 200,
  [REQUEST_TYPES.SEARCH]: 250,
  [REQUEST_TYPES.PROFILE_UPDATE]: 50,
};

// 상위 사용자 Mock 데이터
export const MOCK_TOP_USERS = [
  { userId: 'user1', requests: 150, blocked: 5 },
  { userId: 'user2', requests: 120, blocked: 2 },
  { userId: 'user3', requests: 100, blocked: 0 }
];

// 의심스러운 활동 유형
export const SUSPICIOUS_ACTIVITY_TYPES = {
  EXCESSIVE_REQUESTS: 'EXCESSIVE_REQUESTS',
  REPEATED_LOGIN_FAILURES: 'REPEATED_LOGIN_FAILURES',
  EXCESSIVE_USER_ACTIVITY: 'EXCESSIVE_USER_ACTIVITY',
  SUSPICIOUS_UPLOAD: 'SUSPICIOUS_UPLOAD',
  LOGIN_FAILED: 'LOGIN_FAILED',
};

// Mock 의심스러운 활동 데이터
export const MOCK_SUSPICIOUS_ACTIVITIES = [
  {
    type: SUSPICIOUS_ACTIVITY_TYPES.EXCESSIVE_REQUESTS,
    target: '192.168.1.100',
    count: 150,
    severity: 'HIGH'
  },
  {
    type: SUSPICIOUS_ACTIVITY_TYPES.REPEATED_LOGIN_FAILURES,
    target: '10.0.0.50',
    count: 25,
    severity: 'MEDIUM'
  }
];

// 보안 로그 Mock 데이터
export const MOCK_SECURITY_LOGS = [
  {
    id: '1',
    eventType: SUSPICIOUS_ACTIVITY_TYPES.EXCESSIVE_REQUESTS,
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    details: { ip: '192.168.1.100', count: 150 },
    severity: 'HIGH'
  },
  {
    id: '2',
    eventType: SUSPICIOUS_ACTIVITY_TYPES.LOGIN_FAILED,
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    details: { ip: '10.0.0.50', attempts: 5 },
    severity: 'MEDIUM'
  },
  {
    id: '3',
    eventType: SUSPICIOUS_ACTIVITY_TYPES.SUSPICIOUS_UPLOAD,
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    details: { userId: 'user123', fileType: 'executable' },
    severity: 'HIGH'
  }
];

// 신고 유형 상수
export const REPORT_TYPES = {
  NOTE: 'note',
  COMMENT: 'comment',
  USER: 'user'
};

// 신고 사유 상수
export const REPORT_REASONS = {
  INAPPROPRIATE: 'inappropriate',
  SPAM: 'spam',
  HARASSMENT: 'harassment',
  HATE_SPEECH: 'hate_speech',
  VIOLENCE: 'violence',
  COPYRIGHT: 'copyright',
  MISINFORMATION: 'misinformation',
  OTHER: 'other'
};

export const REPORT_REASON_LABELS = {
  [REPORT_REASONS.INAPPROPRIATE]: '부적절한 콘텐츠',
  [REPORT_REASONS.SPAM]: '스팸/광고',
  [REPORT_REASONS.HARASSMENT]: '괴롭힘/협박',
  [REPORT_REASONS.HATE_SPEECH]: '혐오 발언',
  [REPORT_REASONS.VIOLENCE]: '폭력적 콘텐츠',
  [REPORT_REASONS.COPYRIGHT]: '저작권 침해',
  [REPORT_REASONS.MISINFORMATION]: '허위 정보',
  [REPORT_REASONS.OTHER]: '기타'
};

export const REPORT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const REPORT_STATUS_LABELS = {
  [REPORT_STATUS.PENDING]: '검토 중',
  [REPORT_STATUS.APPROVED]: '승인됨',
  [REPORT_STATUS.REJECTED]: '거부됨'
};

// Mock 신고 데이터
export const MOCK_REPORTS = [
  {
    id: 'report1',
    contentType: REPORT_TYPES.NOTE,
    reason: REPORT_REASONS.SPAM,
    description: '스팸성 광고 글입니다.',
    reporterName: '사용자1',
    createdAt: { toDate: () => new Date() },
    contentData: {
      title: '광고성 노트 제목',
      content: '이것은 스팸성 광고 내용입니다. 클릭하세요!'
    }
  },
  {
    id: 'report2',
    contentType: REPORT_TYPES.COMMENT,
    reason: REPORT_REASONS.INAPPROPRIATE,
    description: '부적절한 언어 사용',
    reporterName: '사용자2',
    createdAt: { toDate: () => new Date(Date.now() - 86400000) },
    contentData: {
      text: '부적절한 댓글 내용입니다.'
    }
  }
];

// 심각도 레벨
export const SEVERITY_LEVELS = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

// 관리자 액션 유형
export const ADMIN_ACTIONS = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// 시간 범위 옵션
export const TIME_RANGE_OPTIONS = [
  { value: 1, label: '최근 1시간' },
  { value: 6, label: '최근 6시간' },
  { value: 24, label: '최근 24시간' },
  { value: 168, label: '최근 7일' },
];

// 관리자 탭 설정
export const ADMIN_TAB_IDS = {
  SECURITY: 'security',
  USERS: 'users',
  CONTENT: 'content',
  SETTINGS: 'settings',
  ANALYTICS: 'analytics',
}; 