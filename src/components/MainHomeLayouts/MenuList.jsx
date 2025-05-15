function MenuList({ category }) {
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-2 mb-4">
      {category.map((item, index) => (
        <div
          key={index}
          className="bg-gray-100 p-5 text-center border border-gray-300 rounded"
        >
          {item}
        </div>
      ))}
    </div>
  );
}

export default MenuList;
