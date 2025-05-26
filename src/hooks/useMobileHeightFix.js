import { useEffect } from "react";

const setRealViewportHeight = () => {
  // TODO: 모바일 브라우저의 실제 높이를 계산해 --vh 변수로 설정
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
};

/**
 * 모바일 브라우저에서 실제 뷰포트 높이 보정
 * 예: CSS에서 height: calc(var(--vh) * 100) 로 사용
 */
const useMobileHeightFix = () => {
  useEffect(() => {
    setRealViewportHeight(); // TODO: 컴포넌트 마운트 시 초기 실행

    window.addEventListener("resize", setRealViewportHeight); // TODO: 리사이즈 시마다 높이 재계산

    return () => {
      // TODO: 컴포넌트 언마운트 시 이벤트 제거
      window.removeEventListener("resize", setRealViewportHeight);
    };
  }, []);
};

export default useMobileHeightFix;
