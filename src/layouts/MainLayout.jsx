import { BrowserRouter } from "react-router-dom";
import HeaderLayout from "../components/layouts/HeaderLayout";
import NavbarLayout from "../components/layouts/NavbarLayout";
import AppRouter from "../router/AppRouter";
import { getThemeClass } from "../utils/themeHelper"; // 경로 맞춰서
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
function LayoutWrapper() {

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
        className={`w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl h-screen flex flex-col relative overflow-hidden ${userTheme}`}
      >
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl z-10"
          style={{ height: "64px" }}
        >
          <HeaderLayout />
        </div>

        <main className="h-[calc(100vh-168px)] flex-grow overflow-y-auto hide-scrollbar mt-[64px] mb-[64px]">
          <AppRouter />
        </main>

        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-10 md:max-w-2xl lg:max-w-4xl xl:max-w-6xl"
          style={{ height: "64px" }}
        >
          <NavbarLayout />
        </div>
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
