import { useState, useEffect } from "react"; 
import { BrowserRouter } from "react-router-dom";
import MainLayout from "./rootLayouts/MainLayout";
import LoadingPage from "./components/LoadingPage";
import ToastNotification from "./components/ToastNotification";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import LoginPage from "./pages/auth/LoginPage";
import { initializeNotifications } from "./utils/pushNotificationUtils";

// NOTE : 해당 컴포넌트는 전체적인 앱을 관리하는 컴포넌트
// NOTE : 하위 컴포넌트로 LoadingPage,LoginPage, MainLayout이 있음

function App() {
  //NOTE : 유저의 상태를 저장 하는 부분
  //FIXME : 해당 유저가 신규유저인지 기존 유저인지 복귀유저인지 구분이 안감 처음 읽을떄 헷갈릴듯
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * NOTE : 렌더링 시 해당 유저가 기존에 가입된 유저인지 확인 하는 코드
   * onAuthStateChanged 함수는 로그인 상태를 전달해주는 함수임
   * 유저의 객체정보를 반환값으로 전달해줌
   * 로그인 시 유저의 정보 , 비로그인 시 : null
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);       
      setLoading(false);
      
      // 로그인된 사용자가 있을 때 알림 권한 초기화
      if (currentUser) {
        try {
          await initializeNotifications();
        } catch (error) {
          console.warn('알림 초기화 실패:', error);
        }
      }
    });

    // WHY: 리스너 등록했으면 해제도 해줘야 함 (메모리 누수 방지)
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingPage />; 
  }

  return (
    //user가 활성화가 된다면 
    <BrowserRouter>
      {user ? <MainLayout /> : <LoginPage />}
      {/* 전역 토스트 알림 컴포넌트 */}
      <ToastNotification />
    </BrowserRouter>
  );
}

export default App;
