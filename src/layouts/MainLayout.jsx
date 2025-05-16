import { BrowserRouter, useLocation } from "react-router-dom";
import HeaderLayout from "../components/layouts/HeaderLayout";
import NavbarLayout from "../components/layouts/NavbarLayout";
import AppRouter from "../router/AppRouter";


function LayoutWrapper() {
  const location = useLocation();
  const isWritePage = location.pathname === "/write";
  const isThreadPage = location.pathname === "/thread";

  return (
    <div className="w-full flex justify-center bg-gray-100 min-h-screen">
      {/* 중앙 고정 프레임 (모바일 기준) */}
      <div className="w-full max-w-md h-screen bg-white flex flex-col relative overflow-hidden">
        {!isWritePage && <HeaderLayout />}

        <main className="overflow-y-auto pb-16">
          <AppRouter />
        </main>

       {!isThreadPage && <NavbarLayout />} 
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
