/**
 * 🚀 최적화된 댓글 섹션 컴포넌트
 * 
 * 주요 개선사항:
 * - React Query로 완전 전환 (댓글 전용 훅 사용)
 * - 불필요한 useNotesInfinite 호출 제거
 * - 메모이제이션으로 성능 최적화
 * - 에러 처리 및 로딩 상태 개선
 */

import React, { useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNoteComments, useAddComment, useAddReply } from "@/hooks/useNoteComments";
import { errorHandlers } from "@/utils/errorHandler";
import ThemedButton from "@/components/ui/ThemedButton";
import ReportButton from "@/components/common/ReportButton";
import { REPORT_TYPES } from "@/constants/adminConstants";
import { getThemeClass, getInputThemeClass, getCardThemeClass } from "@/utils/themeHelper";
import { showToast } from "@/store/toast/slice";
import dayjs from "dayjs";

// 안전한 날짜 포맷팅 함수
const formatDate = (timestamp) => {
  if (!timestamp) return "날짜 없음";
  
  try {
    if (typeof timestamp.toDate === 'function') {
      return dayjs(timestamp.toDate()).format("YY.MM.DD HH:mm");
    }
    if (timestamp instanceof Date) {
      return dayjs(timestamp).format("YY.MM.DD HH:mm");
    }
    if (typeof timestamp === 'number') {
      return dayjs(timestamp).format("YY.MM.DD HH:mm");
    }
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
  const dispatch = useDispatch();
  
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const themeClass = getThemeClass(currentTheme);

  // 상태 관리
  const [input, setInput] = useState("");
  const [replyInputs, setReplyInputs] = useState({});
  const [showReplyForms, setShowReplyForms] = useState({});
  const [showReplies, setShowReplies] = useState({});

  // 🚀 React Query로 최적화된 댓글 관리
  const { data: comments = [], isLoading, error } = useNoteComments(noteId);
  const addCommentMutation = useAddComment();
  const addReplyMutation = useAddReply();

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

    try {
      await addCommentMutation.mutateAsync({ noteId, content: input.trim() });
      setInput("");
      
      dispatch(showToast({
        type: 'success',
        message: '댓글이 등록되었습니다.'
      }));
    } catch (error) {
      errorHandlers.comment(error);
      dispatch(showToast({
        type: 'error',
        message: '댓글 등록에 실패했습니다.'
      }));
    }
  }, [input, noteId, addCommentMutation, dispatch]);

  // 대댓글 제출 핸들러
  const handleReplySubmit = useCallback(async (commentId) => {
    const replyContent = replyInputs[commentId];
    
    if (!replyContent?.trim()) {
      return;
    }

    try {
      await addReplyMutation.mutateAsync({ 
        noteId, 
        commentId, 
        content: replyContent.trim() 
      });
      
      setReplyInputs(prev => ({ ...prev, [commentId]: "" }));
      setShowReplyForms(prev => ({ ...prev, [commentId]: false }));
      setShowReplies(prev => ({ ...prev, [commentId]: true }));
      
      dispatch(showToast({
        type: 'success',
        message: '답글이 등록되었습니다.'
      }));
    } catch (error) {
      errorHandlers.comment(error);
      dispatch(showToast({
        type: 'error',
        message: '답글 등록에 실패했습니다.'
      }));
    }
  }, [replyInputs, noteId, addReplyMutation, dispatch]);

  // Enter키 처리
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

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

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={`p-6 text-center ${themeClass}`}>
        <div className="animate-pulse">
          <div className={`h-4 ${currentTheme?.cardBg || 'bg-gray-200'} rounded mb-2`}></div>
          <div className={`h-4 ${currentTheme?.cardBg || 'bg-gray-200'} rounded w-3/4 mx-auto`}></div>
        </div>
        <p className={`mt-4 ${currentTheme?.textColor || 'text-gray-600'}`}>
          댓글을 불러오는 중...
        </p>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={`p-6 text-center ${themeClass}`}>
        <p className={`${currentTheme?.textColor || 'text-red-600'}`}>
          댓글을 불러오는 중 오류가 발생했습니다: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className={`mt-8 ${themeClass}`}>
      <h3 className={`text-xl font-semibold mb-4 ${currentTheme?.textColor || 'text-gray-900'}`}>
        댓글 ({comments.length})
      </h3>

      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex flex-col space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="댓글을 작성해주세요..."
            className={`w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputThemeClass(currentTheme)}`}
            rows={3}
          />
          <div className="flex justify-end">
            <ThemedButton
              type="submit"
              disabled={!input.trim() || addCommentMutation.isLoading}
              className="px-4 py-2"
            >
              {addCommentMutation.isLoading ? '등록 중...' : '댓글 등록'}
            </ThemedButton>
          </div>
        </div>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className={`text-center py-8 ${currentTheme?.textColor || 'text-gray-500'}`}>
            <p>첫 번째 댓글을 작성해보세요!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={`p-4 rounded-lg ${getCardThemeClass(currentTheme)}`}>
              {/* 댓글 헤더 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                    {comment.author || comment.userName || "익명"}
                  </span>
                  <span className={`text-sm ${currentTheme?.textSecondary || 'text-gray-500'}`}>
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <ReportButton
                    contentType={REPORT_TYPES.COMMENT}
                    contentId={comment.id}
                    contentTitle={`댓글: ${comment.content?.substring(0, 20)}...`}
                    size="sm"
                    variant="ghost"
                  />
                </div>
              </div>

              {/* 댓글 내용 */}
              <p className={`mb-3 ${currentTheme?.textColor || 'text-gray-800'}`}>
                {comment.content}
              </p>

              {/* 댓글 액션 버튼들 */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleReplyButtonClick(comment.id)}
                  className={`text-sm ${currentTheme?.textSecondary || 'text-blue-600'} hover:underline`}
                >
                  답글
                </button>
                
                {comment.replies && comment.replies.length > 0 && (
                  <button
                    onClick={() => handleToggleReplies(comment.id)}
                    className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'} hover:underline`}
                  >
                    {showReplies[comment.id] ? '답글 숨기기' : `답글 ${comment.replies.length}개 보기`}
                  </button>
                )}
              </div>

              {/* 답글 작성 폼 */}
              {showReplyForms[comment.id] && (
                <div className="mt-3 ml-4 pl-4 border-l-2 border-gray-200">
                  <div className="flex flex-col space-y-2">
                    <textarea
                      value={replyInputs[comment.id] || ""}
                      onChange={(e) => handleReplyInputChange(comment.id, e.target.value)}
                      onKeyDown={(e) => handleReplyKeyDown(e, comment.id)}
                      placeholder="답글을 작성해주세요..."
                      className={`w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputThemeClass(currentTheme)}`}
                      rows={2}
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowReplyForms(prev => ({ ...prev, [comment.id]: false }))}
                        className={`px-3 py-1 text-sm ${currentTheme?.textSecondary || 'text-gray-600'} hover:underline`}
                      >
                        취소
                      </button>
                      <ThemedButton
                        onClick={() => handleReplySubmit(comment.id)}
                        disabled={!replyInputs[comment.id]?.trim() || addReplyMutation.isLoading}
                        size="sm"
                      >
                        {addReplyMutation.isLoading ? '등록 중...' : '답글 등록'}
                      </ThemedButton>
                    </div>
                  </div>
                </div>
              )}

              {/* 대댓글 목록 */}
              {showReplies[comment.id] && comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 ml-4 pl-4 border-l-2 border-gray-200 space-y-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className={`p-3 rounded ${getCardThemeClass(currentTheme)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium text-sm ${currentTheme?.textColor || 'text-gray-900'}`}>
                            {reply.author || reply.userName || "익명"}
                          </span>
                          <span className={`text-xs ${currentTheme?.textSecondary || 'text-gray-500'}`}>
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        <ReportButton
                          contentType={REPORT_TYPES.COMMENT}
                          contentId={reply.id}
                          contentTitle={`답글: ${reply.content?.substring(0, 20)}...`}
                          size="xs"
                          variant="ghost"
                        />
                      </div>
                      <p className={`text-sm ${currentTheme?.textColor || 'text-gray-800'}`}>
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
