import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, addDoc, updateDoc, collection } from "firebase/firestore";
import { db, auth } from "@/services/firebase";

export function useNoteEdit(editId) {
  return useQuery({
    queryKey: ["noteEdit", editId],
    queryFn: async () => {
      if (!editId) return null;
      
      console.log('🔍 [useNoteEdit] 수정할 노트 로딩:', editId);
      
      const noteDoc = await getDoc(doc(db, "notes", editId));
      
      if (!noteDoc.exists()) {
        throw new Error("수정할 노트를 찾을 수 없습니다.");
      }
      
      const noteData = { id: noteDoc.id, ...noteDoc.data() };
      
      console.log('✅ [useNoteEdit] 노트 로딩 완료:', noteData.title);
      
      return noteData;
    },
    staleTime: 1000 * 60 * 10, // 10분
    enabled: !!editId
  });
}

export function useNoteSave() {
  const queryClient = useQueryClient();
  const currentUser = auth.currentUser;
  
  return useMutation({
    mutationFn: async ({ noteData, editId }) => {
      if (!currentUser) throw new Error("로그인이 필요합니다.");
      
      const notePayload = {
        ...noteData,
        userUid: currentUser.uid,
        authorName: currentUser.displayName || "익명",
        updatedAt: new Date()
      };
      
      if (editId) {
        // 노트 수정
        console.log('📝 [useNoteSave] 노트 수정:', editId);
        await updateDoc(doc(db, "notes", editId), notePayload);
        return { id: editId, ...notePayload };
      } else {
        // 새 노트 생성
        console.log('📝 [useNoteSave] 새 노트 생성');
        notePayload.createdAt = new Date();
        notePayload.views = 0;
        notePayload.likes = 0;
        
        const docRef = await addDoc(collection(db, "notes"), notePayload);
        return { id: docRef.id, ...notePayload };
      }
    },
    onSuccess: (savedNote, { editId }) => {
      // 캐시 무효화 및 업데이트
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notesInfinite"] });
      
      if (editId) {
        // 수정된 노트 캐시 업데이트
        queryClient.setQueryData(["noteDetail", editId], savedNote);
        queryClient.setQueryData(["noteEdit", editId], savedNote);
      }
      
      console.log('✅ [useNoteSave] 노트 저장 완료:', savedNote.title);
    }
  });
} 