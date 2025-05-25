import { useSelector, useDispatch } from 'react-redux';
import { setFilterCategory, setSortType } from '@/store/notes/slice'
import CategoryBanner from '@/features/MainHome/CategoryBanner';
import MainContent from '@/features/MainHome/MainContent';
import QuickButton from '@/features/MainHome/QuickButton';
import ModalOne from '@/features/MainHome/ModalOne';
import useOpenModal from '@/hooks/useOpenModal';
import ErrorBoundary from '@/components/ErrorBoundary';

function MainHome() {
  const dispatch = useDispatch();
  const filterCategory = useSelector((state) => state.noteData.filterCategory);
  const sortType = useSelector((state) => state.noteData.sortType);
  const category = ["전체", "일상", "정보", "감성", "시", "사진", "동영상"];
  
  const emotionModal = useOpenModal();
  const friendModal = useOpenModal();

  const onSetFilterCategory = (category) => {
    dispatch(setFilterCategory(category === '전체' ? null : category));
  };

  const onSortNew = () => dispatch(setSortType("new"));
  const onSortHot = () => dispatch(setSortType("hot"));

  const quickButtons = [
    { label: "최신 노트", action: onSortNew },
    { label: "인기 노트", action: onSortHot },
    { label: "감정 분석", action: emotionModal.open },
    { label: "친구 찾기", action: friendModal.open },
  ];

  return (
    <ErrorBoundary>
      <div className="h-full">
        <CategoryBanner 
          category={category} 
          filterCategory={filterCategory} 
          setFilterCategory={onSetFilterCategory} 
        />
        <div className="h-full overflow-y-auto p-[15px] border text-center hide-scrollbar">
          <QuickButton buttons={quickButtons} />
          <MainContent filterCategory={filterCategory} sortType={sortType} />
        </div>

        <ModalOne isOpen={emotionModal.isOpen} onClose={emotionModal.close}>
          <h2 className="text-xl font-bold mb-4">감정 분석 모달</h2>
          <p>여기에 감정 분석 관련 내용을 작성하세요.</p>
        </ModalOne>
        <ModalOne isOpen={friendModal.isOpen} onClose={friendModal.close}>
          <h2 className="text-xl font-bold mb-4">이건 친구 찾기</h2>
          <p>친구 함 찾아보소ㅋ</p>
        </ModalOne>
      </div>
    </ErrorBoundary>
  );
}

export default MainHome;
