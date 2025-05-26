/**
 * 메인 홈페이지 컴포넌트
 * 
 * 주요 기능:
 * - 카테고리별 노트 필터링
 * - 정렬 방식 변경 (최신순/인기순)
 * - 빠른 액션 버튼 제공
 * - 친구 찾기 모달
 * 
 * NOTE: Redux를 통해 필터링 및 정렬 상태 관리
 * TODO: 친구 찾기 기능 구현
 */
import React, { useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { setFilterCategory, setSortType } from '@/store/notes/slice'
import CategoryBanner from '@/features/MainHome/CategoryBanner';
import MainContent from '@/features/MainHome/MainContent';
import QuickButton from '@/features/MainHome/QuickButton';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ROUTES } from '@/constants/routes';

function MainHome() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // MainContent ref 추가
  const mainContentRef = useRef();
  
  // Redux 상태에서 현재 필터 및 정렬 상태 가져오기
  const filterCategory = useSelector((state) => state.noteData.filterCategory);
  
  // 사용 가능한 카테고리 목록
  // NOTE: "전체"는 모든 카테고리를 보여주는 특별한 옵션
  const category = ["전체", "일상", "기술", "여행", "음식", "영화/드라마", "음악", "독서", "취미", "기타"];

  // 글 작성 후 돌아왔을 때 새로고침
  useEffect(() => {
    // location.state에 refreshNeeded가 있으면 새로고침
    if (location.state?.refreshNeeded && mainContentRef.current) {
      mainContentRef.current.refreshData();
      
      // state 정리 (뒤로가기 시 중복 새로고침 방지)
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 카테고리 필터 변경 핸들러
  // NOTE: "전체" 선택 시 null로 설정하여 모든 카테고리 표시
  const onSetFilterCategory = (category) => {
    dispatch(setFilterCategory(category === '전체' ? null : category));
  };

  // 정렬 방식 변경 핸들러들
  const onSortNew = () => dispatch(setSortType("new"));  // 최신순
  const onSortHot = () => dispatch(setSortType("hot"));  // 인기순

  // 감정 추적 페이지로 이동
  const goToEmotionTracking = () => navigate(ROUTES.EMOTION);

  // 공지사항 페이지로 이동
  const goToAnnouncement = () => navigate(ROUTES.ANNOUNCEMENT);

  // 빠른 액션 버튼 설정
  const quickButtons = [
    { label: "최신 노트", action: onSortNew, icon: "🆕" },
    { label: "인기 노트", action: onSortHot, icon: "🔥" },
    { label: "감정 추적", action: goToEmotionTracking, icon: "🎭" },
    { label: "공지사항", action: goToAnnouncement, icon: "📢" },
  ];

  return (
    <ErrorBoundary>
      <div className="h-full">
        {/* 카테고리 선택 배너 */}
        <CategoryBanner 
          category={category} 
          filterCategory={filterCategory} 
          setFilterCategory={onSetFilterCategory} 
        />
        
        {/* 메인 콘텐츠 영역 */}
        <div className="h-full overflow-y-auto p-[15px] border text-center hide-scrollbar">
          {/* 빠른 액션 버튼들 */}
          <div className="opacity-100 transform translate-y-0 mb-4">
            <QuickButton buttons={quickButtons} />
          </div>
          
          {/* 노트 목록 표시 - ref 추가 */}
          <MainContent ref={mainContentRef} />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default MainHome;
