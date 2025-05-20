import CategoryBanner from '../components/MainHomeLayouts/CategoryBanner';
import MainContent from "../components/MainHomeLayouts/MainContent";
import QuickButton from "../components/MainHomeLayouts/QuickButton";
import EmotionAnalysisModal from '../components/MainHomeLayouts/modals/EmotionAnalysisModal';
import { useState } from 'react';

function MainHome() {
  const [isEmotionModalOpen, setIsEmotionModalOpen] = useState(false);
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const QuickButtonList = ["최신 노트", "인기 노트", "감정 분석", "친구 찾기"];
  const category = ["전체","일상","정보","감성","시","사진","동영상"];
  const verticalScrollStyle = {
    overflowY: "auto",
    padding: "15px",
    border: "1px solid #ccc",
    textAlign: "center",
  };

  const openEmotionModal = () => setIsEmotionModalOpen(true);
  const closeEmotionModal = () => setIsEmotionModalOpen(false);
  
  const openFriendModal = () => setIsFriendModalOpen(true);
  const closeFriendModal = () => setIsFriendModalOpen(false);

  return (
    <div className="h-full">
      <CategoryBanner category={category}/>
      <div style={verticalScrollStyle} className="h-full hide-scrollbar">
        <QuickButton QuickButtonList={QuickButtonList} openFriendModal={openFriendModal} openEmotionModal={openEmotionModal} />
        <MainContent/>
      </div>
      <EmotionAnalysisModal isOpen={isEmotionModalOpen} onClose={closeEmotionModal}>
        <h2 className="text-xl font-bold mb-4">감정 분석 모달</h2>
        <p>여기에 감정 분석 관련 내용을 작성하세요.</p>
      </EmotionAnalysisModal>
      <EmotionAnalysisModal isOpen={isFriendModalOpen} onClose={closeFriendModal}>
        <h2 className="text-xl font-bold mb-4">이건 친구 찾기</h2>
        <p>친구 함 찾아보소ㅋ</p>
      </EmotionAnalysisModal>
    </div>
  );
}

export default MainHome;
