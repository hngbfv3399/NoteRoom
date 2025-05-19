import { BrowserRouter, useLocation } from "react-router-dom";
import HeaderLayout from "../components/layouts/HeaderLayout";
import NavbarLayout from "../components/layouts/NavbarLayout";
import AppRouter from "../router/AppRouter";
import { getThemeClass } from "../utils/themeHelper"; // 경로 맞춰서
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
function LayoutWrapper() {
  const location = useLocation();
  const path = location.pathname;

  const isWritePage = path === "/write";
  const isThreadPage = path === "/thread";

  const showHeader = isWritePage || (!isThreadPage && !isWritePage);
  const showNavbar = !isWritePage && !isThreadPage;

  const headerHeight = 64;
  const navbarHeight = 64;

  const [userTheme, setUserTheme] = useState(""); // 컴포넌트 내 로컬 상태

  const { current, themes } = useSelector((state) => state.theme);
  useEffect(() => {
    if (themes[current]) {
      setUserTheme(getThemeClass(themes[current]));
    }
  }, [current, themes]);

  return (
    <div className="w-full flex justify-center bg-gray-100 min-h-screen">
      <div
        className={`w-full max-w-md h-screen flex flex-col relative overflow-hidden ${userTheme}`}
      >
        {showHeader && (
          <div
            className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-10"
            style={{ height: `${headerHeight}px` }}
          >
            <HeaderLayout />
          </div>
        )}

        <main
          className="flex-grow overflow-y-auto hide-scrollbar"
          style={{
            paddingTop: showHeader ? `${headerHeight}px` : 0,
            paddingBottom: showNavbar ? `${navbarHeight}px` : 0,
          }}
        >
          <AppRouter />
        </main>

        {showNavbar && (
          <div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-10"
            style={{ height: `${navbarHeight}px` }}
          >
            <NavbarLayout />
          </div>
        )}
      </div>
    </div>
  );
}

function MainLayout() {
  return (
    <BrowserRouter>
      <LayoutWrapper />
    </BrowserRouter>
  );
}

export default MainLayout;
