import noteData from "../constants/noteData";
import { useNavigate } from "react-router-dom";
import ThreadSlide from "../components/ThreadLayout/ThreadSlide";

function ThreadPage() {
  const navigate = useNavigate();
  const goToHome = () => {
    navigate("/");
  };

  return (
    <div className="w-full h-screen overflow-y-auto snap-y snap-mandatory hide-scrollbar">
      {noteData.map((item, index) => (
        <ThreadSlide key={index} item={item} index={index} onGoHome={goToHome} />
      ))}
    </div>
  );
}

export default ThreadPage;
