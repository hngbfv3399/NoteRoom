import { Routes, Route } from "react-router-dom";
import MainHome from "@/pages/MainHome";
import MemoDetail from "@/pages/MemoDetail";
import SearchPage from "@/pages/SearchPage";
import SettingPage from "@/pages/SettingPage";
import UserProfile from "@/pages/UserProfile";
import WritePage from "@/pages/WritePage";
import ThreadPage from "@/pages/ThreadPage";
import EmotionTrackingPage from "@/pages/EmotionTrackingPage";
import AnnouncementPage from "@/pages/AnnouncementPage";
import AdminAnnouncementPage from "@/pages/AdminAnnouncementPage";
import AdminPage from "@/pages/AdminPage";
import MyReportsPage from "@/pages/MyReportsPage";
import TestPage from "@/pages/TestPage";

import NotFound from "@/pages/NotFound";
import { auth } from "@/services/firebase";
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { checkAdminPermission } from "@/utils/adminUtils";
import { ROUTES, ADMIN_ROUTES } from "@/constants/routes";

const ProtectedRoute = ({ children }) => {
  const user = auth.currentUser;
  if (!user) {
    return <Navigate to="/" />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const adminStatus = await checkAdminPermission(user.uid);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('관리자 권한 확인 실패:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">권한을 확인하는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
};

function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<MainHome />} />
      <Route path={`${ROUTES.NOTE}/:id`} element={
        <ProtectedRoute>
          <MemoDetail />
        </ProtectedRoute>
      } />
      <Route path={ROUTES.WRITE} element={
        <ProtectedRoute>
          <WritePage />
        </ProtectedRoute>
      } />
      <Route path={ROUTES.THREAD} element={
        <ProtectedRoute>
          <ThreadPage />
        </ProtectedRoute>
      } />
      <Route path={ROUTES.EMOTION} element={
        <ProtectedRoute>
          <EmotionTrackingPage />
        </ProtectedRoute>
      } />
      <Route path={ROUTES.ANNOUNCEMENT} element={<AnnouncementPage />} />
      <Route path={ADMIN_ROUTES.ANNOUNCEMENT} element={
        <AdminRoute>
          <AdminAnnouncementPage />
        </AdminRoute>
      } />
      <Route path={ADMIN_ROUTES.DASHBOARD} element={
        <AdminRoute>
          <AdminPage />
        </AdminRoute>
      } />
      <Route path={`${ROUTES.SEARCH}/:searchParam`} element={<SearchPage />} />
      <Route path={ROUTES.SETTING} element={
        <ProtectedRoute>
          <SettingPage />
        </ProtectedRoute>
      } />
      <Route path={`${ROUTES.PROFILE}/:userId`} element={
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      } />
      <Route path={ROUTES.MY_REPORTS} element={
        <ProtectedRoute>
          <MyReportsPage />
        </ProtectedRoute>
      } />
      <Route path="/test" element={
        <ProtectedRoute>
          <TestPage />
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRouter;
