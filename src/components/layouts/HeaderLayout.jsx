import { useState } from "react";
import { useNavigate } from "react-router-dom";

function HeaderLayout() {
  const [inputSearch, setInputSearch] = useState("");
  const navigate = useNavigate();
  const goToHome = () => {
    navigate("/");
  };
  const searchInputHandle = () => {
    navigate(`/search/${inputSearch}`);
    setInputSearch("");
  };

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl z-10 border-b py-3 flex justify-between items-center px-4">
  <h1
    onClick={goToHome}
    className="hover:cursor-pointer text-2xl sm:text-3xl ps-4"
  >
    NoteRoom
  </h1>
  <input
    type="text"
    placeholder="Search for..."
    value={inputSearch}
    onChange={(e) => setInputSearch(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && searchInputHandle()}
    className="bg-gray-50 rounded-xl px-4 py-2 w-full sm:w-72 md:w-96 lg:w-[400px] text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 ml-4"
  />
</div>

  );
}

export default HeaderLayout;
