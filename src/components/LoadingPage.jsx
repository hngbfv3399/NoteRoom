// TODO: LoadingPage 컴포넌트는 전체 화면 중앙에 로딩 스피너와 메시지를 보여줌
// TODO: flexbox를 사용해 세로/가로 중앙 정렬 구현
// TODO: animate-spin 클래스로 원형 스피너 애니메이션 적용
// TODO: 스피너는 파란색 테두리를 가지고 윗부분만 투명 처리하여 회전 효과 연출
// TODO: "로딩 중..." 텍스트는 스피너 아래에 위치하여 사용자에게 상태 안내


function LoadingPage(){
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="mt-4 text-gray-700 text-lg font-medium">로딩 중...</p>
    </div>
  );
};

export default LoadingPage;
