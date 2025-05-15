import noteData from "../constants/noteData";

function ThreadPage() {
  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
      {noteData.map((item, index) => (
        <div key={index} className="relative h-9/10 w-full snap-start flex items-center justify-center">
          <img src={item.image} className="w-full h-full object-cover" />
          <div className="absolute bottom-20 left-2 text-5xl font-bold text-white">
              {item.title}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ThreadPage;