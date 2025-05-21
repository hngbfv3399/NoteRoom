import ThemedButton from "../ui/ThemedButton";

function QuickButton({ QuickButtonList, onSortNew, onSortHot, openFriendModal, openEmotionModal }) {
  const clickedQuickButton = (item, index) => {
    switch (index) {
      case 0:
        onSortNew();
        break;
      case 1:
        onSortHot();
        break;
      case 2:
        openEmotionModal();
        break;
      case 3:
        openFriendModal();
        break;
      default:
        break;
    }
  }

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-2 mb-4">
      {QuickButtonList.map((item, index) => (
        <ThemedButton
          key={index}
          className="p-5 text-center border border-gray-300 rounded"
          onClick={() => clickedQuickButton(item, index)}
        >
          {item}
        </ThemedButton>
      ))}
    </div>
  );
}

export default QuickButton;
