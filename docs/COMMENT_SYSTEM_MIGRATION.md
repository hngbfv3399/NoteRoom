# 댓글 시스템 마이그레이션 가이드

## 개요

NoteRoom의 댓글 시스템이 `author` 필드 구조로 완전히 마이그레이션되었습니다. 이 문서는 마이그레이션 내용과 사용 방법을 설명합니다.

## 마이그레이션 내용

### 1. 데이터 구조 변경

#### 기존 구조
```javascript
{
  userName: "사용자닉네임",
  userUid: "사용자ID",
  content: "댓글내용",
  createdAt: Date
}
```

#### 새로운 구조
```javascript
{
  id: "comment_1234567890_abc123",      // 고유 ID 추가
  author: "사용자닉네임",                // author 필드 (우선 사용)
  userName: "사용자닉네임",              // 호환성을 위해 유지
  authorUid: "사용자ID",                // authorUid 필드 (우선 사용)
  userUid: "사용자ID",                  // 호환성을 위해 유지
  content: "댓글내용",
  createdAt: Date,
  replies: [],                          // 대댓글 배열
  replyCount: 0                         // 대댓글 수
}
```

### 2. 대댓글 시스템 개선

- 각 댓글에 `replies` 배열 추가
- `replyCount` 필드로 대댓글 수 추적
- 대댓글도 동일한 `author` 필드 구조 사용

### 3. ID 시스템 도입

- 모든 댓글과 대댓글에 고유 ID 부여
- 형식: `comment_타임스탬프_랜덤문자열` 또는 `reply_타임스탬프_랜덤문자열`

## 마이그레이션 실행 방법

### 관리자 페이지에서 실행

1. **관리자 페이지 접속**: `/admin`
2. **시스템 설정 탭** → **데이터 마이그레이션** 선택
3. **댓글 Author 필드 마이그레이션** 버튼 클릭
4. 확인 대화상자에서 **확인** 클릭

### 마이그레이션 단계

1. **댓글 시스템 마이그레이션**: 기본 ID와 대댓글 필드 추가
2. **Author 필드 마이그레이션**: author/authorUid 필드 구조로 변경
3. **닉네임 업데이트**: 최신 사용자 정보로 닉네임 동기화

## 테스트 방법

### 관리자 도구 사용

1. **관리자 페이지** → **데이터 마이그레이션**
2. **댓글 시스템 테스트** 버튼 클릭
3. 테스트할 노트 ID 입력
4. 브라우저 콘솔에서 상세 결과 확인

### 수동 테스트

```javascript
// 브라우저 콘솔에서 실행
const { testCommentSystem } = await import('/src/utils/firebaseNoteDataUtil.js');
await testCommentSystem('노트ID');
```

## 새로운 댓글 작성 플로우

### 1. 댓글 작성

```javascript
const newComment = {
  id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  author: userData?.displayName || "익명",
  userName: userData?.displayName || "익명", // 호환성
  authorUid: currentUser.uid,
  content: content.trim(),
  createdAt: new Date(),
  replies: [],
  replyCount: 0
};
```

### 2. 대댓글 작성

```javascript
const newReply = {
  id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  author: userData?.displayName || "익명",
  userName: userData?.displayName || "익명", // 호환성
  authorUid: currentUser.uid,
  content: content.trim(),
  createdAt: new Date()
};
```

## UI 표시 우선순위

### 댓글 작성자 표시
```javascript
// 우선순위: author > userName > "익명"
const displayName = comment.author || comment.userName || "익명";
```

### 사용자 ID 참조
```javascript
// 우선순위: authorUid > userUid
const userId = comment.authorUid || comment.userUid;
```

## 호환성

### 기존 댓글 지원

- 기존 `userName`, `userUid` 필드는 계속 지원
- 마이그레이션 후에도 기존 댓글 정상 표시
- 점진적 마이그레이션으로 서비스 중단 없음

### API 호환성

- 기존 댓글 조회 API 그대로 사용 가능
- 새로운 필드는 선택적으로 활용

## 주의사항

### 마이그레이션 전

1. **데이터베이스 백업** 권장
2. **서비스 사용량이 적은 시간대** 선택
3. **관리자 권한** 필요

### 마이그레이션 중

1. **중단하지 말 것** - 데이터 불일치 가능성
2. **동시 접속자 수** 모니터링
3. **에러 로그** 확인

### 마이그레이션 후

1. **댓글 작성/조회** 테스트
2. **대댓글 기능** 테스트
3. **닉네임 표시** 확인

## 문제 해결

### 마이그레이션 실패 시

1. **에러 로그 확인**
2. **부분 마이그레이션 상태 점검**
3. **수동 복구 스크립트 실행**

### 댓글 표시 문제

1. **브라우저 캐시 클리어**
2. **React Query 캐시 무효화**
3. **페이지 새로고침**

### 닉네임 동기화 문제

1. **댓글 닉네임 업데이트** 실행
2. **사용자 프로필 확인**
3. **Firestore 권한 점검**

## 성능 최적화

### 댓글 로딩

- React Query로 캐싱 최적화
- 페이지네이션 지원 준비
- 무한 스크롤 고려

### 대댓글 처리

- 지연 로딩 구현
- 접기/펼치기 상태 관리
- 메모리 사용량 최적화

## 향후 계획

### 단기 계획

1. **댓글 편집/삭제** 기능 추가
2. **댓글 좋아요** 시스템 도입
3. **댓글 알림** 개선

### 장기 계획

1. **댓글 검색** 기능
2. **댓글 신고** 시스템 강화
3. **실시간 댓글** 업데이트

## 관련 파일

### 핵심 파일
- `src/utils/firebaseNoteDataUtil.js` - 댓글 CRUD 로직
- `src/hooks/useNoteComments.js` - React Query 훅
- `src/components/CommentSection.jsx` - 댓글 UI 컴포넌트

### 관리자 도구
- `src/components/admin/SystemSettings.jsx` - 마이그레이션 UI
- `src/utils/adminUtils.js` - 관리자 유틸리티

### 테스트 도구
- `testCommentSystem()` - 댓글 시스템 테스트 함수
- `migrateCommentsToAuthorField()` - 마이그레이션 함수

## 연락처

마이그레이션 관련 문의사항이 있으시면 개발팀에 연락해주세요.

---

**마지막 업데이트**: 2024년 12월 19일  
**버전**: 1.0.0  
**상태**: 완료 