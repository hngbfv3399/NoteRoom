function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-4">
      {/* TODO: 에러 발생 메시지 표시 */}
      <p className="text-lg font-semibold">문제가 발생했습니다</p>

      {/* TODO: 에러 상세 메시지를 출력 (에러 객체에서 message 프로퍼티 사용) */}
      <pre className="text-sm p-4 rounded">{error?.message}</pre>

      {/* TODO: 재시도 함수가 전달된 경우 재시도 버튼 표시 */}
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary} // TODO: 버튼 클릭 시 에러 상태 리셋 및 재시도 기능 수행
          className="px-4 py-2 rounded"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

export default ErrorFallback;
