import noteData from "../constants/noteData";

function ThreadPage() {
  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
      {noteData.map((item, index) => (
        <div
          key={index}
          className="relative h-[90vh] w-full snap-start flex items-center justify-center"
        >
          <img
            src={item.image}
            className="w-full h-full object-cover"
            alt={`노트 이미지 ${index}`}
          />
          <div className="absolute bottom-10 left-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            {item.title}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ThreadPage;
