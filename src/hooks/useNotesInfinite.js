import { useInfiniteQuery } from "@tanstack/react-query";
import { loadNotesPage } from "@/utils/firebaseNoteDataUtil";

export function useNotesInfinite(pageSize = 10) {
  return useInfiniteQuery({
    queryKey: ["notes"],
    queryFn: async ({ pageParam }) => loadNotesPage(pageParam, pageSize),
    getNextPageParam: (lastPage) => lastPage.lastVisible ?? undefined,
    staleTime: 1000 * 60 * 5,
  });
}
