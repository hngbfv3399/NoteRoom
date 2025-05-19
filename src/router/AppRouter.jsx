import { Routes, Route } from "react-router-dom";
import MainHome from "../pages/MainHome";
import MemoDetail from "../pages/MemoDetail";
import SearchPage from "../pages/SearchPage";
import SettingPage from "../pages/SettingPage";
import UserProfile from "../pages/UserProfile";
import WritePage from "../pages/WritePage";
import ThreadPage from "../pages/ThreadPage";
import NotFound from "../pages/NotFound";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<MainHome />} />
      <Route path="/note/:id" element={<MemoDetail />} />
      <Route path="/write" element={<WritePage />} />
      <Route path="/thread" element={<ThreadPage />} />
      <Route path="/search/:searchParam" element={<SearchPage />} />
      <Route path="/setting" element={<SettingPage />} />
      <Route path="/profile/:userId" element={<UserProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRouter;
