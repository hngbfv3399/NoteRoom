// TODO: NavbarLayout 컴포넌트는 하단 내비게이션 바 역할을 함
// TODO: Redux에서 현재 테마 정보(current, themes)를 가져와 테마에 맞는 CSS 클래스 적용
// TODO: Firebase auth 상태를 구독하여 로그인된 사용자(userId) 정보를 상태로 관리
// TODO: 로그인한 사용자의 경우 프로필 링크에 userId를 포함하여 개인 프로필 페이지로 이동하게 처리
// TODO: 로그인하지 않은 경우 프로필 아이콘 클릭 시 설정 페이지("/setting")로 이동
// TODO: NavLink 컴포넌트는 내비게이션 버튼 UI 담당 (아이콘 + 라벨)
// TODO: 각 내비게이션 버튼은 React Router의 Link 컴포넌트를 사용해 SPA 내 페이지 이동 구현
// TODO: 아이콘은 react-icons 라이브러리 사용하여 시각적 표시
// TODO: useEffect로 auth 상태 변경 시 userId 업데이트, 컴포넌트 언마운트 시 구독 해제 처리


import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getThemeClass } from "@/utils/themeHelper";
import { auth } from "@/services/firebase";
import { useEffect, useState } from "react";
import { ROUTES } from '@/constants/routes';

// react-icons import
import { AiFillHome } from "react-icons/ai";
import { FaRegFileAlt, FaUserCircle } from "react-icons/fa";
import { MdCreate } from "react-icons/md";
import { FiSettings } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";

function NavbarLayout() {
  const { current, themes } = useSelector((state) => state.theme);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const themeClass = themes[current] ? getThemeClass(themes[current]) : "";

  return (
    <div className={`${themeClass} h-full flex items-center justify-around px-4`}>
      <NavLink to="/" icon={<AiFillHome size={22} />} label="홈" />
      <NavLink to={ROUTES.THREAD} icon={<FaRegFileAlt size={22} />} label="스레드" />
      <NavLink to={ROUTES.WRITE} icon={<MdCreate size={22} />} label="작성" />
      <NavLink to={ROUTES.EMOTION} icon={<BsEmojiSmile size={22} />} label="감정" />
      <NavLink to={userId ? `/profile/${userId}` : ROUTES.SETTING} icon={<FaUserCircle size={22} />} label="프로필" />
      <NavLink to={ROUTES.SETTING} icon={<FiSettings size={22} />} label="설정" />
    </div>
  );
}

function NavLink({ to, icon, label }) {
  return (
    <Link 
      to={to} 
      className="flex flex-col items-center gap-1 transition-colors hover:opacity-80"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}

export default NavbarLayout;
