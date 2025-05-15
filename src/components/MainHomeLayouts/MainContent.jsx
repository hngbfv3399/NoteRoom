function MainContent({ noteData }) {
  return (
    <div className="space-y-4">
      {noteData.map((item) => (
        <div
          key={item.id}
          className="relative h-[40vh] p-4 bg-[#fffafa] rounded-md text-base"
        >
          <div className="absolute top-1/2 left-1/2 w-[90%] h-[70%] transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded overflow-hidden">
            <img
              src={item.image}
              alt={`노트 ${item.id}`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-2 left-4 text-sm sm:text-base">
            {item.title}
          </div>
          <div className="absolute bottom-2 right-4 text-xs sm:text-sm text-gray-600">
            좋아요: {item.likes} 댓글: {item.commentCount} 조회수: {item.views}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MainContent;
