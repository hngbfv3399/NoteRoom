// ThemeSelector.jsx
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "@/store/theme/slice";
import { db, auth } from "@/services/firebase";
import { doc, updateDoc } from "firebase/firestore";

function ThemeSelector() {
  const dispatch = useDispatch();
  const { themes, current } = useSelector((state) => state.theme);

  const handleThemeChange = async (themeKey) => {
    dispatch(setTheme(themeKey));

    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { themeColor: themeKey });
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {Object.keys(themes).map((themeKey) => (
        <button
          key={themeKey}
          onClick={() => handleThemeChange(themeKey)}
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
