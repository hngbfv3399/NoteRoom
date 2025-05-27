# 변경 로그

## [1.5.0] - 2025-01-02

### 🚀 대규모 UI/UX 개선 및 안정성 강화

#### ✨ 새로운 기능
- **Redux 기반 토스트 알림 시스템 완전 구축**
  - `src/store/toast/slice.js` Redux slice 생성
  - showToast, removeToast, clearAllToasts 액션
  - 모든 사용자 액션에 대한 즉시 피드백 제공
  - 에러 상황에 대한 사용자 친화적 메시지

- **재사용 가능한 모달 컴포넌트 시스템**
  - `AlertModal.jsx`: 타입별 알림, 크기 조절, 테마 적용, 접근성 지원
  - `ConfirmModal.jsx`: AlertModal 기반 확인 다이얼로그
  - 기존 ModalOne 컴포넌트 완전 교체

- **LoadingSpinner 컴포넌트**
  - 다양한 크기/색상 지원
  - 접근성 고려된 디자인
  - 테마 시스템 통합

#### 🎨 테마 시스템 대폭 확장
- **테마 개수 확장**: 6개 → 10개 (67% 증가)
  - 기존: modern, retro, sunset, midnight, nature, elegant
  - 추가: ocean, forest, cosmic, vintage

- **테마 속성 대폭 확장**: 6개 → 30개+ (400% 증가)
  - 기본 색상: textPrimary, shadowColor, successColor, errorColor, warningColor, infoColor
  - 그라디언트: gradientBg, gradientText
  - 상태별 배경: successBg, errorBg, warningBg, infoBg
  - UI 스타일: disabledBg, selectionBg, focusRing, scrollbarTrack 등

- **테마 헬퍼 함수 시스템**: 30개+ 함수 추가
  - 기본: getPageTheme, getCardTheme, getButtonTheme
  - 상태별: getStatusTextTheme, getBadgeTheme, getProgressTheme
  - 향상된: getEnhancedButtonTheme, getInteractiveCardTheme
  - 특수: getDisabledTheme, getActiveTheme, getFocusRingTheme
  - UI별: getTableTheme, getTooltipTheme, getDropdownTheme

#### 🛡️ 안정성 및 에러 처리 강화
- **MemoDetail.jsx 대폭 개선**
  - dayjs 플러그인 추가 (utc, timezone, relativeTime)
  - 에러 처리 강화 (try-catch, 재시도 로직, MAX_RETRY_COUNT)
  - 404, 권한 오류 등 구분된 에러 상태 UI
  - 공유 기능 개선 (네이티브 공유 API, 메타 태그 업데이트)

- **RegisterPage.jsx 개선**
  - 중복 닉네임 체크 기능 (checkNicknameAvailability)
  - 폼 유효성 검사 강화 (validateForm 함수)
  - 재시도 로직 (retryCount, MAX_RETRY_COUNT)
  - 실시간 유효성 검사 (디바운싱 적용)
  - 필드별 에러 메시지 UI 개선

- **SettingPage.jsx 개선**
  - 기존 ModalOne을 새로운 AlertModal로 교체
  - 에러 처리 개선 (로그아웃 확인, 마이그레이션 경고)
  - Redux 토스트 시스템 통합

#### ⚡ 성능 최적화
- **SearchPage.jsx 성능 최적화**
  - 대량 데이터 처리를 위한 페이지네이션 구현
  - useCallback, useMemo 훅 사용한 성능 최적화
  - Firebase 쿼리 최적화 (limit, startAfter, orderBy)
  - 더 보기 버튼 추가 (handleLoadMore)
  - 클라이언트 사이드 페이지네이션

#### 🔔 알림 시스템 개선
- **notificationUtils.js 개선**
  - Redux 토스트 시스템 통합
  - 안전한 Firestore 작업 함수 (safeFirestoreOperation)
  - 댓글 알림 생성 함수 개선 (병렬 처리, 에러 처리 강화)

#### 🧹 코드 정리 및 최적화
- **UI 테스트 컴포넌트 제거**
  - UITestPage.jsx 삭제 (프로덕션 준비)
  - AppRouter.jsx에서 UI 테스트 라우트 제거
  - HeaderLayout.jsx에서 UI 테스트 버튼 제거

- **LayoutWrapper 개선**
  - 새로운 테마 헬퍼 함수 적용
  - 체계적인 테마 클래스 관리
  - 부드러운 테마 전환 애니메이션 추가

#### 🔧 기술적 개선
- **Redux Toolkit 토스트 상태 관리**
  - 중앙집중식 토스트 상태 관리
  - 타입별 토스트 (success, error, warning, info)
  - 자동 제거 및 수동 제거 지원

