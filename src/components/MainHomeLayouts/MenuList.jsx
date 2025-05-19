import ThemedButton from "../ui/ThemedButton";
function MenuList({ category }) {
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-2 mb-4">
      {category.map((item, index) => (
        <ThemedButton
          key={index}
          className="p-5 text-center border border-gray-300 rounded"
        >
          {item}
        </ThemedButton>
      ))}
    </div>
  );
}

export default MenuList;
