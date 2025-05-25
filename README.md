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

### 🎨 개성있는 프로필
- 자신만의 프로필 페이지 커스터마이징
- 좋아하는 명언, 취미 등 개성 표현
- 작성한 노트 모아보기

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
- React
- TailwindCSS
- Redux Toolkit
- TipTap Editor
- Framer Motion

### Backend
- Firebase
  - Authentication
  - Firestore
  - Storage
  - Hosting

### 도구
- Vite
- Day.js
- PropTypes

## 📁 프로젝트 구조
```
src/
├── components/      # 공통 컴포넌트
├── features/        # 기능별 컴포넌트
├── hooks/          # 커스텀 훅
├── pages/          # 페이지 컴포넌트
├── services/       # Firebase 설정
├── store/          # Redux 스토어
├── utils/          # 유틸리티 함수
└── App.jsx         # 앱 진입점
```

## 🔒 보안 규칙

### Firestore 규칙
- 사용자 인증 기반 접근 제어
- 데이터 유효성 검사
- 사용자별 권한 관리

### Storage 규칙
- 이미지 파일 제한 (5MB)
- 파일 형식 검증
- 사용자별 접근 권한

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