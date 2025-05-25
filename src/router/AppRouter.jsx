import { Routes, Route } from "react-router-dom";
import MainHome from "@/pages/MainHome";
import MemoDetail from "@/pages/MemoDetail";
import SearchPage from "@/pages/SearchPage";
import SettingPage from "@/pages/SettingPage";
import UserProfile from "@/pages/UserProfile";
import WritePage from "@/pages/WritePage";
import ThreadPage from "@/pages/ThreadPage";
import NotFound from "@/pages/NotFound";
import TestDataPage from "@/pages/TestDataPage";
import { auth } from "@/services/firebase";
import { Navigate } from "react-router-dom";

// 보호된 라우트 컴포넌트
const ProtectedRoute = ({ children }) => {
  const user = auth.currentUser;
  if (!user) {
    return <Navigate to="/" />;
  }
  return children;
};

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<MainHome />} />
      <Route path="/note/:id" element={
        <ProtectedRoute>
          <MemoDetail />
        </ProtectedRoute>
      } />
      <Route path="/write" element={
        <ProtectedRoute>
          <WritePage />
        </ProtectedRoute>
      } />
      <Route path="/thread" element={
        <ProtectedRoute>
          <ThreadPage />
        </ProtectedRoute>
      } />
      <Route path="/search/:searchParam" element={<SearchPage />} />
      <Route path="/setting" element={
        <ProtectedRoute>
          <SettingPage />
        </ProtectedRoute>
      } />
      <Route path="/profile/:userId" element={
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      } />
      <Route path="/test-data" element={<TestDataPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRouter;
