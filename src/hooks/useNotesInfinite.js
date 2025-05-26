import { useInfiniteQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { loadNotesPage } from "@/utils/firebaseNoteDataUtil";

export function useNotesInfinite(pageSize = 10) {
  // Redux에서 필터링 및 정렬 상태 가져오기
  const { filterCategory, sortType } = useSelector((state) => state.noteData);

  return useInfiniteQuery({
    queryKey: ["notes", filterCategory, sortType], // 필터/정렬 상태가 변경되면 새로 쿼리
    queryFn: async ({ pageParam }) => loadNotesPage(pageParam, pageSize, null, filterCategory, sortType),
    getNextPageParam: (lastPage) => lastPage.lastVisible ?? undefined,
    staleTime: 1000 * 60 * 5,
    // 에러 발생 시 재시도 비활성화
    retry: false,
  });
}
