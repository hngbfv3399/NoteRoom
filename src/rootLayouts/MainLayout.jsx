import LayoutWrapper from "./LayoutWrapper";
import useUserTheme from "@/hooks/useUserTheme"; // 커스텀 훅 분리 추천

function MainLayout() {
  useUserTheme(); // 로그인된 유저의 테마 설정
  return <LayoutWrapper />;
}

export default MainLayout;
