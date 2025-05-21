import { useNavigate } from "react-router-dom";
import ThreadSlide from "../components/ThreadLayout/ThreadSlide";
import { useQuery } from "@tanstack/react-query";
import { loadNoteToFirebase } from '../utils/firebaseNoteDataUtil'

function ThreadPage() {
  const navigate = useNavigate();
  const goToHome = () => {
    navigate("/");
  };
  const { data: noteData = [], isLoading, isError } = useQuery({
    queryKey: ["notes"],
    queryFn: loadNoteToFirebase,
  });

  if (isLoading) return <div>로딩 중...</div>;
  if (isError) return <div>에러 발생</div>;
  

  return (
    <div className="w-full h-full overflow-y-auto snap-y snap-mandatory hide-scrollbar">
      {noteData.map((item, index) => (
        <ThreadSlide key={index} item={item} index={index} onGoHome={goToHome} />
      ))}
    </div>
  );
}

export default ThreadPage;
