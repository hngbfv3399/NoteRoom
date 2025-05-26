// TODO: HeaderLayout 컴포넌트는 헤더 UI를 렌더링하고 검색 기능을 담당함
// TODO: 새로운 SearchInput 컴포넌트를 사용하여 고급 검색 기능 제공
// TODO: useNavigate 훅을 사용해 라우팅 제어 (홈 경로 이동)
// TODO: goToHome 함수는 로고 클릭 시 홈("/") 경로로 이동
// TODO: 헤더는 NoteRoom 타이틀, 고급 검색 입력창, 알림 벨로 구성되어 있음

import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiTool } from "react-icons/fi";
import SearchInput from "./SearchInput";
import NotificationBell from "./NotificationBell";
import { maintenanceMode, isCurrentUserAdmin } from "@/utils/adminUtils";
import { auth } from "@/services/firebase";

function HeaderLayout() {
  const navigate = useNavigate();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const goToHome = () => {
    navigate("/");
  };

  // 점검 모드 상태 및 관리자 권한 확인
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const [maintenanceStatus, adminStatus] = await Promise.all([
            maintenanceMode.isMaintenanceMode(),
            isCurrentUserAdmin(currentUser)
          ]);
          setIsMaintenanceMode(maintenanceStatus);
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error('상태 확인 실패:', error);
      }
    };

    checkStatus();

    // 30초마다 점검 모드 상태 확인
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex items-center justify-between px-6">
      <div className="flex items-center space-x-3">
        <h1
          onClick={goToHome}
          className="text-2xl font-semibold cursor-pointer transition-colors"
        >
          NoteRoom
        </h1>
        
        {/* 관리자에게만 점검 모드 상태 표시 */}
        {isAdmin && isMaintenanceMode && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <FiTool className="w-4 h-4" />
            <span>점검 모드</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 max-w-xl mx-6">
        <SearchInput />
      </div>
      <div className="flex items-center space-x-4">
        <NotificationBell />
      </div>
    </div>
  );
}

export default HeaderLayout;