import { useDispatch } from "react-redux";
import ThemedButton from "../ui/ThemedButton";
import {
  setCategoryFilter,
  setCategoryFilterReset,
} from "../../features/noteDataSlice";
function CategoryBanner({ category }) {
  const dispatch = useDispatch();
  const clikedCategoryButton = (item, index) => {
    if (index === 0) {
      dispatch(setCategoryFilterReset());
    } else {
      dispatch(setCategoryFilter(item));
    }
    console.log(item);
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
          style={itemStyle}
          key={index}
          onClick={() => clikedCategoryButton(item, index)}
        >
          {item}
        </ThemedButton>
      ))}
    </div>
  );
}

export default CategoryBanner;