- **에러 처리 및 재시도 로직**
  - 네트워크 오류, 권한 오류 구분 처리
  - 사용자 친화적 에러 메시지
  - 자동 재시도 메커니즘

- **성능 최적화**
  - React 훅 최적화 (useCallback, useMemo)
  - Firebase 쿼리 최적화
  - 컴포넌트 렌더링 최적화

#### 📦 새로 생성된 파일
- `src/store/toast/slice.js`: Redux 토스트 상태 관리
- `src/components/common/AlertModal.jsx`: 재사용 가능한 알림 모달
- `src/components/common/ConfirmModal.jsx`: 확인 다이얼로그 모달
- `src/components/LoadingSpinner.jsx`: 로딩 스피너 컴포넌트
- `src/utils/themeHelper.js`: 30개+ 테마 헬퍼 함수

#### 📊 성과 지표
- **테마 개수**: 6개 → 10개 (67% 증가)
- **테마 속성**: 6개 → 30개+ (400% 증가)
- **헬퍼 함수**: 0개 → 30개+
- **새 파일 생성**: 10개+
- **기존 파일 개선**: 15개+
- **코드 라인 추가**: 2000줄+

### 💡 사용자 경험 개선
- **즉시 피드백**: 모든 액션에 대한 토스트 알림
- **에러 처리**: 사용자 친화적 에러 메시지
- **성능**: 대량 데이터 처리 최적화
- **접근성**: 모든 컴포넌트에 접근성 고려
- **일관성**: 통합된 디자인 시스템

---

## [1.4.0] - 2024-12-30

### 🔔 PWA 알림 시스템 완전 구현
- **Service Worker 기반 PWA 알림**
  - 완전한 PWA 지원 (Progressive Web App)
  - Service Worker를 통한 백그라운드 알림 처리
  - 오프라인 캐싱 및 성능 최적화
  - 알림 클릭 시 해당 노트/페이지로 자동 이동

- **통합 알림 시스템**
  - PWA 우선, 실패 시 브라우저 알림으로 fallback
  - 댓글, 대댓글, 멘션, 새 노트 알림 지원
  - 실시간 알림 수신 및 처리
  - 알림 권한 관리 시스템

- **알림 설정 UI 컴포넌트**
  - 설정 페이지에 전용 알림 설정 섹션 추가
  - 푸시 구독 활성화/비활성화 기능
  - 알림 권한 상태 실시간 표시
  - 알림 타입별 설명 및 안내

### 🔐 보안 및 데이터 관리
- **Firestore 보안 규칙 확장**
  - `pushSubscriptions` 컬렉션 규칙 추가
  - 사용자별 푸시 구독 정보 보호
  - 본인 또는 관리자만 접근 가능한 권한 체계

- **푸시 구독 정보 관리**
  - Firestore에 구독 정보 안전하게 저장
  - 구독 생성/해제 시 자동 DB 동기화
  - 구독 상태 실시간 추적

### 🎨 UI/UX 개선
- **테마 시스템 완전 통합**
  - 모든 알림 컴포넌트에 테마 적용
  - 다크모드/라이트모드 자동 대응
  - 일관된 디자인 언어 적용

- **반응형 알림 디자인**
  - 모바일/데스크톱 최적화
  - 터치 친화적 인터페이스
  - 접근성 고려된 디자인

### 📱 PWA 기능 강화
- **PWA Manifest 개선**
  - 앱 바로가기 추가 (새 노트 작성, 알림 확인)
  - 스크린샷 정보 추가
  - 카테고리, 언어, 방향 설정

- **Service Worker 최적화**
  - 효율적인 캐싱 전략
  - 백그라운드 동기화 지원
  - 알림 액션 버튼 (열기, 닫기)

### 🔧 기술적 개선
- **알림 유틸리티 함수 확장**
  - `showNotification()`: 통합 알림 함수
  - `subscribeToPush()`: 푸시 구독 관리
  - `savePushSubscriptionToFirestore()`: 구독 정보 저장
  - 각 알림 타입별 전용 함수들

- **Firebase 설정 최적화**
  - `firebase.json` 설정 개선
  - Service Worker 캐시 제어 헤더 추가
  - 빌드 디렉토리 설정 수정

### 📖 문서화
- **PWA_PUSH_SETUP.md 작성**
  - 완전한 PWA 알림 시스템 가이드
  - 기술적 구현 상세 설명
  - 사용 방법 및 주의사항
  - 디버깅 및 테스트 방법

