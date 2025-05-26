/**
 * 메인 애플리케이션 레이아웃 컴포넌트
 * 
 * 기능:
 * - 로그인된 사용자의 테마 설정 적용
 * - 전체 애플리케이션 레이아웃 래퍼 렌더링
 * 
 * NOTE: 인증된 사용자만 접근 가능한 메인 앱 영역
 * TODO: 사용자별 개인화 설정 추가 고려
 */
import LayoutWrapper from "./LayoutWrapper";
import useUserTheme from "@/hooks/useUserTheme"; // 커스텀 훅 분리 추천

function MainLayout() {
  // 로그인된 사용자의 테마 설정을 적용
  useUserTheme();
  
  return <LayoutWrapper />;
}

export default MainLayout;
