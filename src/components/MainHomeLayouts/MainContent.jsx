import { useSelector } from "react-redux";

function MainContent() {
  const noteData = useSelector((state) => state.noteData.noteData);
  const filterCategory = useSelector((state) => state.noteData.filterCategory);
  const filteredNotes = filterCategory
    ? noteData.filter((note) => note.category === filterCategory)
    : noteData;

  return (
    <div className="space-y-4 flex flex-col items-center">
      {filteredNotes.map((item) => (
        <div
          key={item.id}
          className="relative w-full max-w-5xl h-[40vh] p-4 rounded-md text-base"
        >
          <div className="absolute top-1/2 left-1/2 w-[90%] h-[70%] transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded overflow-hidden">
            <img
              src={item.image}
              alt={`노트 ${item.id}`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute top-3 right-2 text-xs md:text-base">{item.date}</div>
          <div className="absolute bottom-2 left-4 text-sm md:text-base">
            {item.title}
          </div>
          <div className="absolute bottom-2 right-4 text-xs md:text-sm text-gray-600">
            좋아요: {item.likes} 댓글: {item.commentCount} 조회수: {item.views}
          </div>
        </div>
      ))}
    </div>
  );
}



export default MainContent;
