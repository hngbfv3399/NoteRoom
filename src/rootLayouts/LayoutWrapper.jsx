import HeaderLayout from "@/components/HeaderLayout";
import NavbarLayout from "@/components/NavbarLayout";
import AppRouter from "@/router/AppRouter";
import { 
  getContainerTheme, 
  getHeaderTheme, 
  getNavigationTheme,
  getThemeTransition 
} from "@/utils/themeHelper";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import useMobileHeightFix from "@/hooks/useMobileHeightFix"; // 👈 커스텀 훅 분리 추천

function LayoutWrapper() {
  useMobileHeightFix();

  const [themeClasses, setThemeClasses] = useState({
    container: "",
    header: "",
    navigation: "",
    main: ""
  });
  
  const { current, themes } = useSelector((state) => state.theme);

  useEffect(() => {
    if (themes[current]) {
      const currentTheme = themes[current];
      
      setThemeClasses({
        container: getContainerTheme(currentTheme),
        header: getHeaderTheme(currentTheme),
        navigation: getNavigationTheme(currentTheme),
        main: `${currentTheme.bgColor} ${getThemeTransition()}`
      });
    }
  }, [current, themes]);

  return (
    <div
      className={`w-full flex justify-center ${themeClasses.container}`}
      style={{ height: "calc(var(--vh, 1vh) * 100)" }}
    >
      <div
        className={`w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl flex flex-col relative overflow-hidden ${getThemeTransition()}`}
        style={{ height: "100%" }}
      >
        {/* Header */}
        <div
          className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl z-50 ${themeClasses.header}`}
          style={{ height: "64px" }}
        >
          <HeaderLayout />
        </div>

        {/* Main */}
        <main
          className={`flex-grow overflow-y-auto hide-scrollbar mt-[64px] mb-[64px] ${themeClasses.main}`}
          style={{ height: "calc(100% - 128px)" }}
        >
          <AppRouter />
        </main>

        {/* Bottom Navbar */}
        <div
          className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-10 md:max-w-2xl lg:max-w-4xl xl:max-w-6xl ${themeClasses.navigation}`}
          style={{ height: "64px" }}
        >
          <NavbarLayout />
        </div>
      </div>
    </div>
  );
}

export default LayoutWrapper;
