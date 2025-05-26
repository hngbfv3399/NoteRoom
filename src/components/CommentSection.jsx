/**
 * 댓글 섹션 컴포넌트
 * 
 * 기능:
 * - 댓글 작성 및 표시
 * - 대댓글 시스템
 * - 실시간 업데이트
 * - 테마 시스템 지원
 * - 에러 처리 및 로딩 상태
 */

import React, { useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNotesInfinite } from "@/hooks/useNotesInfinite";
import { addCommentToNote, addReplyToComment } from "@/utils/firebaseNoteDataUtil";
import { errorHandlers } from "@/utils/errorHandler";
import ThemedButton from "@/components/ui/ThemedButton";
import ReportButton from "@/components/common/ReportButton";
import { REPORT_TYPES } from "@/constants/adminConstants";
import { getThemeClass, getInputThemeClass, getCardThemeClass } from "@/utils/themeHelper";
import dayjs from "dayjs";

// 안전한 날짜 포맷팅 함수
const formatDate = (timestamp) => {
  if (!timestamp) return "날짜 없음";
  
  try {
    // Firestore Timestamp인 경우
    if (typeof timestamp.toDate === 'function') {
      return dayjs(timestamp.toDate()).format("YY.MM.DD HH:mm");
    }
    // Date 객체인 경우
    if (timestamp instanceof Date) {
      return dayjs(timestamp).format("YY.MM.DD HH:mm");
    }
    // 숫자 타임스탬프인 경우
    if (typeof timestamp === 'number') {
      return dayjs(timestamp).format("YY.MM.DD HH:mm");
    }
    // 문자열인 경우
    if (typeof timestamp === 'string') {
      return dayjs(timestamp).format("YY.MM.DD HH:mm");
    }
    
    return "날짜 없음";
  } catch (error) {
    console.warn("Date formatting error:", error);
    return "날짜 없음";
  }
};

