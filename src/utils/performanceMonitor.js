/**
 * 🚀 성능 모니터링 유틸리티
 * 
 * 기능:
 * - 페이지 로딩 시간 측정
 * - React Query 캐시 히트율 추적
 * - 네트워크 요청 모니터링
 * - 메모리 사용량 추적
 * - 렌더링 성능 측정
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoads: [],
      networkRequests: [],
      cacheHits: 0,
      cacheMisses: 0,
      renderTimes: [],
      memoryUsage: []
    };
    
    this.startTime = performance.now();
    this.lastCacheMiss = null; // 중복 캐시 미스 방지용
    this.lastCacheHit = null; // 중복 캐시 히트 방지용
    this.init();
  }

  init() {
    // 페이지 로드 성능 측정
    this.measurePageLoad();
    
    // 메모리 사용량 주기적 측정
    this.startMemoryMonitoring();
    
    // React Query 성능 모니터링
    this.setupReactQueryMonitoring();
  }

  // 📊 페이지 로드 성능 측정
  measurePageLoad() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      
      // 음수 시간 방지
      const pageLoadTime = Math.max(0, navigation.loadEventEnd - navigation.fetchStart);
      const domLoadTime = Math.max(0, navigation.domContentLoadedEventEnd - navigation.fetchStart);
      
      this.metrics.pageLoads.push({
        timestamp: new Date(),
        loadTime: pageLoadTime,
        domContentLoaded: domLoadTime,
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint()
      });
      
      console.log('📊 [Performance] 페이지 로드 완료:', {
        '총 로딩 시간': `${pageLoadTime.toFixed(2)}ms`,
        'DOM 로딩': `${domLoadTime.toFixed(2)}ms`,
        'First Paint': `${this.getFirstPaint()?.toFixed(2) || 'N/A'}ms`,
        'First Contentful Paint': `${this.getFirstContentfulPaint()?.toFixed(2) || 'N/A'}ms`
      });
    });
  }

  // 🎨 First Paint 시간 측정
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  // 🎨 First Contentful Paint 시간 측정
  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }

  // 💾 메모리 사용량 모니터링
  startMemoryMonitoring() {
    if (!performance.memory) {
      // Memory API가 지원되지 않는 경우 조용히 처리
      return;
    }

    setInterval(() => {
      const memory = performance.memory;
      this.metrics.memoryUsage.push({
        timestamp: new Date(),
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      });
      
      // 메모리 사용량이 80% 이상이면 경고
      const memoryUsagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (memoryUsagePercent > 80) {
        console.warn('⚠️ [Performance] 높은 메모리 사용량:', `${memoryUsagePercent.toFixed(1)}%`);
      }
    }, 10000); // 10초마다 측정 (빈도 줄임)
  }

  // 🔄 React Query 성능 모니터링
  setupReactQueryMonitoring() {
    // React Query DevTools가 있는 경우에만 실행
    if (typeof window !== 'undefined' && window.__REACT_QUERY_DEVTOOLS__) {
      console.log('🔄 [Performance] React Query 모니터링 시작');
    }
  }

  // 📈 네트워크 요청 추적
  trackNetworkRequest(url, method = 'GET', startTime) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.metrics.networkRequests.push({
      url,
      method,
      duration,
      timestamp: new Date()
    });
    
    console.log(`🌐 [Performance] 네트워크 요청:`, {
      url: url.substring(0, 50) + '...',
      method,
      duration: `${duration.toFixed(2)}ms`
    });
  }

  // 💾 캐시 히트 추적 (중복 방지)
  trackCacheHit(queryKey) {
    this.metrics.cacheHits++;
    
    // 동일한 쿼리 키의 연속된 히트는 한 번만 로그
    const queryKeyStr = JSON.stringify(queryKey);
    if (this.lastCacheHit !== queryKeyStr) {
      // 캐시 히트 로그는 더 간소화
      console.log('✅ [Cache] 히트:', queryKey[0] || 'unknown');
      this.lastCacheHit = queryKeyStr;
    }
  }

  // ❌ 캐시 미스 추적 (중복 방지)
  trackCacheMiss(queryKey) {
    this.metrics.cacheMisses++;
    
    // 동일한 쿼리 키의 연속된 미스는 한 번만 로그
    const queryKeyStr = JSON.stringify(queryKey);
    if (this.lastCacheMiss !== queryKeyStr) {
      // 캐시 미스 로그는 더 간소화
      console.log('❌ [Cache] 미스:', queryKey[0] || 'unknown');
      this.lastCacheMiss = queryKeyStr;
    }
  }

  // 🎭 렌더링 시간 측정
  measureRenderTime(componentName, renderFunction) {
    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    this.metrics.renderTimes.push({
      component: componentName,
      renderTime,
      timestamp: new Date()
    });
    
    if (renderTime > 16) { // 60fps 기준 16ms 초과시 경고
      console.warn(`⚠️ [Performance] 느린 렌더링 감지:`, {
        component: componentName,
        renderTime: `${renderTime.toFixed(2)}ms`
      });
    }
    
    return result;
  }

  // 📊 성능 리포트 생성
  generateReport() {
    const report = {
      summary: this.getSummary(),
      pageLoads: this.metrics.pageLoads,
      networkRequests: this.getNetworkSummary(),
      cachePerformance: this.getCachePerformance(),
      memoryUsage: this.getMemorySummary(),
      renderPerformance: this.getRenderSummary()
    };
    
    console.log('📊 [Performance Report]', report);
    return report;
  }

  // 📈 요약 통계
  getSummary() {
    const totalRequests = this.metrics.networkRequests.length;
    const avgRequestTime = totalRequests > 0 
      ? this.metrics.networkRequests.reduce((sum, req) => sum + req.duration, 0) / totalRequests 
      : 0;
    
    const cacheHitRate = this.metrics.cacheHits + this.metrics.cacheMisses > 0
      ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
      : 0;

    return {
      totalNetworkRequests: totalRequests,
      averageRequestTime: `${avgRequestTime.toFixed(2)}ms`,
      cacheHitRate: `${cacheHitRate.toFixed(1)}%`,
      totalPageLoads: this.metrics.pageLoads.length,
      averagePageLoadTime: this.metrics.pageLoads.length > 0 
        ? `${(this.metrics.pageLoads.reduce((sum, load) => sum + load.loadTime, 0) / this.metrics.pageLoads.length).toFixed(2)}ms`
        : 'N/A'
    };
  }

  // 🌐 네트워크 요청 요약
  getNetworkSummary() {
    const requests = this.metrics.networkRequests;
    const fastRequests = requests.filter(req => req.duration < 100).length;
    const slowRequests = requests.filter(req => req.duration > 1000).length;
    
    return {
      total: requests.length,
      fast: `${fastRequests} (< 100ms)`,
      slow: `${slowRequests} (> 1000ms)`,
      average: requests.length > 0 
        ? `${(requests.reduce((sum, req) => sum + req.duration, 0) / requests.length).toFixed(2)}ms`
        : 'N/A'
    };
  }

  // 💾 캐시 성능 요약
  getCachePerformance() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    const hitRate = total > 0 ? (this.metrics.cacheHits / total) * 100 : 0;
    
    return {
      hits: this.metrics.cacheHits,
      misses: this.metrics.cacheMisses,
      hitRate: `${hitRate.toFixed(1)}%`,
      efficiency: hitRate > 80 ? '우수' : hitRate > 60 ? '양호' : '개선 필요'
    };
  }

  // 💾 메모리 사용량 요약
  getMemorySummary() {
    if (this.metrics.memoryUsage.length === 0) return { status: 'Not supported' };
    
    const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    const usagePercent = (latest.usedJSHeapSize / latest.jsHeapSizeLimit) * 100;
    
    return {
      current: `${(latest.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(latest.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(latest.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      usagePercent: `${usagePercent.toFixed(1)}%`,
      status: usagePercent < 50 ? '양호' : usagePercent < 80 ? '주의' : '위험'
    };
  }

  // 🎭 렌더링 성능 요약
  getRenderSummary() {
    const renders = this.metrics.renderTimes;
    if (renders.length === 0) return { status: 'No data' };
    
    const avgRenderTime = renders.reduce((sum, render) => sum + render.renderTime, 0) / renders.length;
    const slowRenders = renders.filter(render => render.renderTime > 16).length;
    
    return {
      totalRenders: renders.length,
      averageTime: `${avgRenderTime.toFixed(2)}ms`,
      slowRenders: `${slowRenders} (> 16ms)`,
      performance: avgRenderTime < 8 ? '우수' : avgRenderTime < 16 ? '양호' : '개선 필요'
    };
  }

  // 🧹 메트릭 초기화
  reset() {
    this.metrics = {
      pageLoads: [],
      networkRequests: [],
      cacheHits: 0,
      cacheMisses: 0,
      renderTimes: [],
      memoryUsage: []
    };
    console.log('🧹 [Performance] 메트릭 초기화 완료');
  }
}

// 전역 성능 모니터 인스턴스
const performanceMonitor = new PerformanceMonitor();

// 개발 환경에서만 전역 객체에 추가
if (import.meta.env.DEV) {
  window.performanceMonitor = performanceMonitor;
}

export default performanceMonitor; 