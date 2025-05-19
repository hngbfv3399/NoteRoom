function ThreadSlide({ item, index, onGoHome }) {
  return (
    <div
      key={index}
      className="relative h-screen w-full snap-start flex items-center justify-center"
    >
      <img
        src={item.image}
        className="absolute w-full h-full object-cover"
        alt={`노트 이미지 ${index}`}
      />
      <button
        onClick={onGoHome}
        className="absolute top-4 left-4 text-2xl text-white bg-black/50 px-2 py-1 rounded"
      >
        &lt;-
      </button>
      <div className="absolute bottom-40 left-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
        {item.title}
      </div>
    </div>
  );
}

export default ThreadSlide;
