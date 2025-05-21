import ThemedButton from "../ui/ThemedButton";

function CategoryBanner({ category, setFilterCategory }) {
  const clickedCategoryButton = (item, index) => {
    if (index === 0) {
      setFilterCategory(null);
    } else {
      setFilterCategory(item);
    }
  };

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
      {category.map((item, index) => (
        <ThemedButton
          style={
            itemStyle
          }
          key={index}
          onClick={() => clickedCategoryButton(item, index)}
        >
          {item}
        </ThemedButton>
      ))}
    </div>
  );
}

export default CategoryBanner;
