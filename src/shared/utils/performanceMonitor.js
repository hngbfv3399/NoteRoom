/**
 * 성능 모니터링 및 최적화 유틸리티
 * - 렌더링 성능 측정
 * - 메모리 사용량 모니터링
 * - 번들 크기 분석
 * - 성능 메트릭 수집
 */

import React from 'react';

// 성능 메트릭 수집기
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      renderTimes: [],
      memoryUsage: [],
      bundleLoadTimes: [],
      userInteractions: []
    };
    this.observers = new Map();
    this.isMonitoring = import.meta.env?.DEV || false;
  }

  // 렌더링 성능 측정 시작
  startRenderMeasure(componentName) {
    if (!this.isMonitoring) return null;
    
    const measureName = `render-${componentName}-${Date.now()}`;
    performance.mark(`${measureName}-start`);
    
    return {
      end: () => {
        performance.mark(`${measureName}-end`);
        performance.measure(measureName, `${measureName}-start`, `${measureName}-end`);
        
        const measure = performance.getEntriesByName(measureName)[0];
        this.metrics.renderTimes.push({
          component: componentName,
          duration: measure.duration,
          timestamp: Date.now()
        });
        
        // 성능 데이터 정리 (최근 100개만 유지)
        if (this.metrics.renderTimes.length > 100) {
          this.metrics.renderTimes = this.metrics.renderTimes.slice(-100);
        }
        
        performance.clearMarks(`${measureName}-start`);
        performance.clearMarks(`${measureName}-end`);
        performance.clearMeasures(measureName);
        
        return measure.duration;
      }
    };
  }

  // 메모리 사용량 모니터링
  measureMemoryUsage() {
    if (!this.isMonitoring || !performance.memory) return null;
    
    const memoryInfo = {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
      timestamp: Date.now()
    };
    
    this.metrics.memoryUsage.push(memoryInfo);
    
    // 최근 50개만 유지
    if (this.metrics.memoryUsage.length > 50) {
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-50);
    }
    
    return memoryInfo;
  }

  // 번들 로딩 시간 측정
  measureBundleLoadTime(bundleName, startTime) {
    if (!this.isMonitoring) return;
    
    const loadTime = performance.now() - startTime;
    this.metrics.bundleLoadTimes.push({
      bundle: bundleName,
      loadTime,
      timestamp: Date.now()
    });
  }

  // 사용자 상호작용 측정
  measureUserInteraction(interactionType, duration) {
    if (!this.isMonitoring) return;
    
    this.metrics.userInteractions.push({
      type: interactionType,
      duration,
      timestamp: Date.now()
    });
    
    // 최근 100개만 유지
    if (this.metrics.userInteractions.length > 100) {
      this.metrics.userInteractions = this.metrics.userInteractions.slice(-100);
    }
  }

  // Intersection Observer를 이용한 가시성 모니터링
  observeElementVisibility(element, callback) {
    if (!this.isMonitoring || !element) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        callback({
          isVisible: entry.isIntersecting,
          visibilityRatio: entry.intersectionRatio,
          element: entry.target
        });
      });
    }, {
      threshold: [0, 0.25, 0.5, 0.75, 1]
    });
    
    observer.observe(element);
    this.observers.set(element, observer);
    
    return () => {
      observer.unobserve(element);
      this.observers.delete(element);
    };
  }

  // 성능 리포트 생성
  generatePerformanceReport() {
    if (!this.isMonitoring) return null;
    
    const now = Date.now();
    const last5Minutes = now - 5 * 60 * 1000;
    
    // 최근 5분간의 데이터만 분석
    const recentRenderTimes = this.metrics.renderTimes.filter(m => m.timestamp > last5Minutes);
    const recentMemoryUsage = this.metrics.memoryUsage.filter(m => m.timestamp > last5Minutes);
    const recentInteractions = this.metrics.userInteractions.filter(m => m.timestamp > last5Minutes);
    
    return {
      renderPerformance: {
        averageRenderTime: recentRenderTimes.length > 0 
          ? recentRenderTimes.reduce((sum, m) => sum + m.duration, 0) / recentRenderTimes.length 
          : 0,
        slowestRender: recentRenderTimes.length > 0 
          ? Math.max(...recentRenderTimes.map(m => m.duration)) 
          : 0,
        totalRenders: recentRenderTimes.length,
        componentBreakdown: this.getComponentRenderBreakdown(recentRenderTimes)
      },
      memoryUsage: {
        current: recentMemoryUsage.length > 0 ? recentMemoryUsage[recentMemoryUsage.length - 1] : null,
        peak: recentMemoryUsage.length > 0 
          ? Math.max(...recentMemoryUsage.map(m => m.used)) 
          : 0,
        average: recentMemoryUsage.length > 0 
          ? recentMemoryUsage.reduce((sum, m) => sum + m.used, 0) / recentMemoryUsage.length 
          : 0
      },
      userInteractions: {
        totalInteractions: recentInteractions.length,
        averageResponseTime: recentInteractions.length > 0 
          ? recentInteractions.reduce((sum, i) => sum + i.duration, 0) / recentInteractions.length 
          : 0,
        slowestInteraction: recentInteractions.length > 0 
          ? Math.max(...recentInteractions.map(i => i.duration)) 
          : 0
      },
      bundleLoadTimes: this.metrics.bundleLoadTimes,
      timestamp: now
    };
  }

  // 컴포넌트별 렌더링 성능 분석
  getComponentRenderBreakdown(renderTimes) {
    const breakdown = {};
    
    renderTimes.forEach(metric => {
      if (!breakdown[metric.component]) {
        breakdown[metric.component] = {
          count: 0,
          totalTime: 0,
          averageTime: 0,
          maxTime: 0
        };
      }
      
      breakdown[metric.component].count++;
      breakdown[metric.component].totalTime += metric.duration;
      breakdown[metric.component].maxTime = Math.max(breakdown[metric.component].maxTime, metric.duration);
    });
    
    // 평균 시간 계산
    Object.keys(breakdown).forEach(component => {
      breakdown[component].averageTime = breakdown[component].totalTime / breakdown[component].count;
    });
    
    return breakdown;
  }

  // 성능 경고 확인
  checkPerformanceWarnings() {
    if (!this.isMonitoring) return [];
    
    const warnings = [];
    const report = this.generatePerformanceReport();
    
    if (!report) return warnings;
    
    // 렌더링 성능 경고
    if (report.renderPerformance.averageRenderTime > 16) { // 60fps 기준
      warnings.push({
        type: 'render',
        severity: 'warning',
        message: `평균 렌더링 시간이 ${report.renderPerformance.averageRenderTime.toFixed(2)}ms로 권장 기준(16ms)을 초과했습니다.`
      });
    }
    
    if (report.renderPerformance.slowestRender > 100) {
      warnings.push({
        type: 'render',
        severity: 'error',
        message: `가장 느린 렌더링이 ${report.renderPerformance.slowestRender.toFixed(2)}ms로 매우 느립니다.`
      });
    }
    
    // 메모리 사용량 경고
    if (report.memoryUsage.current && report.memoryUsage.current.used > 50 * 1024 * 1024) { // 50MB
      warnings.push({
        type: 'memory',
        severity: 'warning',
        message: `메모리 사용량이 ${(report.memoryUsage.current.used / 1024 / 1024).toFixed(2)}MB로 높습니다.`
      });
    }
    
    // 사용자 상호작용 응답 시간 경고
    if (report.userInteractions.averageResponseTime > 100) {
      warnings.push({
        type: 'interaction',
        severity: 'warning',
        message: `평균 상호작용 응답 시간이 ${report.userInteractions.averageResponseTime.toFixed(2)}ms로 느립니다.`
      });
    }
    
    return warnings;
  }

  // 정리 함수
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics = {
      renderTimes: [],
      memoryUsage: [],
      bundleLoadTimes: [],
      userInteractions: []
    };
  }
}

