
// 날짜 문자열을 Date 객체로 변환 (ex: "2024년 05월 21일" → Date)
export function parseKoreanDateString(dateStr) {
  return new Date(dateStr.replace(/년|월/g, "-").replace(/일/, "").trim());
}

// 최신 날짜 순 정렬
export function sortNewNote(notes) {
  return [...notes].sort(
    (a, b) => parseKoreanDateString(b.date) - parseKoreanDateString(a.date)
  );
}

// 좋아요 많은 순 정렬
export function sortHotNote(notes) {
  return [...notes].sort((a, b) => b.likes - a.likes);
}

// 카테고리 필터링
export function filterByCategory(notes, category) {
  if (!category) return notes;
  return notes.filter((note) => note.category === category);
}
