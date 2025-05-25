import HeaderLayout from "@/components/HeaderLayout";
import NavbarLayout from "@/components/NavbarLayout";
import AppRouter from "@/router/AppRouter";
import { getThemeClass } from "@/utils/themeHelper";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import useMobileHeightFix from "@/hooks/useMobileHeightFix"; // 👈 커스텀 훅 분리 추천

function LayoutWrapper() {
  useMobileHeightFix();

  const [userTheme, setUserTheme] = useState(""); // 현재 테마 CSS class
  const { current, themes } = useSelector((state) => state.theme);

  useEffect(() => {
    if (themes[current]) {
      setUserTheme(getThemeClass(themes[current]));
    }
  }, [current, themes]);

  return (
    <div
      className="w-full flex justify-center bg-gray-100"
      style={{ height: "calc(var(--vh, 1vh) * 100)" }}
    >
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

        {/* Main */}
        <main
          className="flex-grow overflow-y-auto hide-scrollbar mt-[64px] mb-[64px]"
          style={{ height: "calc(100% - 128px)" }}
        >
          <AppRouter />
        </main>

        {/* Bottom Navbar */}
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

export default LayoutWrapper;