### 🚀 배포 및 성능
- **프로덕션 배포 완료**
  - Firebase Hosting에 PWA 배포
  - HTTPS 환경에서 완전한 PWA 기능 지원
  - 실제 환경에서 푸시 알림 테스트 완료

- **성능 최적화**
  - 30초마다 새 알림 자동 확인
  - 효율적인 Firestore 쿼리 사용
  - 최적화된 번들 크기

### 💡 사용자 경험
- **직관적인 알림 관리**
  - 설정 페이지에서 원클릭 권한 설정
  - 알림 상태 실시간 피드백
  - 권한 거부 시 친절한 안내 메시지

- **완전한 알림 생태계**
  - 실시간 브라우저 알림 (앱 사용 중)
  - 알림 벨에서 놓친 알림 확인
  - 알림 클릭 시 관련 콘텐츠로 즉시 이동

---

## [1.3.0] - 2024-12-30

### ✨ 새로운 기능
- **대댓글(답글) 시스템 구현**
  - 댓글에 답글 작성 및 관리 기능
  - 대댓글 표시/숨기기 토글 기능
  - 대댓글 개수 표시
  - 대댓글별 신고 기능

- **대댓글 알림 시스템**
  - 브라우저 푸시 알림 (클릭 시 해당 게시글로 이동)
  - 토스트 메시지 알림
  - 헤더 알림 벨 시스템
  - 실시간 알림 업데이트

- **관리자 기능 확장**
  - 댓글 시스템 마이그레이션 기능
  - 기존 댓글에 ID 및 대댓글 필드 추가

### 🎨 디자인 개선
- **테마 시스템 대폭 확장**
  - `cardBg`: 카드 배경색
  - `textSecondary`: 보조 텍스트 색상
  - `linkColor`: 링크 색상
  - `hoverBg`: 호버 배경색
  - `borderColor`: 테두리 색상
  - `dividerColor`: 구분선 색상

- **CommentSection 디자인 개선**
  - 댓글과 대댓글 시각적 구분 강화
  - 호버 효과 및 인터랙션 개선
  - 답글 작성 폼 디자인 개선
  - 테마별 일관된 색상 적용

- **ReportButton 디자인 개선**
  - 테마 시스템 완전 통합
  - 다양한 크기 및 변형 지원
  - 호버 효과 개선

### 🔧 기술적 개선
- **Firestore 보안 규칙 업데이트**
  - 대댓글 관련 필드 업데이트 권한 추가
  - 관리자 마이그레이션 권한 설정

- **댓글 데이터 구조 확장**
  - 각 댓글에 고유 ID 추가
  - `replies` 배열 필드 추가
  - `replyCount` 필드 추가

- **새로운 유틸리티 함수**
  - `addReplyToComment()`: 대댓글 추가 함수
  - 대댓글 알림 생성 함수들
  - 브라우저 푸시 알림 유틸리티

### 🐛 버그 수정
- 테마 시스템 안정성 향상
- 알림 시스템 오류 처리 개선
- 댓글 정렬 및 표시 로직 개선

---

## [1.2.0] - 2024-12-29

### ✨ 새로운 기능
- **구독 시스템 구현**
  - 사용자 구독/구독취소 기능
  - 구독자 수 실시간 표시
  - 구독 상태 관리

- **알림 시스템 구현**
  - 댓글, 대댓글, 멘션, 새 노트 알림
  - 실시간 알림 업데이트
  - 읽지 않은 알림 개수 표시
  - 토스트 메시지 시스템

- **브라우저 푸시 알림**
  - 네이티브 브라우저 알림
  - 알림 클릭 시 해당 페이지로 이동
  - 권한 요청 시스템

### 🎨 UI/UX 개선
- **검색 기능 대폭 개선**
  - 실시간 검색 제안
  - 검색 히스토리 관리
  - 고급 필터 패널
  - 키보드 단축키 지원

- **프로필 이미지 시스템**
  - DiceBear API 아바타 시스템
  - 사용자 이름 기반 일관된 아바타
  - 6가지 배경색 자동 선택

### 🔧 기술적 개선
- Redux selector 메모이제이션
- 무한 스크롤 최적화
- Firestore 보안 규칙 강화
- 성능 최적화

---

## [1.1.0] - 2024-12-28

### ✨ 새로운 기능
- 기본 노트 작성 및 관리 시스템
- 댓글 시스템
- 사용자 인증 시스템
- 테마 시스템 (6가지 테마)

### 🎨 UI/UX
- 반응형 디자인
- 다크 모드 지원
- 모던한 UI 컴포넌트

### 🔧 기술 스택
- React 19
- Firebase (Auth, Firestore, Storage, Hosting)
- Redux Toolkit
- Tailwind CSS
- React Query 