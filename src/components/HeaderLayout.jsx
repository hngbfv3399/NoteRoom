// TODO: HeaderLayout 컴포넌트는 헤더 UI를 렌더링하고 검색 기능을 담당함
// TODO: inputSearch 상태를 통해 검색어 입력값 관리
// TODO: useNavigate 훅을 사용해 라우팅 제어 (홈 및 검색 페이지 이동)
// TODO: goToHome 함수는 로고 클릭 시 홈("/") 경로로 이동
// TODO: searchInputHandle 함수는 검색어가 비어있지 않으면 검색 결과 페이지로 이동하고 입력창 초기화
// TODO: input 요소는 검색어 입력 및 Enter 키 입력 시 검색 실행 기능 포함
// TODO: 헤더는 NoteRoom 타이틀과 검색 입력창으로 구성되어 있음


import { useState } from "react";
import { useNavigate } from "react-router-dom";

function HeaderLayout() {
  const [inputSearch, setInputSearch] = useState("");
  const navigate = useNavigate();
  
  const goToHome = () => {
    navigate("/");
  };
  
  const searchInputHandle = () => {
    if (inputSearch.trim()) {
      navigate(`/search/${inputSearch}`);
      setInputSearch("");
    }
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
        <input
          type="text"
          placeholder="검색어를 입력하세요..."
          value={inputSearch}
          onChange={(e) => setInputSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchInputHandle()}
          className="w-full px-4 py-2 rounded-lg border transition-all"
        />
      </div>
    </div>
  );
}

export default HeaderLayout;