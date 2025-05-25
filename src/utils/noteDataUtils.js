// 날짜 문자열을 Date 객체로 변환 (ex: "2024년 05월 21일" → Date)
export function parseKoreanDateString(dateStr) {
  return new Date(dateStr.replace(/년|월/g, "-").replace(/일/, "").trim());
}

// 최신순 정렬 (createdAt 기준)
export const sortNewNote = (notes) => {
  return [...notes].sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });
};

// 인기순 정렬 (조회수, 좋아요, 댓글 수 기준)
export const sortHotNote = (notes) => {
  return [...notes].sort((a, b) => {
    // 각 지표별 가중치 설정
    const weights = {
      views: 1,
      likes: 2,
      comments: 3
    };

    // 노트별 점수 계산
    const getScore = (note) => {
      const viewScore = (note.views || 0) * weights.views;
      const likeScore = (note.likes || 0) * weights.likes;
      const commentScore = (note.commentCount || 0) * weights.comments;
      return viewScore + likeScore + commentScore;
    };

    return getScore(b) - getScore(a);
  });
};

// 카테고리별 필터링
export const filterByCategory = (notes, category) => {
  if (!category) return notes;
  return notes.filter(note => note.category === category);
};
