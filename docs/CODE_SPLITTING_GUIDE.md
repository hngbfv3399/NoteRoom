# 코드 분할 및 최적화 가이드

## 📁 새로운 프로젝트 구조

### 디렉토리 구조
```
src/
├── features/           # 기능별 모듈 (비즈니스 로직 + UI)
│   ├── admin/         # 관리자 기능
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── index.js   # 진입점 (lazy loading)
│   ├── auth/          # 인증 기능
│   └── notes/         # 노트 기능
├── shared/            # 공통 모듈
│   ├── components/    # 재사용 가능한 UI 컴포넌트
│   ├── hooks/         # 공통 훅
│   ├── utils/         # 유틸리티 함수
│   └── constants/     # 상수
├── pages/             # 라우팅 전용 (최소한의 코드)
├── router/            # 라우팅 설정
└── components/        # 레거시 컴포넌트 (점진적 마이그레이션)
```

## 🚀 성능 최적화 전략

### 1. 코드 분할 (Code Splitting)

#### Lazy Loading 적용
```javascript
// ❌ 기존 방식
import AdminDashboard from '@/components/admin/AdminDashboard';

// ✅ 최적화된 방식
const AdminDashboard = lazy(() => import('@/features/admin/components/AdminDashboard'));
```

#### 라우트 기반 분할
```javascript
// src/router/LazyRoutes.jsx
export const AdminPage = lazy(() => import('@/pages/AdminPage'));
export const UserProfile = lazy(() => import('@/pages/UserProfile'));

// 프리로딩 함수
export const preloadAdminRoutes = () => {
  import('@/pages/AdminPage');
  import('@/features/admin/components/AdminDashboard');
};
```

### 2. 번들 최적화

#### Vite 설정 최적화
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth'],
          'admin-features': ['./src/features/admin/index.js']
        }
      }
    }
  }
});
```

#### 번들 분석
```bash
# 번들 크기 분석
npm run build:analyze

# 결과: dist/bundle-analysis.html 생성
```

### 3. 컴포넌트 최적화

#### 메모이제이션 적용
```javascript
// ❌ 최적화 전
function DataTable({ data, columns }) {
  const filteredData = data.filter(/* ... */);
  return <table>...</table>;
}

// ✅ 최적화 후
const DataTable = memo(({ data, columns }) => {
  const filteredData = useMemo(() => 
    data.filter(/* ... */), [data]
  );
  
  const handleSort = useCallback((key) => {
    // 정렬 로직
  }, []);
  
  return <table>...</table>;
});
```

#### 가상화 적용 (대량 데이터)
```javascript
import { FixedSizeList as List } from 'react-window';

function VirtualizedTable({ items }) {
  return (
    <List
      height={400}
      itemCount={items.length}
      itemSize={60}
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index]}
        </div>
      )}
    </List>
  );
}
```

### 4. 성능 모니터링

#### 성능 측정 훅 사용
```javascript
import { usePerformanceMonitoring } from '@/shared/utils/performanceMonitor';

function MyComponent() {
  const { measureInteraction, measureMemory } = usePerformanceMonitoring('MyComponent');
  
  const handleClick = () => {
    const startTime = performance.now();
    // 작업 수행
    measureInteraction('click', startTime);
  };
  
  return <button onClick={handleClick}>클릭</button>;
}
```

#### 성능 리포트 확인
```javascript
import { logPerformanceReport } from '@/shared/utils/performanceMonitor';

// 개발 환경에서 성능 리포트 출력
if (import.meta.env.DEV) {
  logPerformanceReport();
}
```

## 📊 성능 메트릭

### 목표 지표
- **초기 로딩 시간**: < 2초
- **페이지 전환 시간**: < 500ms
- **렌더링 시간**: < 16ms (60fps)
- **메모리 사용량**: < 50MB
- **번들 크기**: 
  - 메인 청크: < 500KB
  - 벤더 청크: < 1MB
  - 기능별 청크: < 200KB

### 측정 도구
1. **Chrome DevTools**
   - Performance 탭
   - Memory 탭
   - Network 탭

2. **Lighthouse**
   - 성능 점수
   - 접근성 점수
   - SEO 점수

3. **Bundle Analyzer**
   - 번들 크기 분석
   - 중복 모듈 확인

## 🔧 최적화 체크리스트

### 코드 레벨
- [ ] 불필요한 리렌더링 제거 (React.memo, useMemo, useCallback)
- [ ] 큰 컴포넌트를 작은 단위로 분할
- [ ] 조건부 렌더링 최적화
- [ ] 이벤트 핸들러 최적화

### 번들 레벨
- [ ] 코드 분할 적용
- [ ] Tree shaking 확인
- [ ] 중복 의존성 제거
- [ ] 번들 크기 모니터링

### 네트워크 레벨
- [ ] 이미지 최적화 (WebP, 압축)
- [ ] 폰트 최적화
- [ ] 캐싱 전략 수립
- [ ] CDN 활용

### 사용자 경험
- [ ] 로딩 스피너 적절한 배치
- [ ] 스켈레톤 UI 적용
- [ ] 에러 바운더리 설정
- [ ] 접근성 개선

## 🚨 성능 경고 및 해결

### 일반적인 성능 문제

#### 1. 과도한 리렌더링
```javascript
// 문제: 매번 새로운 객체 생성
<Component style={{ margin: 10 }} />

// 해결: 스타일 객체 메모이제이션
const styles = useMemo(() => ({ margin: 10 }), []);
<Component style={styles} />
```

#### 2. 큰 번들 크기
```javascript
// 문제: 전체 라이브러리 import
import _ from 'lodash';

// 해결: 필요한 함수만 import
import debounce from 'lodash/debounce';
```

#### 3. 메모리 누수
```javascript
// 문제: 이벤트 리스너 정리 안함
useEffect(() => {
  window.addEventListener('scroll', handleScroll);
}, []);

// 해결: cleanup 함수 추가
useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

## 📈 마이그레이션 계획

### 단계별 마이그레이션

#### Phase 1: 관리자 기능 (완료)
- [x] AdminDashboard → features/admin/
- [x] RealTimeNotifications → features/admin/
- [x] PaginatedDataTable → shared/components/

#### Phase 2: 사용자 기능 (진행 예정)
- [ ] UserProfile → features/user/
- [ ] SettingPage → features/user/
- [ ] MyReportsPage → features/user/

#### Phase 3: 노트 기능 (진행 예정)
- [ ] WritePage → features/notes/
- [ ] ThreadPage → features/notes/
- [ ] MemoDetail → features/notes/

#### Phase 4: 공통 컴포넌트 (진행 예정)
- [ ] SearchInput → shared/components/
- [ ] CommentSection → shared/components/
- [ ] NotificationBell → shared/components/

## 🔍 모니터링 및 분석

### 성능 대시보드
개발 환경에서 브라우저 콘솔에서 성능 리포트 확인:
```javascript
// 성능 리포트 출력
console.group('🚀 성능 리포트');
console.log('렌더링 성능:', report.renderPerformance);
console.log('메모리 사용량:', report.memoryUsage);
console.log('사용자 상호작용:', report.userInteractions);
console.groupEnd();
```

### 지속적인 모니터링
- 주간 성능 리뷰 미팅
- 번들 크기 변화 추적
- 사용자 피드백 수집
- Core Web Vitals 모니터링

---

이 가이드를 통해 프로젝트의 성능을 지속적으로 개선하고 사용자 경험을 향상시킬 수 있습니다. 