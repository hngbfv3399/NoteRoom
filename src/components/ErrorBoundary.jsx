
// TODO: React 클래스 컴포넌트로 에러 경계(Error Boundary) 구현
// TODO: 생성자에서 초기 상태로 hasError: false, error: null 설정
// TODO: getDerivedStateFromError 정적 메서드로 에러 발생 시 상태를 hasError: true, error에 에러 객체 저장
// TODO: componentDidCatch 라이프사이클에서 에러와 에러 정보를 받아서 콘솔에 출력, 에러 로깅 서비스 추가 가능
// TODO: resetErrorBoundary 메서드로 에러 상태 초기화 (재시도용)
// TODO: render 메서드에서 에러가 발생했으면 ErrorFallback 컴포넌트를 렌더링하고,
// TODO: 에러가 없으면 자식 컴포넌트들을 그대로 렌더링

import React from 'react';
import ErrorFallback from './ErrorFallback';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 여기에 에러 로깅 서비스 추가 가능
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 