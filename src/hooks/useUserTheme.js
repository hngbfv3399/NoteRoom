import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { auth, db } from "@/services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { setTheme } from "@/store/theme/slice";

/**
 * 로그인한 유저의 테마 설정을 Firebase에서 받아와 Redux에 저장
 */
const useUserTheme = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.themeColor) {
            dispatch(setTheme(data.themeColor));
          }
        }
      } catch (err) {
        console.error("테마 로딩 실패", err);
        // TODO: 기본 테마 적용 고려
      }
    });

    return () => unsubscribe();
  }, [dispatch]);
};

export default useUserTheme;
