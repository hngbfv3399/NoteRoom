import { useState, useEffect } from "react"; 
import { BrowserRouter } from "react-router-dom";
import MainLayout from "./rootLayouts/MainLayout"; // 메인 홈페이지 레이아웃
import LoadingPage from "./components/LoadingPage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import LoginPage from "./pages/auth/LoginPage";

function App() {
  // 유저 정보를 담는 상태관리 변수
  // TODO (JH, 2025-05-25): 사용자 정보 로컬 스토리지에 저장해서 세션 유지 기능 고려
  const [user, setUser] = useState(null);

  // 로그인 상태 확인 중 여부
  // FIXME (JH): Firebase 인증 실패 시에도 loading이 false로 바뀌지 않을 수 있음 → 예외 처리 필요
  const [loading, setLoading] = useState(true);

  // 현재 로그인 중인 사용자를 기억하는 코드 (Firebase에서 인증 상태 확인)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);         // 로그인된 유저 정보를 상태에 저장
      setLoading(false);            // 로딩 끝
    });

    return () => unsubscribe();     // 컴포넌트 언마운트 시 이벤트 해제
  }, []);

  // 로딩 중일 때 로딩 페이지 보여줌
  // FIXME: 초기 로딩 상태가 잠깐 깜빡이는 현상 있음 → 로딩 UX 개선 고려
  if (loading) {
    return <LoadingPage />; 
  }

  return (
    <BrowserRouter>
      {user ? <MainLayout /> : <LoginPage />}
    </BrowserRouter>
  );
}

export default App;
