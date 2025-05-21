import CategoryBanner from '../components/MainHomeLayouts/CategoryBanner';
import MainContent from "../components/MainHomeLayouts/MainContent";
import QuickButton from "../components/MainHomeLayouts/QuickButton";
import ModalOne from '../components/MainHomeLayouts/modals/ModalOne.jsx';
import { useState } from 'react';

function MainHome() {
  const QuickButtonList = ["최신 노트", "인기 노트", "감정 분석", "친구 찾기"];
  const category = ["전체","일상","정보","감성","시","사진","동영상"];
  const verticalScrollStyle = {
    overflowY: "auto",
    padding: "15px",
    border: "1px solid #ccc",
    textAlign: "center",
  };

  // 필터 및 정렬 상태
  const [filterCategory, setFilterCategory] = useState(null); // null = 전체
  const [sortType, setSortType] = useState("new"); // "new" or "hot"

  const [isEmotionModalOpen, setIsEmotionModalOpen] = useState(false);
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);

  const openEmotionModal = () => setIsEmotionModalOpen(true);
  const closeEmotionModal = () => setIsEmotionModalOpen(false);
  
  const openFriendModal = () => setIsFriendModalOpen(true);
  const closeFriendModal = () => setIsFriendModalOpen(false);

  // 정렬 함수 (QuickButton에서 호출)
  const onSortNew = () => setSortType("new");
  const onSortHot = () => setSortType("hot");

  return (
    <div className="h-full">
      <CategoryBanner 
        category={category} 
        filterCategory={filterCategory} 
        setFilterCategory={setFilterCategory} 
      />
      <div style={verticalScrollStyle} className="h-full hide-scrollbar">
        <QuickButton 
          QuickButtonList={QuickButtonList} 
          openFriendModal={openFriendModal} 
          openEmotionModal={openEmotionModal} 
          onSortNew={onSortNew}
          onSortHot={onSortHot}
        />
        <MainContent filterCategory={filterCategory} sortType={sortType} />
      </div>
      <ModalOne isOpen={isEmotionModalOpen} onClose={closeEmotionModal}>
        <h2 className="text-xl font-bold mb-4">감정 분석 모달</h2>
        <p>여기에 감정 분석 관련 내용을 작성하세요.</p>
      </ModalOne>
      <ModalOne isOpen={isFriendModalOpen} onClose={closeFriendModal}>
        <h2 className="text-xl font-bold mb-4">이건 친구 찾기</h2>
        <p>친구 함 찾아보소ㅋ</p>
      </ModalOne>
    </div>
  );
}

export default MainHome;
