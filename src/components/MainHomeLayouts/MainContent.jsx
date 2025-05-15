function MainContent({ noteData }) {
  const verticalItemStyle = {
    position: "relative",
    height: "40vh",
    padding: "10px",
    marginBottom: "15px",
    background: "#fffafa",
    borderRadius: "6px",
    fontSize: "1rem",
  };
  return (
    <>
      {noteData.map((item) => (
        <div style={verticalItemStyle} key={item.id}>
          <div className="absolute top-38 left-1/2 w-90 h-70 
                          transform -translate-x-1/2 -translate-y-1/2
                          flex items-center justify-center rounded">
            <img src={item.image} className="w-full h-full object-cover"/>
          </div>
          <div className="absolute bottom-2 left-4">
            {item.title}
          </div>
          <div className="absolute bottom-2 right-4">
               좋아요:{item.likes} 댓글:{item.commentCount} 조회수:{item.views}
          </div>
        </div>
      ))}
    </>
  );
}
export default MainContent;
