import ThemedButton from "../ui/ThemedButton";

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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
  };
  return (
    <div style={containerStyle} className="hide-scrollbar">
      {noteData.map((item) => (
        <ThemedButton style={itemStyle} key={item.id}>
          {item.category}
        </ThemedButton>
      ))}
    </div>
  );
}

export default CategoryBanner;
