import noteData from "../constants/noteData";
import { useNavigate } from "react-router-dom";

function ThreadPage() {
  const navigate = useNavigate();
  const goToHome = ()=>{
    navigate('/');
}
  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
      {noteData.map((item, index) => (
        <div
          key={index}
          className="relative h-full w-full snap-start flex items-center justify-center"
        >
          <img
            src={item.image}
            className="w-full h-full object-cover"
            alt={`노트 이미지 ${index}`}
          />
          <button onClick={goToHome} className="absolute top-4 left-4 text-2xl"> &lt;- </button>
          <div className="absolute bottom-40 left-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            {item.title}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ThreadPage;
