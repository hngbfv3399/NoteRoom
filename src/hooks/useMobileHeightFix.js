import { useEffect } from "react";

const setRealViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
};

/**
 * 모바일 브라우저에서 실제 뷰포트 높이 보정
 */
const useMobileHeightFix = () => {
  useEffect(() => {
    setRealViewportHeight();
    window.addEventListener("resize", setRealViewportHeight);
    return () => window.removeEventListener("resize", setRealViewportHeight);
  }, []);
};

export default useMobileHeightFix;
