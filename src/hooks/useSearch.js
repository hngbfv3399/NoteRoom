import { useQuery } from "@tanstack/react-query";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";

export function useSearch(searchTerm, filters = {}) {
  return useQuery({
    queryKey: ["search", searchTerm, filters],
    queryFn: async () => {
      if (!searchTerm?.trim()) return { notes: [], users: [] };
      
      const lowerSearch = searchTerm.toLowerCase();
      
      // 노트와 사용자 데이터를 병렬로 가져오기
      const [notesResult, usersResult] = await Promise.all([
        // 노트 검색
        (async () => {
          const notesRef = collection(db, "notes");
          let notesQuery = query(notesRef, orderBy("createdAt", "desc"), limit(20));
          
          // 카테고리 필터 적용
          if (filters.category) {
            notesQuery = query(notesRef, 
              where("category", "==", filters.category),
              orderBy("createdAt", "desc"), 
              limit(20)
            );
          }
          
          const notesSnapshot = await getDocs(notesQuery);
          return notesSnapshot.docs
            .map((doc) => ({ 
              id: doc.id, 
              ...doc.data(),
              // 기본값 설정
              views: doc.data().views || 0,
              likes: doc.data().likes || 0,
              commentCount: doc.data().commentCount || 0,
              authorName: doc.data().authorName || doc.data().author || '익명'
            }))
            .filter((note) => {
              // 클라이언트 사이드 텍스트 검색 (최소화)
              return (
                note.title?.toLowerCase().includes(lowerSearch) ||
                note.content?.toLowerCase().includes(lowerSearch) ||
                note.author?.toLowerCase().includes(lowerSearch) ||
                note.authorName?.toLowerCase().includes(lowerSearch)
              );
            });
        })(),
        
        // 사용자 검색
        (async () => {
          const usersRef = collection(db, "users");
          const usersSnapshot = await getDocs(query(usersRef, limit(50)));
          return usersSnapshot.docs
            .map((doc) => ({ 
              id: doc.id, 
              ...doc.data(),
              // 기본값 설정
              noteCount: doc.data().noteCount || 0,
              followerCount: doc.data().followerCount || 0,
              displayName: doc.data().displayName || '익명 사용자'
            }))
            .filter((user) => {
              return (
                user.displayName?.toLowerCase().includes(lowerSearch) ||
                user.email?.toLowerCase().includes(lowerSearch) ||
                user.bio?.toLowerCase().includes(lowerSearch)
              );
            })
            .slice(0, 10); // 결과 제한
        })()
      ]);
      
      return { 
        notes: notesResult, 
        users: usersResult 
      };
    },
    staleTime: 1000 * 60 * 5, // 5분
    cacheTime: 1000 * 60 * 15, // 15분
    enabled: !!searchTerm?.trim(),
    retry: 1
  });
} 