import { useQuery } from "@tanstack/react-query";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

const fetchComments = async (noteId) => {
  if (!noteId) return [];
  const q = query(collection(db, "notes", noteId, "comment"), orderBy("createdAt", "asc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export function useComments(noteId) {
  return useQuery({
    queryKey: ["comments", noteId],
    queryFn: () => fetchComments(noteId),
    enabled: !!noteId,  // noteId가 있을 때만 실행
    staleTime: 1000 * 60 * 5,
  });
}