const CommentSection = ({ noteId }) => {
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const themeClass = getThemeClass(currentTheme);

  // 상태 관리
  const [input, setInput] = useState("");
  const [replyInputs, setReplyInputs] = useState({}); // 각 댓글별 답글 입력 상태
  const [showReplyForms, setShowReplyForms] = useState({}); // 각 댓글별 답글 폼 표시 상태
  const [showReplies, setShowReplies] = useState({}); // 각 댓글별 대댓글 표시 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState({});

  // useNotesInfinite 훅으로 페이징된 노트 데이터 가져오기
  const { data, isLoading, error, refetch } = useNotesInfinite();

  // 모든 페이지의 노트를 하나의 배열로 합치기
  const allNotes = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page?.notes || []);
  }, [data]);

  // noteId에 해당하는 노트 찾아 comment 배열 가져오기
  const note = useMemo(() => {
    return allNotes.find((n) => n.id === noteId);
  }, [allNotes, noteId]);

  // 댓글 목록 (최신순 정렬)
  const comments = useMemo(() => {
    if (!note?.comment) return [];
    
    return [...note.comment]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA; // 최신순
      });
  }, [note?.comment]);

  // 댓글 작성 폼 제출 핸들러
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!input.trim()) {
      return;
    }

    if (!noteId) {
      errorHandlers.general(new Error("게시글 정보가 없습니다."));
      return;
    }

    setIsSubmitting(true);

    try {
      await addCommentToNote(noteId, input.trim());
      setInput(""); // 입력창 초기화
      await refetch(); // 댓글 목록 refetch
      
      // 성공 토스트
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('댓글이 등록되었습니다.', 'success');
      }
    } catch (error) {
      errorHandlers.comment(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [input, noteId, refetch]);

  // 대댓글 제출 핸들러
  const handleReplySubmit = useCallback(async (commentId) => {
    const replyContent = replyInputs[commentId];
    
    if (!replyContent?.trim()) {
      return;
    }

    setReplySubmitting(prev => ({ ...prev, [commentId]: true }));

    try {
      await addReplyToComment(noteId, commentId, replyContent.trim());
      
      // 답글 입력창 초기화 및 폼 숨기기
      setReplyInputs(prev => ({ ...prev, [commentId]: "" }));
      setShowReplyForms(prev => ({ ...prev, [commentId]: false }));
      
      // 대댓글 목록 표시
      setShowReplies(prev => ({ ...prev, [commentId]: true }));
      
      await refetch(); // 댓글 목록 refetch
      
      // 성공 토스트
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('답글이 등록되었습니다.', 'success');
      }
    } catch (error) {
      errorHandlers.comment(error);
    } finally {
      setReplySubmitting(prev => ({ ...prev, [commentId]: false }));
    }
  }, [replyInputs, noteId, refetch]);

  // textarea에서 Enter키 처리 (Shift+Enter는 줄바꿈)
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  // 답글 입력창 엔터키 처리
  const handleReplyKeyDown = useCallback((e, commentId) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleReplySubmit(commentId);
    }
  }, [handleReplySubmit]);

  // 답글 버튼 클릭 핸들러
  const handleReplyButtonClick = useCallback((commentId) => {
    setShowReplyForms(prev => ({ 
      ...prev, 
      [commentId]: !prev[commentId] 
    }));
  }, []);

  // 대댓글 토글 핸들러
  const handleToggleReplies = useCallback((commentId) => {
    setShowReplies(prev => ({ 
      ...prev, 
      [commentId]: !prev[commentId] 
    }));
  }, []);

  // 답글 입력 변경 핸들러
  const handleReplyInputChange = useCallback((commentId, value) => {
    setReplyInputs(prev => ({ ...prev, [commentId]: value }));
  }, []);

  // 댓글 불러오는 중 로딩 메시지
  if (isLoading) {
    return (
      <div className={`p-6 text-center ${themeClass}`}>
        <div className="animate-pulse">
          <div className={`h-4 ${currentTheme?.cardBg || 'bg-gray-200'} rounded mb-2`}></div>
          <div className={`h-4 ${currentTheme?.cardBg || 'bg-gray-200'} rounded w-3/4 mx-auto`}></div>
        </div>
        <p className={`mt-4 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
          댓글을 불러오는 중입니다...
        </p>
      </div>
    );
  }

  // 댓글 불러오기 에러 메시지
  if (error) {
    return (
      <div className={`p-6 text-center ${themeClass}`}>
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-red-600 mb-4">댓글을 불러오는 중 오류가 발생했습니다.</p>
        <ThemedButton onClick={() => refetch()}>
          다시 시도
        </ThemedButton>
      </div>
    );
  }

  return (
    <div className={`mt-8 ${themeClass}`}>
      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-3">
          <textarea
            className={getInputThemeClass(currentTheme)}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="댓글을 입력하세요. (Enter: 등록, Shift+Enter: 줄바꿈)"
            rows={3}
            disabled={isSubmitting}
            style={{ resize: 'vertical', minHeight: '80px' }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-sm ${currentTheme?.textSecondary || 'text-gray-500'}`}>
            {input.length}/1000
          </span>
          <ThemedButton 
            type="submit"
            disabled={!input.trim() || isSubmitting} // 입력 내용 없으면 비활성화
            loading={isSubmitting}
          >
            {isSubmitting ? '등록 중...' : '댓글 등록'}
          </ThemedButton>
        </div>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          // 댓글이 없을 때 안내 메시지
          <div className={`text-center py-8 ${getCardThemeClass(currentTheme)} rounded-lg`}>
            <div className={`text-4xl mb-3 ${currentTheme?.textSecondary || 'text-gray-400'}`}>💬</div>
            <p className={`${currentTheme?.textSecondary || 'text-gray-500'}`}>
              첫 번째 댓글을 작성해보세요!
            </p>
          </div>
        ) : (
          // 댓글이 있으면 최신순으로 정렬해 렌더링
          comments.map((comment) => (
            <div 
              key={comment.id || `comment-${comment.createdAt}`}
              className={`${getCardThemeClass(currentTheme)} rounded-lg p-4`}
            >
              {/* 댓글 헤더 */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <strong className={`font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
                      {comment.userName || "익명"}
                    </strong>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${currentTheme?.textSecondary || 'text-gray-500'}`}>
                        {formatDate(comment.createdAt)}
                      </span>
                      <ReportButton
                        targetType={REPORT_TYPES.COMMENT}
                        targetId={comment.id}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 댓글 내용 */}
              <p className={`whitespace-pre-wrap mb-3 ${currentTheme?.textColor || 'text-gray-800'}`}>
                {comment.content}
              </p>

              {/* 댓글 액션 버튼들 */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleReplyButtonClick(comment.id)}
                  className={`text-sm ${currentTheme?.linkColor || 'text-blue-600'} hover:underline transition-colors`}
                >
                  답글
                </button>
                
                {comment.replies && comment.replies.length > 0 && (
                  <button
                    onClick={() => handleToggleReplies(comment.id)}
                    className={`text-sm ${currentTheme?.linkColor || 'text-blue-600'} hover:underline transition-colors`}
                  >
                    {showReplies[comment.id] ? '답글 숨기기' : `답글 ${comment.replies.length}개 보기`}
                  </button>
                )}
              </div>

              {/* 답글 작성 폼 */}
              {showReplyForms[comment.id] && (
                <div className="mt-4 pl-4 border-l-2 border-gray-200">
                  <div className="flex space-x-2">
                    <textarea
                      className={`${getInputThemeClass(currentTheme)} flex-1`}
                      value={replyInputs[comment.id] || ""}
                      onChange={(e) => handleReplyInputChange(comment.id, e.target.value)}
                      onKeyDown={(e) => handleReplyKeyDown(e, comment.id)}
                      placeholder="답글을 입력하세요..."
                      rows={2}
                      disabled={replySubmitting[comment.id]}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-2">
                    <ThemedButton
                      variant="secondary"
                      size="sm"
                      onClick={() => handleReplyButtonClick(comment.id)}
                      disabled={replySubmitting[comment.id]}
                    >
                      취소
                    </ThemedButton>
                    <ThemedButton
                      size="sm"
                      onClick={() => handleReplySubmit(comment.id)}
                      disabled={!replyInputs[comment.id]?.trim() || replySubmitting[comment.id]}
                      loading={replySubmitting[comment.id]}
                    >
                      답글 등록
                    </ThemedButton>
                  </div>
                </div>
              )}

              {/* 대댓글 목록 */}
              {showReplies[comment.id] && comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3">
                  {comment.replies
                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // 대댓글은 오래된 순
                    .map((reply) => (
                      <div 
                        key={reply.id || `reply-${reply.createdAt}`}
                        className={`${currentTheme?.hoverBg || 'bg-gray-50'} rounded-lg p-3`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <strong className={`font-medium text-sm ${currentTheme?.textColor || 'text-gray-700'}`}>
                            {reply.userName || "익명"}
                          </strong>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs ${currentTheme?.textSecondary || 'text-gray-500'}`}>
                              {formatDate(reply.createdAt)}
                            </span>
                            <ReportButton
                              targetType={REPORT_TYPES.REPLY}
                              targetId={reply.id}
                              size="xs"
                            />
                          </div>
                        </div>
                        <p className={`text-sm whitespace-pre-wrap ${currentTheme?.textColor || 'text-gray-800'}`}>
                          {reply.content}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
