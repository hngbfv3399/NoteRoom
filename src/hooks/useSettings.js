import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/services/firebase";

export function useUserSettings() {
  const currentUser = auth.currentUser;
  
  return useQuery({
    queryKey: ["userSettings", currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) throw new Error("로그인이 필요합니다.");
      
      console.log('⚙️ [useUserSettings] 사용자 설정 로딩:', currentUser.uid);
      
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      
      if (!userDoc.exists()) {
        // 기본 설정 반환
        return {
          displayName: currentUser.displayName || "",
          email: currentUser.email || "",
          profileImage: "",
          bio: "",
          notifications: {
            email: true,
            push: true,
            comments: true,
            likes: true
          },
          privacy: {
            profilePublic: true,
            showEmail: false,
            allowMessages: true
          }
        };
      }
      
      const userData = userDoc.data();
      console.log('✅ [useUserSettings] 설정 로딩 완료');
      
      return userData;
    },
    staleTime: 1000 * 60 * 5, // 5분
    enabled: !!currentUser
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const currentUser = auth.currentUser;
  
  return useMutation({
    mutationFn: async (settingsData) => {
      if (!currentUser) throw new Error("로그인이 필요합니다.");
      
      console.log('⚙️ [useUpdateSettings] 설정 업데이트:', currentUser.uid);
      
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        ...settingsData,
        updatedAt: new Date()
      });
      
      return settingsData;
    },
    onSuccess: (updatedSettings) => {
      // 캐시 업데이트
      queryClient.setQueryData(["userSettings", currentUser?.uid], (old) => ({
        ...old,
        ...updatedSettings
      }));
      
      // 사용자 프로필 캐시도 무효화
      queryClient.invalidateQueries({ queryKey: ["userProfile", currentUser?.uid] });
      
      console.log('✅ [useUpdateSettings] 설정 업데이트 완료');
    }
  });
} 