# 📝 NoteRoom

감정과 생각을 기록하고 공유하는 소셜 노트 플랫폼

## 🌟 주요 기능

### 📊 감정 기록
- 감정 온도 시스템으로 현재 감정 상태 기록
- 일기, 시, 사진 등 다양한 형태로 감정 표현
- 카테고리별 노트 관리

### 🤝 소셜 기능
- 다른 사용자의 노트 열람
- 좋아요 기능으로 공감 표현
- **💬 댓글 및 대댓글 시스템** - 계층형 댓글로 깊이 있는 소통
- **🔔 실시간 알림 시스템** - 댓글, 멘션, 새 노트 알림
- **👥 구독 시스템** - 관심 있는 사용자 구독 및 알림
- 프로필을 통한 사용자 간 소통
- 🔗 노트 공유 기능 - 독립적인 URL로 노트 공유 가능

### 🎨 개성있는 프로필
- 자신만의 프로필 페이지 커스터마이징
- **🎨 6가지 테마 시스템** - modern, retro, dark, dreamy, ocean, forest
- **🖼️ 자동 아바타 시스템** - DiceBear API 기반 일관된 프로필 이미지
- 좋아하는 명언, 취미 등 개성 표현
- 작성한 노트 모아보기

### 📱 공유 및 접근성
- 🔗 독립적인 노트 URL - 각 노트마다 고유한 공유 가능한 링크
- 📱 네이티브 공유 API - 모바일에서 시스템 공유 기능 지원
- 📋 클립보드 복사 - 데스크톱에서 원클릭 링크 복사
- 🔙 뒤로가기 네비게이션 - 직관적인 페이지 이동
- 🔍 SEO 최적화 - 검색 엔진 친화적인 URL 구조

### 🔔 알림 시스템
- **📱 브라우저 푸시 알림** - 네이티브 브라우저 알림 (클릭 시 해당 게시글로 이동)
- **🍞 토스트 메시지** - 실시간 액션 피드백
- **🔔 헤더 알림 벨** - 읽지 않은 알림 개수 표시
- **⚡ 실시간 업데이트** - 30초마다 자동 알림 확인

## 🔄 최근 업데이트 (v1.3.0)

### 💬 대댓글 시스템 구현
- **답글 작성 기능** - 각 댓글에 답글 작성 가능
- **계층형 구조** - 댓글과 대댓글의 시각적 구분
- **토글 기능** - 대댓글 표시/숨기기 기능
- **개수 표시** - 대댓글 개수 실시간 표시
- **신고 기능** - 대댓글별 개별 신고 가능

### 🔔 알림 시스템 확장
- **대댓글 알림** - 내 댓글에 답글이 달릴 때 알림
- **브라우저 푸시 알림** - 네이티브 브라우저 알림으로 실시간 알림
- **알림 클릭 이동** - 알림 클릭 시 해당 게시글로 자동 이동
- **토스트 메시지** - 모든 액션에 대한 즉시 피드백

### 🎨 테마 시스템 대폭 확장
- **새로운 테마 속성 추가**
  - `cardBg`: 카드 배경색
  - `textSecondary`: 보조 텍스트 색상
  - `linkColor`: 링크 색상
  - `hoverBg`: 호버 배경색
  - `borderColor`: 테두리 색상
  - `dividerColor`: 구분선 색상

### 🔧 관리자 기능 확장
- **댓글 시스템 마이그레이션** - 기존 댓글에 ID 및 대댓글 필드 자동 추가
- **시스템 설정 개선** - 관리자 페이지에서 데이터 마이그레이션 기능

## 🚀 시작하기

### 필수 요구사항
- Node.js 18.0.0 이상
- npm 9.0.0 이상
- Firebase 프로젝트

### 설치 방법

1. 저장소 클론
```bash
git clone https://github.com/yourusername/noteroom.git
cd noteroom
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env` 파일을 생성하고 Firebase 설정 추가:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. 개발 서버 실행
```bash
npm run dev
```

### 배포 방법

1. 프로젝트 빌드
```bash
npm run build
```

2. Firebase 배포
```bash
firebase deploy
```

## 🛠 기술 스택

### Frontend
- **React 19** - 최신 React 기능 활용
- **TailwindCSS** - 유틸리티 우선 CSS 프레임워크
- **Redux Toolkit** - 상태 관리
- **React Router** - 클라이언트 사이드 라우팅
- **TipTap Editor** - 리치 텍스트 에디터
- **Framer Motion** - 애니메이션 라이브러리

### Backend
- **Firebase**
  - Authentication - 사용자 인증
  - Firestore - NoSQL 데이터베이스
  - Storage - 파일 저장소
  - Hosting - 정적 사이트 호스팅

### 도구 및 라이브러리
- **Vite** - 빠른 빌드 도구
- **Day.js** - 날짜 처리
- **PropTypes** - 타입 검증
- **React Icons** - 아이콘 라이브러리

## 📁 프로젝트 구조
```
src/
├── components/      # 공통 컴포넌트
│   ├── ui/         # UI 컴포넌트
│   └── modals/     # 모달 컴포넌트
├── features/        # 기능별 컴포넌트
│   ├── MainHome/   # 메인 홈 기능
│   ├── UserProfile/ # 프로필 기능
│   └── ThreadPage/ # 스레드 페이지 기능
├── hooks/          # 커스텀 훅
├── pages/          # 페이지 컴포넌트
├── router/         # 라우팅 설정
├── services/       # Firebase 설정
├── store/          # Redux 스토어
├── utils/          # 유틸리티 함수
└── App.jsx         # 앱 진입점
```

## 🔗 주요 라우트

- `/` - 메인 홈페이지 (노트 피드)
- `/note/:id` - 노트 상세 페이지 (공유 가능)
- `/profile/:userId` - 사용자 프로필
- `/write` - 노트 작성
- `/search/:searchParam` - 노트 검색
- `/thread` - 세로 스크롤 피드
- `/setting` - 설정 페이지

## 🔒 보안 규칙

### Firestore 규칙
- 사용자 인증 기반 접근 제어
- 데이터 유효성 검사
- 사용자별 권한 관리

### Storage 규칙
- 이미지 파일 제한 (5MB)
- 파일 형식 검증
- 사용자별 접근 권한

## 🎯 향후 계획

### 단기 목표
- [ ] 토스트 메시지 시스템 구현
- [ ] 북마크 기능 추가
- [ ] 검색 결과 하이라이팅
- [ ] 무한 스크롤 성능 최적화

### 중기 목표
- [ ] TypeScript 마이그레이션
- [ ] 서버사이드 렌더링 (SSR)
- [ ] PWA 기능 추가
- [ ] 다크모드 개선

### 장기 목표
- [ ] 실시간 채팅 기능
- [ ] 노트 협업 기능
- [ ] AI 기반 감정 분석
- [ ] 모바일 앱 개발

## 🤝 기여하기
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 라이선스
MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👥 팀 구성
- 개발: [개발자 이름]
- 디자인: [디자이너 이름]
- 기획: [기획자 이름]

## 📞 문의
프로젝트에 대한 문의사항이 있으시다면 [이슈](https://github.com/yourusername/noteroom/issues)를 생성해주세요.