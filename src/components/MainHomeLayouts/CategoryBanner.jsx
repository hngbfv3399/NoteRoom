function CategoryBanner({ noteData }) {
  const containerStyle = {
    display: "flex",
    overflowX: "auto",
    padding: "15px",
  };
  const itemStyle = {
    flex: "0 0 auto",
    width: "calc(100% / 5)",
    height: "5vh",
    marginRight: "15px",
    background: "blue",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
  };
  return (
    <div style={containerStyle} className="hide-scrollbar">
      {noteData.map((item) => (
        <div style={itemStyle} key={item.id}>
          {item.category}
        </div>
      ))}
    </div>
  );
}

export default CategoryBanner;
