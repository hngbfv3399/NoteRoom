import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getThemeClass } from "../../utils/themeHelper";

function NavbarLayout() {
  const { current, themes } = useSelector((state) => state.theme);
  const userId = "testUser-123";

  const themeClass = themes[current] ? getThemeClass(themes[current]) : "";

  return (
    <div
    className={`${themeClass} fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl z-10 border-t border-black px-6 py-4 flex justify-between items-center`}
    >
      <Link className="text-2xl sm:text-3xl" to="/">
        🏠
      </Link>
      <Link className="text-2xl sm:text-3xl" to="/thread">
        📜
      </Link>
      <Link className="text-2xl sm:text-3xl" to="/write">
        📝
      </Link>
      <Link className="text-2xl sm:text-3xl" to={`/profile/${userId}`}>
        🙋‍♂️
      </Link>
      <Link className="text-2xl sm:text-3xl" to="/setting">
        ⚙️
      </Link>
    </div>
  );
}

export default NavbarLayout;