// 싱글톤 인스턴스
const performanceMonitor = new PerformanceMonitor();

// React 컴포넌트용 성능 측정 HOC
export function withPerformanceMonitoring(WrappedComponent) {
  const ComponentWithMonitoring = React.forwardRef((props, ref) => {
    const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
    
    React.useEffect(() => {
      const measure = performanceMonitor.startRenderMeasure(componentName);
      
      return () => {
        if (measure) {
          measure.end();
        }
      };
    });
    
    return React.createElement(WrappedComponent, { ...props, ref });
  });
  
  ComponentWithMonitoring.displayName = `withPerformanceMonitoring(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return ComponentWithMonitoring;
}

// React Hook for performance monitoring
export function usePerformanceMonitoring(componentName) {
  React.useEffect(() => {
    const measure = performanceMonitor.startRenderMeasure(componentName);
    
    return () => {
      if (measure) {
        measure.end();
      }
    };
  });
  
  return {
    measureInteraction: (type, startTime) => {
      const duration = performance.now() - startTime;
      performanceMonitor.measureUserInteraction(type, duration);
    },
    measureMemory: () => performanceMonitor.measureMemoryUsage(),
    observeVisibility: (element, callback) => performanceMonitor.observeElementVisibility(element, callback)
  };
}

// 디바운스된 성능 리포트 로깅
let reportTimeout;
export function logPerformanceReport() {
  if (reportTimeout) clearTimeout(reportTimeout);
  
  reportTimeout = setTimeout(() => {
    const report = performanceMonitor.generatePerformanceReport();
    const warnings = performanceMonitor.checkPerformanceWarnings();
    
    if (report) {
      console.group('🚀 성능 리포트');
      console.log('렌더링 성능:', report.renderPerformance);
      console.log('메모리 사용량:', report.memoryUsage);
      console.log('사용자 상호작용:', report.userInteractions);
      
      if (warnings.length > 0) {
        console.warn('⚠️ 성능 경고:', warnings);
      }
      
      console.groupEnd();
    }
  }, 1000);
}

export default performanceMonitor; 