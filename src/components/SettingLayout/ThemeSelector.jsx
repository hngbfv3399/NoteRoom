import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "../../features/themeSlice"

function ThemeSelector() {
  const dispatch = useDispatch();
  const { themes, current } = useSelector((state) => state.theme);

  return (
    <div className="flex flex-wrap gap-2">
      {Object.keys(themes).map((themeKey) => (
        <button
          key={themeKey}
          onClick={() => dispatch(setTheme(themeKey))}
          className={`
            ${themes[themeKey].buttonBg} 
            ${themes[themeKey].buttonText} 
            px-4 py-2 rounded transition
            ${current === themeKey ? "ring-2 ring-offset-2 ring-blue-500" : ""}
          `}
        >
          {themeKey}
        </button>
      ))}
    </div>
  );
}

export default ThemeSelector;
