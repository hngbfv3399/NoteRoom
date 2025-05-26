// TODO: HeaderLayout 컴포넌트는 헤더 UI를 렌더링하고 검색 기능을 담당함
// TODO: 새로운 SearchInput 컴포넌트를 사용하여 고급 검색 기능 제공
// TODO: useNavigate 훅을 사용해 라우팅 제어 (홈 경로 이동)
// TODO: goToHome 함수는 로고 클릭 시 홈("/") 경로로 이동
// TODO: 헤더는 NoteRoom 타이틀과 고급 검색 입력창으로 구성되어 있음

import { useNavigate } from "react-router-dom";
import SearchInput from "./SearchInput";

function HeaderLayout() {
  const navigate = useNavigate();
  
  const goToHome = () => {
    navigate("/");
  };

  return (
    <div className="h-full flex items-center justify-between px-6">
      <h1
        onClick={goToHome}
        className="text-2xl font-semibold cursor-pointer transition-colors"
      >
        NoteRoom
      </h1>
      <div className="flex-1 max-w-xl mx-6">
        <SearchInput />
      </div>
    </div>
  );
}

export default HeaderLayout;