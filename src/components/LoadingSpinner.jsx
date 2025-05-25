// TODO: LoadingSpinner 컴포넌트는 작은 크기의 원형 스피너를 보여줌
// TODO: flexbox로 스피너를 가로/세로 중앙 정렬
// TODO: animate-spin 클래스로 스피너에 회전 애니메이션 적용
// TODO: 스피너는 높이 8, 너비 8, 둥근 테두리로 디자인됨
// TODO: 위쪽과 아래쪽 테두리에만 두께 2의 선(border-t-2, border-b-2) 적용해 회전 효과 강조
// TODO: 주변에 적당한 패딩(p-4)을 주어 다른 요소와의 간격 유지

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2"></div>
    </div>
  );
}

export default LoadingSpinner; 