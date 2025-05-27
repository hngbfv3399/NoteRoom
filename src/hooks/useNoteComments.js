import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "@/services/firebase";

export function useNoteComments(noteId) {
  return useQuery({
    queryKey: ["noteComments", noteId],
    queryFn: async () => {
      if (!noteId) throw new Error("노트 ID가 필요합니다.");
      
      const noteDoc = await getDoc(doc(db, "notes", noteId));
      
      if (!noteDoc.exists()) {
        throw new Error("노트를 찾을 수 없습니다.");
      }
      
      const noteData = noteDoc.data();
      const comments = noteData.comment || [];
      
      // 댓글을 최신순으로 정렬
      const sortedComments = [...comments].sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA; // 최신순
      });
      
      return sortedComments;
    },
    staleTime: 1000 * 60 * 2, // 2분
    enabled: !!noteId
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const currentUser = auth.currentUser;
  
  return useMutation({
    mutationFn: async ({ noteId, content }) => {
      if (!currentUser) throw new Error("로그인이 필요합니다.");
      if (!content?.trim()) throw new Error("댓글 내용을 입력해주세요.");
      
      const newComment = {
        id: Date.now().toString(),
        content: content.trim(),
        userName: currentUser.displayName || "익명", // 기존 필드명 사용
        author: currentUser.displayName || "익명",   // 호환성을 위한 추가 필드
        authorUid: currentUser.uid,
        createdAt: new Date(),
        replies: []
      };
      
      const noteRef = doc(db, "notes", noteId);
      await updateDoc(noteRef, {
        comment: arrayUnion(newComment)
      });
      
      return newComment;
    },
    onSuccess: (newComment, { noteId }) => {
      // 댓글 캐시 업데이트
      queryClient.setQueryData(["noteComments", noteId], (oldComments) => {
        if (!oldComments) return [newComment];
        return [newComment, ...oldComments]; // 최신 댓글을 맨 위에
      });
      
      // 노트 상세 캐시도 무효화
      queryClient.invalidateQueries({ queryKey: ["noteDetail", noteId] });
      

    }
  });
}

export function useAddReply() {
  const queryClient = useQueryClient();
  const currentUser = auth.currentUser;
  
  return useMutation({
    mutationFn: async ({ noteId, commentId, content }) => {
      if (!currentUser) throw new Error("로그인이 필요합니다.");
      if (!content?.trim()) throw new Error("답글 내용을 입력해주세요.");
      
      // 현재 노트 데이터 가져오기
      const noteDoc = await getDoc(doc(db, "notes", noteId));
      if (!noteDoc.exists()) throw new Error("노트를 찾을 수 없습니다.");
      
      const noteData = noteDoc.data();
      const comments = noteData.comment || [];
      
      // 해당 댓글 찾기
      const commentIndex = comments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) throw new Error("댓글을 찾을 수 없습니다.");
      
      const newReply = {
        id: Date.now().toString(),
        content: content.trim(),
        userName: currentUser.displayName || "익명", // 기존 필드명 사용
        author: currentUser.displayName || "익명",   // 호환성을 위한 추가 필드
        authorUid: currentUser.uid,
        createdAt: new Date()
      };
      
      // 답글 추가
      const updatedComments = [...comments];
      if (!updatedComments[commentIndex].replies) {
        updatedComments[commentIndex].replies = [];
      }
      updatedComments[commentIndex].replies.push(newReply);
      
      // Firestore 업데이트
      const noteRef = doc(db, "notes", noteId);
      await updateDoc(noteRef, {
        comment: updatedComments
      });
      
      return { commentId, reply: newReply };
    },
    onSuccess: ({ commentId, reply }, { noteId }) => {
      // 댓글 캐시 업데이트
      queryClient.setQueryData(["noteComments", noteId], (oldComments) => {
        if (!oldComments) return [];
        
        return oldComments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), reply]
            };
          }
          return comment;
        });
      });
      
      // 노트 상세 캐시도 무효화
      queryClient.invalidateQueries({ queryKey: ["noteDetail", noteId] });
      

    }
  });
} 