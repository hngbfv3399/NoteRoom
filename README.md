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
- 프로필을 통한 사용자 간 소통
- 🔗 노트 공유 기능 - 독립적인 URL로 노트 공유 가능

### 🎨 개성있는 프로필
- 자신만의 프로필 페이지 커스터마이징
- 좋아하는 명언, 취미 등 개성 표현
- 작성한 노트 모아보기

### 📱 공유 및 접근성
- �� 독립적인 노트 URL - 각 노트마다 고유한 공유 가능한 링크
- 📱 네이티브 공유 API - 모바일에서 시스템 공유 기능 지원
- 📋 클립보드 복사 - 데스크톱에서 원클릭 링크 복사
- 🔙 뒤로가기 네비게이션 - 직관적인 페이지 이동
- 🔍 SEO 최적화 - 검색 엔진 친화적인 URL 구조

## 🔄 최근 업데이트 (v2.0)

### 🚀 공유 기능 대폭 개선
- 🔄 모달 → 페이지 전환 - 기존 모달 방식에서 독립 페이지 방식으로 변경
- 🔗 공유 가능한 URL - /note/:id 형태의 직접 접근 가능한 링크
- 🔘 공유 버튼 추가 - 노트 카드와 상세 페이지에 공유 버튼 배치
- 🤝 크로스 플랫폼 공유 - 모바일/데스크톱 환경에 최적화된 공유 방식

### 🎯 사용자 경험 개선
- 🔙 직관적인 네비게이션 - 뒤로가기 버튼으로 쉬운 페이지 이동
- 🔄 로딩 상태 개선 - 노트 로딩 시 스켈레톤 UI 제공
- 🚨 에러 처리 강화 - 노트를 찾을 수 없는 경우 친화적인 에러 페이지
- �� 접근성 향상 - ARIA 라벨과 키보드 네비게이션 지원

### 🏗️ 아키텍처 개선
- 🔄 컴포넌트 분리 - 재사용 가능한 작은 컴포넌트로 분할
- 🔄 커스텀 훅 활용 - useNoteInteraction 훅으로 상호작용 로직 분리
- 🚀 성능 최적화 - React.memo와 useCallback을 통한 렌더링 최적화
- 🔍 타입 안정성 - PropTypes를 통한 컴포넌트 인터페이스 명확화

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