import { Link } from "react-router-dom";

function NavbarLayout() {
  const userId = "testUser-123";
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-10 bg-white border-t border-black px-6 py-4 flex justify-between items-center">
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
