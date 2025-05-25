import { useState, useCallback } from "react";
import { useNotesInfinite } from "@/hooks/useNotesInfinite";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { incrementNoteViews } from "@/utils/firebaseNoteDataUtil";
import LoadingSpinner from "@/components/LoadingPage";
import NoteCard from "./NoteCard";
import NoteModal from "./NoteModal";
import SkeletonCard from "@/components/SkeletonCard";
const ErrorDisplay = ({ error }) => (
  <div className="text-red-500 text-center p-4">
    에러 발생: {error?.message || "알 수 없는 오류"}
  </div>
);

const EmptyState = () => (
  <div className="text-center text-gray-500 py-8">
    현재 노트가 비어 있습니다. 새로운 노트를 작성해보세요!
  </div>
);

const NoteGrid = ({ notes, onNoteClick }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl">
    {notes.map((note) => (
      <NoteCard key={note.id} note={note} onClick={() => onNoteClick(note)} />
    ))}
  </div>
);

function MainContent() {
  const [selectedNote, setSelectedNote] = useState(null);
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useNotesInfinite();

  const notes = data?.pages.flatMap((page) => page.notes) ?? [];

  const { targetRef } = useInfiniteScroll({
    fetchMore: fetchNextPage,
    hasMore: hasNextPage,
  });

  const handleClickNote = useCallback(async (note) => {
    try {
      await incrementNoteViews(note.id);
    } catch (err) {
      console.error("뷰 수 증가 실패:", err);
    } finally {
      setSelectedNote(note);
    }
  }, []);

  const handleCloseModal = () => setSelectedNote(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-2xl space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      </div>
    );
  }
  
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div className="flex flex-col items-center space-y-4 h-full overflow-y-auto">
      {notes.length > 0 ? (
        <NoteGrid notes={notes} onNoteClick={handleClickNote} />
      ) : (
        <EmptyState />
      )}

      <div ref={targetRef}>
        {isFetchingNextPage && <LoadingSpinner />}
      </div>

      {!hasNextPage && notes.length > 0 && (
        <p className="text-center py-4 text-gray-500">모든 노트를 불러왔습니다</p>
      )}

      {selectedNote && (
        <NoteModal
          note={selectedNote}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default MainContent;
