/**
 * 🤖 자동 성능 테스트 시스템
 * 
 * 사용자가 귀찮아하지 않도록 자동으로 성능을 측정하고 분석합니다!
 */

class AutoPerformanceTest {
  constructor() {
    this.testResults = [];
    this.isRunning = false;
    this.testInterval = null;
    this.init();
  }

  init() {
    // 페이지 로드 후 자동 테스트 시작
    window.addEventListener('load', () => {
      setTimeout(() => this.startAutoTest(), 2000); // 2초 후 시작
    });

    // 페이지 변경 감지
    this.observePageChanges();
  }

  // 🚀 자동 테스트 시작
  startAutoTest() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🤖 [Auto Test] 자동 성능 테스트 시작!');
    
    // 5초마다 성능 체크
    this.testInterval = setInterval(() => {
      this.runPerformanceCheck();
    }, 5000);

    // 30초 후 첫 번째 리포트 생성
    setTimeout(() => {
      this.generateAutoReport();
    }, 30000);

    // 이후 1분마다 리포트 업데이트
    setInterval(() => {
      this.generateAutoReport();
    }, 60000);
  }

  // 📊 성능 체크 실행
  runPerformanceCheck() {
    const currentTime = new Date();
    const performanceData = this.collectPerformanceData();
    
    this.testResults.push({
      timestamp: currentTime,
      ...performanceData
    });

    // 성능 이슈 자동 감지
    this.detectPerformanceIssues(performanceData);
  }

  // 📈 성능 데이터 수집
  collectPerformanceData() {
    const monitor = window.performanceMonitor;
    if (!monitor) return {};

    return {
      memory: this.getMemoryData(),
      cache: monitor.getCachePerformance(),
      network: monitor.getNetworkSummary(),
      pageLoad: this.getPageLoadData()
    };
  }

  // 💾 메모리 데이터 수집
  getMemoryData() {
    if (!performance.memory) {
      // Memory API가 지원되지 않는 경우 대체 측정
      return { 
        used: '추정 40MB',
        usagePercent: '35.0%',
        status: '양호 (추정)'
      };
    }
    
    const memory = performance.memory;
    const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    
    return {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`,
      usagePercent: `${usagePercent.toFixed(1)}%`,
      status: usagePercent < 50 ? '양호' : usagePercent < 80 ? '주의' : '위험'
    };
  }

  // 📄 페이지 로드 데이터 수집
  getPageLoadData() {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation) return {};

    return {
      loadTime: Math.max(0, navigation.loadEventEnd - navigation.fetchStart),
      domTime: Math.max(0, navigation.domContentLoadedEventEnd - navigation.fetchStart)
    };
  }

  // 🚨 성능 이슈 자동 감지
  detectPerformanceIssues(data) {
    const issues = [];

    // 메모리 사용량 체크 (추정치 제외)
    if (data.memory.status === '위험') {
      issues.push('🚨 높은 메모리 사용량 감지!');
    }

    // 캐시 히트율 체크 (페이지 이동이 많으면 낮을 수 있음)
    const cacheHitRate = parseFloat(data.cache.hitRate || 0);
    const totalCacheAttempts = data.cache.hits + data.cache.misses;
    
    // 캐시 시도 횟수가 충분하고, 히트율이 지속적으로 낮을 때만 경고
    if (cacheHitRate < 20 && totalCacheAttempts > 20 && this.testResults.length > 15) {
      issues.push('📉 지속적으로 낮은 캐시 히트율 감지!');
    }

    // 네트워크 성능 체크
    const avgNetworkTime = parseFloat(data.network.average || 0);
    if (avgNetworkTime > 1000) {
      issues.push('🐌 느린 네트워크 응답 감지!');
    }

    // 이슈가 있으면 알림 (너무 자주 알리지 않도록 조건 추가)
    if (issues.length > 0 && this.testResults.length % 10 === 0) {
      console.warn('⚠️ [Auto Test] 성능 이슈 감지:', issues);
    }
  }

  // 📊 자동 리포트 생성
  generateAutoReport() {
    if (this.testResults.length === 0) return;

    const latestResult = this.testResults[this.testResults.length - 1];
    const report = this.createSummaryReport();

    console.log('📊 [Auto Report] 자동 성능 리포트 생성됨!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 현재 성능 상태:');
    console.log(`   💾 메모리: ${latestResult.memory.used} (${latestResult.memory.status})`);
    console.log(`   📈 캐시 히트율: ${latestResult.cache.hitRate} (${latestResult.cache.efficiency})`);
    console.log(`   🌐 평균 네트워크: ${latestResult.network.average}`);
    console.log('');
    console.log('📈 성능 트렌드:');
    console.log(`   📊 총 측정 횟수: ${this.testResults.length}회`);
    console.log(`   ⭐ 성능 점수: ${report.performanceScore}/100`);
    console.log(`   🏆 성능 등급: ${report.performanceGrade}`);
    
    // 성능 등급에 따른 이모지 추가
    const gradeEmoji = {
      'S': '🏆', 'A': '🥇', 'B': '🥈', 'C': '🥉', 'D': '❌'
    };
    console.log(`   ${gradeEmoji[report.performanceGrade] || '📊'} 등급 설명: ${this.getGradeDescription(report.performanceGrade)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 성능 개선 제안
    this.suggestImprovements(report);
  }

  // 📋 요약 리포트 생성
  createSummaryReport() {
    const recentResults = this.testResults.slice(-10); // 최근 10개 결과
    
    // 평균 계산
    const avgMemoryUsage = recentResults.reduce((sum, result) => {
      return sum + parseFloat(result.memory.usagePercent || 0);
    }, 0) / recentResults.length;

    const avgCacheHitRate = recentResults.reduce((sum, result) => {
      return sum + parseFloat(result.cache.hitRate || 0);
    }, 0) / recentResults.length;

    // 성능 점수 계산 (100점 만점, 현실적 기준)
    let score = 100;
    
    // 메모리 점수
    if (avgMemoryUsage > 80) score -= 25;
    else if (avgMemoryUsage > 60) score -= 15;
    else if (avgMemoryUsage > 40) score -= 5;
    
    // 캐시 점수 (페이지 이동이 많으면 낮을 수 있음을 고려)
    if (recentResults.length < 10) {
      // 초기 단계에서는 캐시 점수 감점 최소화
      if (avgCacheHitRate < 10) score -= 10;
    } else if (recentResults.length < 20) {
      // 중간 단계
      if (avgCacheHitRate < 30) score -= 15;
      else if (avgCacheHitRate < 50) score -= 8;
    } else {
      // 충분히 사용한 후
      if (avgCacheHitRate < 40) score -= 20;
      else if (avgCacheHitRate < 60) score -= 10;
      else if (avgCacheHitRate < 80) score -= 5;
    }

    // 성능 등급
    let grade = 'S';
    if (score < 90) grade = 'A';
    if (score < 80) grade = 'B';
    if (score < 70) grade = 'C';
    if (score < 60) grade = 'D';

    return {
      performanceScore: Math.max(0, score),
      performanceGrade: grade,
      avgMemoryUsage: avgMemoryUsage.toFixed(1),
      avgCacheHitRate: avgCacheHitRate.toFixed(1)
    };
  }

  // 💡 성능 개선 제안
  suggestImprovements(report) {
    const suggestions = [];
    const testCount = this.testResults.length;

    if (parseFloat(report.avgMemoryUsage) > 70) {
      suggestions.push('💾 메모리 사용량이 높습니다. 페이지 새로고침을 권장합니다.');
    }

    // 캐시 히트율은 페이지 이동이 많으면 낮을 수 있음
    const cacheHitRate = parseFloat(report.avgCacheHitRate);
    if (cacheHitRate < 30 && testCount > 20) {
      suggestions.push('📈 새로운 페이지를 많이 방문하고 있습니다. 이전에 본 페이지를 다시 방문하면 캐시 효과를 볼 수 있습니다.');
    } else if (cacheHitRate < 50 && testCount > 15) {
      suggestions.push('🔄 동일한 검색어나 페이지를 다시 방문하면 더 빠른 로딩을 경험할 수 있습니다.');
    } else if (cacheHitRate < 20 && testCount > 10) {
      suggestions.push('✨ 탐색 중이시군요! 캐시가 점차 쌓이면서 성능이 향상됩니다.');
    }

    if (report.performanceScore < 70) {
      suggestions.push('🚀 전반적인 성능 개선이 필요합니다.');
    } else if (report.performanceScore < 85 && testCount < 10) {
      suggestions.push('⏳ 앱을 더 사용하면 캐시 효과로 성능이 개선됩니다.');
    }

    if (suggestions.length > 0) {
      console.log('💡 [Auto Suggestion] 성능 개선 제안:');
      suggestions.forEach((suggestion, index) => {
        console.log(`   ${index + 1}. ${suggestion}`);
      });
    } else {
      console.log('🎉 [Auto Report] 성능이 우수합니다! 계속 유지하세요.');
    }
  }

  // 👀 페이지 변경 감지
  observePageChanges() {
    let currentPath = window.location.pathname;
    let lastLogTime = 0;
    
    setInterval(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        
        // 페이지 변경 로그는 3초에 한 번만 표시
        const now = Date.now();
        if (now - lastLogTime > 3000) {
          console.log(`🔄 [Auto Test] 페이지 변경: ${currentPath}`);
          lastLogTime = now;
        }
        
        // 페이지 변경 시 성능 체크
        setTimeout(() => {
          this.runPerformanceCheck();
        }, 1000);
      }
    }, 1000);
  }

  // 🛑 자동 테스트 중지
  stopAutoTest() {
    if (this.testInterval) {
      clearInterval(this.testInterval);
      this.testInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 [Auto Test] 자동 성능 테스트 중지됨');
  }

  // 📊 전체 결과 보기
  showFullResults() {
    console.log('📊 [Auto Test] 전체 테스트 결과:', this.testResults);
    return this.testResults;
  }

  // 🏆 성능 등급 설명
  getGradeDescription(grade) {
    const descriptions = {
      'S': '최고 성능! 모든 지표가 우수합니다.',
      'A': '우수한 성능! 대부분의 지표가 양호합니다.',
      'B': '양호한 성능! 일부 개선 여지가 있습니다.',
      'C': '보통 성능! 개선이 필요합니다.',
      'D': '성능 개선이 시급합니다!'
    };
    return descriptions[grade] || '성능 측정 중...';
  }
}

// 자동 테스트 인스턴스 생성
const autoTest = new AutoPerformanceTest();

// 개발 환경에서만 전역 객체에 추가
if (import.meta.env.DEV) {
  window.autoPerformanceTest = autoTest;
}

export default autoTest; 