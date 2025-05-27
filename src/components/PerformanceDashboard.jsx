import React, { useState, useEffect } from 'react';

const PerformanceDashboard = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 개발 환경에서만 표시
    if (import.meta.env.DEV) {
      // 30초 후에 대시보드 표시
      const timer = setTimeout(() => {
        setIsVisible(true);
        updatePerformanceData();
      }, 30000);

      // 1분마다 데이터 업데이트
      const interval = setInterval(updatePerformanceData, 60000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, []);

  const updatePerformanceData = () => {
    if (window.performanceMonitor && window.autoPerformanceTest) {
      const monitor = window.performanceMonitor;
      const autoTest = window.autoPerformanceTest;
      
      const data = {
        memory: monitor.getMemorySummary(),
        cache: monitor.getCachePerformance(),
        network: monitor.getNetworkSummary(),
        testResults: autoTest.testResults.length
      };
      
      setPerformanceData(data);
    }
  };

  const getPerformanceGrade = () => {
    if (!performanceData) return 'N/A';
    
    let score = 100;
    const memoryUsage = parseFloat(performanceData.memory.usagePercent?.replace('%', '') || 35);
    const cacheHitRate = parseFloat(performanceData.cache.hitRate?.replace('%', '') || 0);
    const testCount = performanceData.testResults || 0;
    
    // 메모리 점수 (추정치인 경우 보너스)
    if (performanceData.memory.status?.includes('추정')) {
      score -= 5; // 추정치이므로 약간 감점
    } else if (memoryUsage > 80) {
      score -= 30;
    } else if (memoryUsage > 50) {
      score -= 15;
    }
    
    // 캐시 점수 (페이지 이동 패턴 고려)
    if (testCount < 10) {
      // 초기 단계에서는 캐시 점수 감점 최소화
      if (cacheHitRate < 10) score -= 8;
    } else if (testCount < 20) {
      // 중간 단계
      if (cacheHitRate < 30) score -= 12;
      else if (cacheHitRate < 50) score -= 6;
    } else {
      // 충분히 사용한 후
      if (cacheHitRate < 40) score -= 18;
      else if (cacheHitRate < 60) score -= 8;
      else if (cacheHitRate < 80) score -= 4;
    }
    
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'S': return '#00ff00';
      case 'A': return '#7fff00';
      case 'B': return '#ffff00';
      case 'C': return '#ff7f00';
      case 'D': return '#ff0000';
      default: return '#888';
    }
  };

  if (!isVisible || !performanceData) return null;

  const grade = getPerformanceGrade();

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      minWidth: '200px',
      fontFamily: 'monospace'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '8px',
        borderBottom: '1px solid #333',
        paddingBottom: '5px'
      }}>
        <span>🚀 성능 모니터</span>
        <span style={{ 
          marginLeft: 'auto',
          color: getGradeColor(grade),
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          {grade}
        </span>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            marginLeft: '10px',
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        💾 메모리: {performanceData.memory.current} ({performanceData.memory.status})
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        📈 캐시: {performanceData.cache.hitRate} ({performanceData.cache.efficiency})
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        🌐 네트워크: {performanceData.network.average}
      </div>
      
      <div style={{ fontSize: '10px', color: '#aaa', marginTop: '8px' }}>
        📊 측정 횟수: {performanceData.testResults}회
      </div>
      
      <div style={{ 
        marginTop: '8px', 
        paddingTop: '5px', 
        borderTop: '1px solid #333',
        fontSize: '10px'
      }}>
        <button
          onClick={() => window.performanceMonitor?.generateReport()}
          style={{
            background: '#333',
            border: '1px solid #555',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '10px',
            marginRight: '5px'
          }}
        >
          📊 리포트
        </button>
        <button
          onClick={() => window.autoPerformanceTest?.generateAutoReport()}
          style={{
            background: '#333',
            border: '1px solid #555',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
        >
          🤖 자동분석
        </button>
      </div>
    </div>
  );
};

export default PerformanceDashboard; 