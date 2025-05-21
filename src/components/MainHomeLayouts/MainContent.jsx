import { useQuery } from "@tanstack/react-query";
import { loadNoteToFirebase } from "../../utils/firebaseNoteDataUtil";
import { filterByCategory, sortNewNote, sortHotNote } from '../../utils/noteDataUtils'

function MainContent({ filterCategory, sortType }) {
  const { data: noteData = [], isLoading, isError } = useQuery({
    queryKey: ["notes"],
    queryFn: loadNoteToFirebase,
  });

  if (isLoading) return <div>로딩 중...</div>;
  if (isError) return <div>에러 발생</div>;

  let filteredNotes = filterByCategory(noteData, filterCategory);

  if (sortType === 'new') filteredNotes = sortNewNote(filteredNotes);
  else if (sortType === 'hot') filteredNotes = sortHotNote(filteredNotes);

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
