# NoteRoom Project

## 2025년 5월 13일
- vite 환경으로 React 프로젝트 생성
- Firebase 서버 연동
- github 연동
- 필요 라이브러리 설치 (redux, tailwind, react-router, firebase, tiptap등)
- 페이지 및 코드 분할을 위해 프로젝트 구조 세팅
---
## 2025년 5월 14일
- 기본 레이아웃 설계
    - 3개 레이아웃 생성(Header,main,Navbar) 이때 Navbar는 footer 역할과 비슷함
    - main 영역은 라우터에 맞게 보이도록 코딩
- 모바일 디자인 위주로 작성
---
## 2025년 5월 15일
- 홈 화면 디자인 초안 구상 및 구현
---

## 2025년 5월 16일
- 쓰레드 화면 디자인 초안 구상 및 구현
---

## 2025년 5월 17일
- 에디터 화면 디자인 초안 구상 및 구현
- tiptap 라이브러리 활용 시작
- tailwind 스타일 초기화로 인한 오류 수정
---
## 2025년 5월 18일
- tiptap editor.chain()을 이용한 토글 버튼 코드 작성
---

## 2025년 5월 19일
- 유저페이지 구현
---
## 2025년 5월 20일
- 세팅페이지 작성
    - redux 설치 및 themeSlice 생성(테마 스타일 전역상태로 관리 하기 위함)
    - 공통 Button UI 생성
    - 헬퍼 함수 themeHelper.js 생성 및 재사용
- 프로젝트 컴포넌트 구조 분할(유지보수 용이)
- 디자인 레이아웃 오류 수정(ex : main 영역 넘침 현상 해결)

## 2025년 5월 21일
- 메인 홈 페이지 기능 확장
    - noteData redux로 전역상태 관리
    - 정렬 및 필터기능 추가
    - 감정 분석, 친구 찾기 모달창 생성(framer)

## 2025년 5월 22일
- Firebase 통신
    - Editor 관련 페이지 전체 수정
    - firebase 유틸 함수 생성(생성 및 삭제)
-React Query 사용
    - MainHome 관련 페이지 전체 수정
        - Redux 삭제 React Query 변환
        - ThreadPage수정