/**
 * React 에러 바운더리 컴포넌트
 * 
 * 기능:
 * - 자식 컴포넌트에서 발생하는 JavaScript 에러 포착
 * - 에러 발생 시 폴백 UI 표시
 * - 에러 상태 초기화 및 재시도 기능
 * 
 * NOTE: React 클래스 컴포넌트로만 구현 가능한 기능
 * TODO: 에러 로깅 서비스 연동 고려 (Sentry, LogRocket 등)
 */
import React from 'react';
import ErrorFallback from './ErrorFallback';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    // 에러 상태 초기화
    this.state = { hasError: false, error: null };
  }

  // 에러 발생 시 상태 업데이트를 위한 정적 메서드
  // NOTE: 렌더링 중 에러가 발생했을 때 호출됨
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // 에러 정보를 로깅하기 위한 라이프사이클 메서드
  // NOTE: 에러 발생 후 호출되며, 에러 리포팅에 사용
  componentDidCatch(error, errorInfo) {
    // 에러 정보를 콘솔에 출력
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    
    // TODO: 여기에 에러 로깅 서비스 추가 가능 (Sentry, LogRocket 등)
  }

  // 에러 상태를 초기화하여 재시도할 수 있게 하는 메서드
  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    // 에러가 발생한 경우 폴백 UI 렌더링
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    // 에러가 없는 경우 자식 컴포넌트들을 정상적으로 렌더링
    return this.props.children;
  }
}

export default ErrorBoundary; 