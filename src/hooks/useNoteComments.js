import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
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
      
      // 🔥 Firestore에서 최신 사용자 정보 가져오기
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      
      const newComment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 고유 ID 생성
        content: content.trim(),
        author: userData?.displayName || "익명", // author 필드 사용
        userName: userData?.displayName || "익명", // 호환성을 위해 유지
        authorUid: currentUser.uid, // authorUid 필드 사용
        createdAt: new Date(),
        replies: [], // 대댓글 배열 초기화
        replyCount: 0 // 대댓글 수 초기화
      };
      
      const noteRef = doc(db, "notes", noteId);
      await updateDoc(noteRef, {
        comment: arrayUnion(newComment),
        commentCount: increment(1) // 댓글 카운트 증가
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
      
      // 🔥 Firestore에서 최신 사용자 정보 가져오기
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      
      const noteData = noteDoc.data();
      const comments = noteData.comment || [];
      
      // 해당 댓글 찾기
      const commentIndex = comments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) throw new Error("댓글을 찾을 수 없습니다.");
      
      const newReply = {
        id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 고유 ID 생성
        content: content.trim(),
        author: userData?.displayName || "익명", // author 필드 사용
        userName: userData?.displayName || "익명", // 호환성을 위해 유지
        authorUid: currentUser.uid, // authorUid 필드 사용
        createdAt: new Date()
      };
      
      // 답글 추가
      const updatedComments = [...comments];
      if (!updatedComments[commentIndex].replies) {
        updatedComments[commentIndex].replies = [];
      }
      updatedComments[commentIndex].replies.push(newReply);
      
      // replyCount 업데이트
      updatedComments[commentIndex].replyCount = updatedComments[commentIndex].replies.length;
      
      // Firestore 업데이트 (답글은 댓글 카운트에 포함되지 않음)
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