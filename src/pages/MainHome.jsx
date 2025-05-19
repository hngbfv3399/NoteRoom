import noteData from "../constants/noteData";
import CategoryBanner from '../components/MainHomeLayouts/CategoryBanner'
import MainContent from "../components/MainHomeLayouts/MainContent";
import MenuList from "../components/MainHomeLayouts/MenuList";

function MainHome() {
  const category = ["새 노트", "핫 노트", "감정 분석", "친구 찾기"];
  const verticalScrollStyle = {
    overflowY: "auto",
    padding: "15px",
    border: "1px solid #ccc",
    textAlign: "center",
  };
  return (
    <div className="h-full">
      <CategoryBanner noteData={noteData}/>
      {/* 세로 스크롤 영역 */}
      <div style={verticalScrollStyle} className="h-full">
        <MenuList category={category}/>
        <MainContent noteData={noteData}/>
      </div>
    </div>
  );
}

export default MainHome;
