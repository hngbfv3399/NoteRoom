import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, setDoc, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { db, auth } from "@/services/firebase";

export function useNoteDetail(noteId) {
  return useQuery({
    queryKey: ["noteDetail", noteId],
    queryFn: async () => {
      if (!noteId) throw new Error("노트 ID가 필요합니다.");
      
      const noteDoc = await getDoc(doc(db, "notes", noteId));
      
      if (!noteDoc.exists()) {
        throw new Error("노트를 찾을 수 없습니다.");
      }
      
      const noteData = { id: noteDoc.id, ...noteDoc.data() };
      
      // 데이터 유효성 검사
      if (!noteData.title && !noteData.content) {
        throw new Error("노트 데이터가 손상되었습니다.");
      }
      
      return noteData;
    },
    staleTime: 1000 * 60 * 5, // 5분
    cacheTime: 1000 * 60 * 30, // 30분
    enabled: !!noteId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}

export function useNoteLike(noteId) {
  const queryClient = useQueryClient();
  const currentUser = auth.currentUser;
  
  // 좋아요 상태 조회
  const { data: likeData } = useQuery({
    queryKey: ["noteLike", noteId, currentUser?.uid],
    queryFn: async () => {
      if (!currentUser || !noteId) return { liked: false, count: 0 };
      
      const [likeDoc, noteDoc] = await Promise.all([
        getDoc(doc(db, "notes", noteId, "likes", currentUser.uid)),
        getDoc(doc(db, "notes", noteId))
      ]);
      
      return {
        liked: likeDoc.exists(),
        count: noteDoc.data()?.likes || 0
      };
    },
    staleTime: 1000 * 60 * 2, // 2분
    enabled: !!currentUser && !!noteId
  });
  
  // 좋아요 토글 뮤테이션
  const likeMutation = useMutation({
    mutationFn: async ({ liked }) => {
      if (!currentUser || !noteId) throw new Error("로그인이 필요합니다.");
      
      const likeDocRef = doc(db, "notes", noteId, "likes", currentUser.uid);
      const noteDocRef = doc(db, "notes", noteId);
      
      if (liked) {
        // 좋아요 취소
        await deleteDoc(likeDocRef);
        await updateDoc(noteDocRef, { likes: increment(-1) });
      } else {
        // 좋아요 추가
        await setDoc(likeDocRef, { 
          userId: currentUser.uid,
          createdAt: new Date()
        });
        await updateDoc(noteDocRef, { likes: increment(1) });
      }
      
      return !liked;
    },
    onSuccess: (newLikedState) => {
      // 캐시 업데이트
      queryClient.setQueryData(["noteLike", noteId, currentUser?.uid], (old) => ({
        ...old,
        liked: newLikedState,
        count: old.count + (newLikedState ? 1 : -1)
      }));
      
      // 노트 상세 캐시도 업데이트
      queryClient.setQueryData(["noteDetail", noteId], (old) => ({
        ...old,
        likes: old.likes + (newLikedState ? 1 : -1)
      }));
    }
  });
  
  return {
    liked: likeData?.liked || false,
    likeCount: likeData?.count || 0,
    toggleLike: () => likeMutation.mutate({ liked: likeData?.liked }),
    isLoading: likeMutation.isLoading
  };
} 