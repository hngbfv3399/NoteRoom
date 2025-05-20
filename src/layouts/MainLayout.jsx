import { BrowserRouter } from "react-router-dom";
import HeaderLayout from "../components/layouts/HeaderLayout";
import NavbarLayout from "../components/layouts/NavbarLayout";
import AppRouter from "../router/AppRouter";
import { getThemeClass } from "../utils/themeHelper";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";


function setRealViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

function useMobileHeightFix() {
  useEffect(() => {
    setRealViewportHeight();
    window.addEventListener("resize", setRealViewportHeight);
    return () => window.removeEventListener("resize", setRealViewportHeight);
  }, []);
}

function LayoutWrapper() {
  useMobileHeightFix(); // ← 여기에 호출

  const [userTheme, setUserTheme] = useState("");
  const { current, themes } = useSelector((state) => state.theme);

  useEffect(() => {
    if (themes[current]) {
      setUserTheme(getThemeClass(themes[current]));
    }
  }, [current, themes]);

  return (
    <div className="w-full flex justify-center bg-gray-100" style={{ height: "calc(var(--vh, 1vh) * 100)" }}>
      <div
        className={`w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl flex flex-col relative overflow-hidden ${userTheme}`}
        style={{ height: "100%" }}
      >
        {/* Header */}
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl z-10"
          style={{ height: "64px" }}
        >
          <HeaderLayout />
        </div>

        {/* Main content */}
        <main
          className="flex-grow overflow-y-auto hide-scrollbar mt-[64px] mb-[64px]"
          style={{ height: "calc(100% - 128px)" }}
        >
          <AppRouter />
        </main>

        {/* Navbar */}
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
