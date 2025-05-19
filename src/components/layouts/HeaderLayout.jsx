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
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-10 border-b border-black py-3 flex justify-between items-center">
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
        className="bg-gray-50 rounded-xl px-4 py-2 w-full sm:w-70 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );
}

export default HeaderLayout;
