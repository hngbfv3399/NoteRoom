import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";
import MemoDetail from "./MemoDetail";
import useOpenModal from "@/hooks/useOpenModal";
import { getModalThemeClass } from "@/utils/themeHelper";
import { useSelector } from "react-redux";

function SearchPage() {
  const { searchParam } = useParams();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const { isOpen, open, close } = useOpenModal();
  const { current, themes } = useSelector((state) => state.theme);
  const modalBgClass = themes[current] ? getModalThemeClass(themes[current]) : "bg-white";

  useEffect(() => {
    async function fetchNotes() {
      setLoading(true);
      try {
        const notesRef = collection(db, "notes");
        const snapshot = await getDocs(notesRef);

        const filtered = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((note) => {
            const lowerSearch = searchParam.toLowerCase();
            return (
              (note.title || "").toLowerCase().includes(lowerSearch) ||
              (note.authorName || "").toLowerCase().includes(lowerSearch) ||
              (note.category || "").toLowerCase().includes(lowerSearch) ||
              (note.content || "").toLowerCase().includes(lowerSearch)
            );
          });

        setNotes(filtered);
      } catch (error) {
        console.error("검색 중 오류 발생:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNotes();
  }, [searchParam]);

  function handleOpenModal(note) {
    setSelectedNote(note);
    open();
  }

  function handleCloseModal() {
    close();
    setTimeout(() => setSelectedNote(null), 300);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 relative">
      <h2 className="text-3xl mb-8">검색 결과: "{searchParam}"</h2>

      {loading && <p>로딩 중...</p>}

      {!loading && notes.length === 0 && <p>검색어에 맞는 결과가 없습니다.</p>}

      {!loading &&
        notes.map((note) => {
          const preview =
            (note.content || "").replace(/<[^>]+>/g, "").slice(0, 100) +
            ((note.content || "").length > 100 ? "..." : "");

          return (
            <div
              key={note.id}
              className="mb-6 p-5 rounded-2xl border border-gray-300 hover:border-gray-500 transition-colors duration-300 cursor-pointer flex gap-5 items-start"
              onClick={() => handleOpenModal(note)}
            >
              {note.image ? (
                <img
                  src={note.image}
                  alt={note.title}
                  className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-32 h-20 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400 text-sm">
                  이미지 없음
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-2xl mb-2">{note.title || "제목 없음"}</h3>
                <div className="flex justify-between text-sm mb-3 font-mono">
                  <span>작성자: {note.authorName || "익명"}</span>
                  <span>카테고리: {note.category || "없음"}</span>
                </div>
                <p className="leading-relaxed">{preview}</p>
              </div>
            </div>
          );
        })}

      {selectedNote && (
        <>
          <div
            className={`fixed inset-0 z-40 transition-opacity duration-300 ${
              isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={handleCloseModal}
          />
          <div
            className={`
              fixed left-1/2 top-0 transform -translate-x-1/2
              rounded-lg shadow-lg
              w-[95vw] max-w-[1000px]
              max-h-[70vh] overflow-y-auto p-6 z-50
              transition-transform duration-300 hide-scrollbar
              ${modalBgClass}
              ${isOpen ? "translate-y-[5vh]" : "-translate-y-full"}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold leading-none"
              onClick={handleCloseModal}
              aria-label="Close modal"
            >
              ✕
            </button>
            <MemoDetail note={selectedNote} />
          </div>
        </>
      )}
    </div>
  );
}

export default SearchPage;
