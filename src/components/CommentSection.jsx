// TODO: noteId를 받아 해당 노트의 댓글 섹션을 렌더링하는 컴포넌트 작성
// TODO: useNotesInfinite 훅을 사용해 페이징된 노트 데이터를 가져오기
// TODO: 모든 페이지의 노트를 하나의 배열로 합쳐서 관리하기
// TODO: noteId에 해당하는 노트를 찾아 해당 노트의 comment 배열을 가져오기
// TODO: 댓글 입력 상태 관리 (input state)
// TODO: 댓글 작성 폼 제출 시 addCommentToNote 함수 호출해 Firestore에 댓글 등록하기
// TODO: 댓글 작성 후 입력창 초기화 및 댓글 목록 refetch 호출
// TODO: textarea에서 Enter키 눌렀을 때 댓글 제출, Shift+Enter는 줄바꿈 처리하기
// TODO: 댓글 불러오는 중일 때 로딩 메시지 보여주기
// TODO: 댓글 불러오기 중 에러 발생 시 에러 메시지 출력하기
// TODO: 댓글이 없으면 '첫 번째 댓글을 작성해보세요!' 안내 메시지 보여주기
// TODO: 댓글이 있으면 최신순으로 정렬해 댓글 리스트 렌더링하기
// TODO: 댓글 작성 버튼은 입력 내용 없으면 비활성화 처리하기
// TODO: 날짜 표시 시 Firestore Timestamp, Date 객체, 숫자 타입 모두 처리하는 함수 사용하기


import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNotesInfinite } from "@/hooks/useNotesInfinite";
import { addCommentToNote } from "@/utils/firebaseNoteDataUtil";
import ThemedButton from "@/components/ui/ThemedButton";
import ReportButton from "@/components/common/ReportButton";
import { REPORT_TYPES } from "@/constants/adminConstants";
import dayjs from "dayjs";

const formatDate = (timestamp) => {
  if (!timestamp) return "날짜 없음";
  
  try {
    // Firestore Timestamp인 경우
    if (typeof timestamp.toDate === 'function') {
      return dayjs(timestamp.toDate()).format("YY.MM.DD HH:mm");
    }
    // Date 객체이거나 타임스탬프인 경우
    return dayjs(timestamp).format("YY.MM.DD HH:mm");
  } catch (error) {
    console.error("Date formatting error:", error);
    return "날짜 없음";
  }
};

const CommentSection = ({ noteId }) => {
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  const [input, setInput] = useState("");

  // useNotes 훅으로 전체 노트 데이터 불러오기
  const { data, isLoading, error, refetch } = useNotesInfinite();

  // 모든 페이지의 노트를 하나의 배열로 합치기
  const allNotes = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page?.notes || []);
  }, [data]);

  // noteId에 해당하는 노트 찾기
  const note = useMemo(() => {
    return allNotes.find((n) => n.id === noteId);
  }, [allNotes, noteId]);

  // comment 필드를 사용하도록 수정
  const comments = note?.comment || [];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim()) {
      return;
    }

    if (!noteId) {
      alert("게시글 정보가 없습니다.");
      return;
    }

    try {
      await addCommentToNote(noteId, input);
      setInput("");
      refetch(); // 댓글 등록 후 노트 데이터 다시 불러오기
    } catch (error) {
      console.error("댓글 등록 실패:", error);
      alert(error.message || "댓글 등록 중 오류가 발생했습니다.");
    }
  };

  // 엔터키 눌러도 등록 가능하도록 처리 (Shift+Enter는 줄바꿈)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (isLoading) return (
    <div className={`p-4 text-center opacity-70 ${currentTheme?.textColor || 'text-gray-600'}`}>
      댓글을 불러오는 중입니다...
    </div>
  );

  if (error) return (
    <div className="p-4 text-center text-red-600">
      댓글을 불러오는 중 오류가 발생했습니다.
    </div>
  );

  return (
    <div className={`mt-8`}>
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          className={`w-full p-3 rounded-lg resize-none focus:outline-none focus:ring-2 transition-all duration-200 ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputText || 'text-gray-800'} ${currentTheme?.inputBorder || 'border border-gray-300'} ${currentTheme?.inputFocus || 'focus:ring-blue-500'}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="댓글을 입력하세요. (Enter: 등록)"
          rows={3}
        />
        <ThemedButton 
          type="submit"
          className="mt-2"
          disabled={!input.trim()}
        >
          등록
        </ThemedButton>
      </form>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className={`text-center opacity-70 ${currentTheme?.textColor || 'text-gray-500'}`}>첫 번째 댓글을 작성해보세요!</p>
        ) : (
          comments
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt) // Date 객체 변환 없이 직접 비교
            .map((comment, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${currentTheme?.modalBgColor || 'bg-gray-50'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <strong className={`font-semibold ${currentTheme?.textColor || 'text-gray-700'}`}>{comment.userName || "익명"}</strong>
                      <span className={`text-sm opacity-60 ${currentTheme?.textColor || 'text-gray-500'}`}>
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className={`whitespace-pre-wrap ${currentTheme?.textColor || 'text-gray-800'}`}>{comment.content}</p>
                  </div>
                  
                  {/* 신고 버튼 */}
                  <div className="ml-2">
                    <ReportButton
                      contentType={REPORT_TYPES.COMMENT}
                      contentId={`${noteId}_${index}`} // 댓글 고유 ID 생성
                      contentTitle={`${comment.userName || "익명"}님의 댓글`}
                      size="xs"
                      variant="ghost"
                    />
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
