import { BrowserRouter, useLocation } from "react-router-dom";
import HeaderLayout from "../components/layouts/HeaderLayout";
import NavbarLayout from "../components/layouts/NavbarLayout";
import AppRouter from "../router/AppRouter";

function LayoutWrapper() {
  const location = useLocation();
  const path = location.pathname;

  const isWritePage = path === "/write";
  const isThreadPage = path === "/thread";

  const showHeader = isWritePage || (!isThreadPage && !isWritePage);
  const showNavbar = !isWritePage && !isThreadPage;

  const headerHeight = 64; // Tailwind 기준 pt-16 == 4rem == 64px
  const navbarHeight = 64;

  return (
    <div className="w-full flex justify-center bg-gray-100 min-h-screen">
      <div className="w-full max-w-md bg-white h-screen flex flex-col relative overflow-hidden">
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
