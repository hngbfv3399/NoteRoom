import { useQuery } from "@tanstack/react-query";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

// TODO: 댓글을 실시간으로 가져와야 한다면 getDocs 대신 onSnapshot 사용을 고려해볼 것.
// TODO: 댓글 추가/삭제 시 refetch를 트리거하는 로직을 이 훅에서 함께 관리할 수 있도록 확장할 수 있음.
const fetchComments = async (noteId) => {
  if (!noteId) return [];

  const q = query(
    collection(db, "notes", noteId, "comment"),
    orderBy("createdAt", "asc")
  );

  const querySnapshot = await getDocs(q);

  // FIXME: createdAt이 존재하지 않거나 null일 경우 앱이 깨질 수 있음. 유효성 검사 필요.
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// TODO: 추후 pagination 또는 lazy loading이 필요하면 옵션 확장 필요.
export function useComments(noteId) {
  return useQuery({
    queryKey: ["comments", noteId],
    queryFn: () => fetchComments(noteId),
    enabled: !!noteId, // noteId가 있을 때만 실행
    staleTime: 1000 * 60 * 5, // TODO: 캐시 시간을 상황에 따라 조절할 수 있도록 외부에서 설정 가능하게 변경 고려
  });
}
