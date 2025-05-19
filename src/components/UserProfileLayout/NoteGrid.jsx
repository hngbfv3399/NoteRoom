function NoteGrid() {
  return (
    <section className="min-h-screen snap-start px-4 py-6">
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="h-40 rounded-xl shadow-lg bg-white bg-opacity-80"
          ></div>
        ))}
      </div>
    </section>
  );
}

export default NoteGrid;
