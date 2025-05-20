import { useDispatch } from "react-redux";
import { sortNewNote,sortHotNote } from "../../features/noteDataSlice";
import ThemedButton from "../ui/ThemedButton";
function QuickButton({ QuickButtonList, openFriendModal,openEmotionModal }) {
  const dispatch = useDispatch();
  
  const clickedQuickButton = (item, index) => {
    switch (index) {
      case 0:
        dispatch(sortNewNote());
        break;
      case 1:
        dispatch(sortHotNote());
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
