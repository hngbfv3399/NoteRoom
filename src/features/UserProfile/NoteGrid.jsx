import React from "react";
import LoginComponents from "@/components/LoginComponents";

function NoteGrid({ notes, onNoteClick }) {
  if (!notes) return <LoginComponents />;

  if (notes.length === 0) {
    return <div className="text-center py-10">작성한 글이 없습니다.</div>;
  }

  return (
    <section className="snap-start px-4 py-6">
      <div className="grid grid-cols-2 gap-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="h-40 rounded-xl shadow-lg p-4 flex flex-col justify-between cursor-pointer"
            onClick={() => onNoteClick(note)}
          >
            <h3 className="font-bold text-lg truncate">{note.title}</h3>
            <p
              className="text-sm line-clamp-3"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
            <small>
              {new Date(note.date || note.createdAt?.toDate?.() || note.createdAt).toLocaleDateString()}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}

export default NoteGrid;
