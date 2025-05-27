import { useQuery } from "@tanstack/react-query";
import { getUserDataByUid, loadNotesPage } from "@/utils/firebaseNoteDataUtil";

export function useUserProfile(userId) {
  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!userId) throw new Error("사용자 ID가 필요합니다.");
      
      // 🚀 병렬로 사용자 데이터와 노트 데이터 로딩
      const [userData, notesData] = await Promise.all([
        getUserDataByUid(userId),
        loadNotesPage(null, 20, userId, null, 'new', 'profile')
      ]);
      
      return {
        user: userData,
        notes: notesData.notes,
        noteCount: notesData.notes.length
      };
    },
    staleTime: 1000 * 60 * 10, // 10분
    cacheTime: 1000 * 60 * 30, // 30분
    enabled: !!userId,
    retry: 2
  });
} 