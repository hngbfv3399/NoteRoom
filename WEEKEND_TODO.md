# 🚀 주말 TODO: 번들 크기 최적화

> **목표**: 메인 번들 1,344KB → 500KB 이하로 감소  
> **기간**: 주말 (2일간)  
> **우선순위**: 높음 🔥

## 📅 Day 1: 페이지 분할 (토요일)

### ✅ 준비 작업
- [ ] 현재 번들 크기 측정 및 기록
- [ ] 번들 분석기 설치: `npm install --save-dev rollup-plugin-visualizer`
- [ ] 기준점 성능 측정 (Lighthouse)

### 🎯 메인 작업: React.lazy 적용
- [ ] **App.jsx 수정**: 모든 페이지 컴포넌트를 lazy loading으로 변경
  ```javascript
  // 변경 대상 페이지들
  - SearchPage
  - WritePage  
  - ProfilePage
  - SettingsPage
  - TestPage
  - MyReportsPage
  - UserProfile
  ```

- [ ] **Suspense 경계 설정**: 각 라우트에 로딩 상태 추가
- [ ] **로딩 컴포넌트 개선**: 더 나은 UX를 위한 스켈레톤 UI
- [ ] **에러 경계 추가**: lazy loading 실패 시 fallback

### 🧪 테스트
- [ ] 모든 페이지 정상 로딩 확인
- [ ] 네트워크 탭에서 청크 분할 확인
- [ ] 번들 크기 측정 (1차 개선 효과 확인)

---

## 📅 Day 2: 에디터 & 유틸리티 최적화 (일요일)

### 🎯 오전: TipTap 에디터 분할
- [ ] **에디터 확장 분리**: `editorExtensions.js` 파일 생성
- [ ] **동적 로딩 적용**: WriteEditor에서 필요시에만 로드
- [ ] **확장별 분할**: 
  ```javascript
  // 기본 확장 (항상 로드)
  - StarterKit
  
  // 고급 확장 (필요시 로드)  
  - Image, Color, TextAlign
  - Highlight, Subscript, Superscript
  ```

### 🎯 오후: 유틸리티 함수 정리
- [ ] **firebaseNoteDataUtil.js 분할**:
  - 읽기 전용 함수들 → `firebaseRead.js`
  - 쓰기 함수들 → `firebaseWrite.js`
  - 검색 관련 → `firebaseSearch.js`

- [ ] **동적 import 일관성 확보**:
  - [ ] WriteEditer.jsx의 동적 import 수정
  - [ ] 다른 파일들의 정적 import 제거
  - [ ] 중복 번들링 문제 해결

- [ ] **성능 모니터링 코드 분할**:
  - [ ] performanceMonitor → 개발 모드에서만 로드
  - [ ] autoPerformanceTest → 별도 청크

### 🧪 중간 테스트
- [ ] 번들 크기 재측정 (2차 개선 효과)
- [ ] 에디터 기능 정상 작동 확인
- [ ] 검색 기능 정상 작동 확인

---

## 📅 마무리: Vite 설정 최적화

### 🔧 vite.config.js 개선
- [ ] **manualChunks 설정**:
  ```javascript
  manualChunks: {
    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
    'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
    'vendor-ui': ['@tanstack/react-query', 'react-redux'],
    'editor': ['@tiptap/react', '@tiptap/starter-kit'],
    'utils': ['lodash', 'dayjs']
  }
  ```

- [ ] **청크 크기 제한 설정**:
  ```javascript
  chunkSizeWarningLimit: 500
  ```

### 📊 최종 검증
- [ ] **번들 분석**: `npm run build -- --analyze`
- [ ] **성능 측정**: Lighthouse 점수 확인
- [ ] **실제 로딩 테스트**: 느린 네트워크에서 테스트
- [ ] **기능 테스트**: 모든 주요 기능 정상 작동 확인

---

## 🎯 성공 기준

### 📈 정량적 목표
- [x] 메인 번들: 1,344KB → **500KB 이하**
- [x] 초기 로드: 현재 대비 **50% 이상 개선**
- [x] Lighthouse Performance: **90점 이상**
- [x] 첫 화면 로딩: **2초 이내**

### 🔍 정성적 목표
- [x] 사용자 체감 성능 개선
- [x] 에디터 미사용 시 빠른 로딩
- [x] 페이지 전환 시 부드러운 경험
- [x] 모든 기능 정상 작동

---

## 🛠️ 필요한 도구 & 명령어

### 설치할 패키지
```bash
npm install --save-dev rollup-plugin-visualizer
npm install --save-dev vite-bundle-analyzer
```

### 유용한 명령어
```bash
# 번들 분석
npm run build -- --analyze

# 개발 서버 (성능 확인)
npm run dev

# 프로덕션 빌드
npm run build

# 프리뷰 (빌드 결과 확인)
npm run preview
```

### 측정 도구
- Chrome DevTools → Network 탭
- Lighthouse → Performance 측정
- Bundle Analyzer → 청크 시각화

---

## ⚠️ 주의사항

### 🚨 반드시 확인할 것
- [ ] 코드 분할 후 모든 기능 정상 작동
- [ ] 에러 경계 설정으로 안정성 확보
- [ ] 로딩 상태 UX 개선
- [ ] 캐싱 전략 고려

### 🔄 롤백 계획
- 현재 상태 백업: `git branch backup-before-optimization`
- 문제 발생 시 즉시 롤백 가능하도록 준비

---

## 📝 진행 상황 체크

### Day 1 완료 후
- [ ] 페이지 분할 완료
- [ ] 번들 크기: ___KB (목표: 800KB 이하)
- [ ] 발견된 이슈: ________________

### Day 2 완료 후  
- [ ] 에디터 최적화 완료
- [ ] 유틸리티 정리 완료
- [ ] 최종 번들 크기: ___KB (목표: 500KB 이하)
- [ ] Lighthouse 점수: ___점 (목표: 90점 이상)

---

**🎯 화이팅! 주말에 성능 최적화 완주하자! 🚀**

*작성일: 2024.12.28*  
*예상 소요시간: 8-10시간* 