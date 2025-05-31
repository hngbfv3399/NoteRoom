/**
 * 🚀 최적화된 노트 상세 보기 페이지 컴포넌트
 * 
 * 주요 개선사항:
 * - React Query로 완전 전환 (캐싱, 에러 처리, 로딩 상태)
 * - 메모이제이션으로 불필요한 리렌더링 방지
 * - 좋아요 기능 최적화 (낙관적 업데이트)
 * - 메타 태그 자동 업데이트 (소셜 미디어 공유)
 * 
 * 성능 최적화:
 * - 노트 데이터 캐싱으로 중복 요청 방지
 * - 메모이제이션된 컴포넌트 및 콜백
 * - 좋아요 상태 실시간 동기화
 */
import React, { useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FaHeart, FaArrowLeft, FaShare } from "react-icons/fa";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import { auth } from "@/services/firebase";
import { useNoteDetail, useNoteLike } from "@/hooks/useNoteDetail";
import CommentSection from "@/components/CommentSection";
import ReportButton from "@/components/common/ReportButton";
import { REPORT_TYPES } from "@/constants/adminConstants";
import { getThemeClass } from "@/utils/themeHelper";
import LoadingPage from "@/components/LoadingPage";
import { sanitizeHtml, extractTextFromHtml } from "@/utils/sanitizeHtml";
import { selectCurrentTheme } from "@/store/selectors";
import { showToast } from "@/store/toast/slice";

// dayjs 플러그인 설정
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale('ko');

function MemoDetail({ note: propNote }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // 테마 상태 (메모이제이션)
  const currentTheme = useSelector(selectCurrentTheme);
  const themeClass = useMemo(() => 
    currentTheme ? getThemeClass(currentTheme) : "", 
    [currentTheme]
  );

  // 🚀 React Query로 최적화된 데이터 로딩
  const { 
    data: note, 
    isLoading: loading, 
    error,
    refetch 
  } = useNoteDetail(propNote ? null : id);

  // 🚀 React Query로 최적화된 좋아요 기능
  const { 
    liked: userLiked, 
    likeCount: likes, 
    toggleLike, 
    isLoading: likeLoading 
  } = useNoteLike(id);
  
  const currentUser = auth.currentUser;

  // prop으로 받은 노트가 있으면 사용 (모달에서 사용하는 경우)
  const displayNote = propNote || note;

  // 날짜 포맷팅 함수 (메모이제이션)
  const formatDate = useCallback((dateValue) => {
    if (!dateValue) return "날짜 없음";
    
    try {
      let date;
      
      if (dateValue && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        date = new Date(dateValue);
      }
      
      if (!dayjs(date).isValid()) return "날짜 오류";
      
      const dayjsDate = dayjs(date).tz("Asia/Seoul");
      const now = dayjs().tz("Asia/Seoul");
      const diffInHours = now.diff(dayjsDate, 'hour');
      
      if (diffInHours < 24) {
        return dayjsDate.fromNow();
      } else {
        return dayjsDate.format("YYYY년 MM월 DD일 HH:mm");
      }
    } catch (error) {
      console.error("날짜 포맷팅 실패:", error);
      return "날짜 오류";
    }
  }, []);

  // 메타 태그 업데이트 (메모이제이션)
  const updateMetaTags = useCallback((noteData) => {
    document.title = `${noteData.title || '제목 없음'} - NoteRoom`;
    
    const existingMetas = document.querySelectorAll('meta[data-dynamic="true"]');
    existingMetas.forEach(meta => meta.remove());

    const metaTags = [
      { property: 'og:title', content: noteData.title || '제목 없음' },
      { property: 'og:description', content: extractTextFromHtml(noteData.content) || 'NoteRoom에서 공유된 노트입니다.' },
      { property: 'og:url', content: window.location.href },
      { property: 'og:type', content: 'article' },
      { property: 'og:site_name', content: 'NoteRoom' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: noteData.title || '제목 없음' },
      { name: 'twitter:description', content: extractTextFromHtml(noteData.content) || 'NoteRoom에서 공유된 노트입니다.' },
      { name: 'description', content: extractTextFromHtml(noteData.content) || 'NoteRoom에서 공유된 노트입니다.' },
    ];

    if (noteData.image) {
      metaTags.push(
        { property: 'og:image', content: noteData.image },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:image', content: noteData.image }
      );
    }

    metaTags.forEach(({ property, name, content }) => {
      const meta = document.createElement('meta');
      if (property) meta.setAttribute('property', property);
      if (name) meta.setAttribute('name', name);
      meta.setAttribute('content', content);
      meta.setAttribute('data-dynamic', 'true');
      document.head.appendChild(meta);
    });
  }, []);

  // 좋아요 토글 핸들러 (메모이제이션)
  const handleToggleLike = useCallback(() => {
    if (!currentUser) {
      dispatch(showToast({
        type: 'warning',
        message: '로그인이 필요합니다.'
      }));
      return;
    }
    
    toggleLike();
    
    dispatch(showToast({
      type: userLiked ? 'info' : 'success',
      message: userLiked ? '좋아요를 취소했습니다.' : '좋아요를 눌렀습니다!'
    }));
  }, [currentUser, toggleLike, userLiked, dispatch]);

  // 공유 기능 (메모이제이션)
  const handleShare = useCallback(async () => {
    if (!displayNote) return;
    
    const shareUrl = window.location.href;
    const shareText = `${displayNote.title} - NoteRoom에서 확인하세요!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: displayNote.title,
          text: shareText,
          url: shareUrl,
        });
        dispatch(showToast({
          type: 'success',
          message: '노트가 성공적으로 공유되었습니다!'
        }));
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("공유 실패:", error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        dispatch(showToast({
          type: 'success',
          message: '링크가 클립보드에 복사되었습니다!'
        }));
      } catch (error) {
        console.error('클립보드 복사 실패:', error);
        dispatch(showToast({
          type: 'error',
          message: '링크 복사에 실패했습니다.'
        }));
      }
    }
  }, [displayNote, dispatch]);

  // 노트 데이터가 로드되면 메타 태그 업데이트
  useEffect(() => {
    if (displayNote) {
      updateMetaTags(displayNote);
    }
  }, [displayNote, updateMetaTags]);

  // 컴포넌트 언마운트 시 메타 태그 정리
  useEffect(() => {
    return () => {
      const dynamicMetas = document.querySelectorAll('meta[data-dynamic="true"]');
      dynamicMetas.forEach(meta => meta.remove());
      document.title = 'NoteRoom - 감정과 생각을 기록하고 공유하는 소셜 노트 플랫폼';
    };
  }, []);

  // 로딩 상태
  if (loading) {
    return <LoadingPage />;
  }

  // 에러 상태
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${themeClass}`}>
        <div className="text-center max-w-md">
          <div className="mb-6">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833-.23 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className={`text-2xl font-bold mb-4 ${currentTheme?.textColor || 'text-red-600'}`}>
            오류가 발생했습니다
          </h1>
          <p className={`mb-6 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
            {error.message || '노트를 불러오는 중 오류가 발생했습니다.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => refetch()}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:bg-blue-600`}
            >
              다시 시도
            </button>
            <button
              onClick={() => navigate(-1)}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${currentTheme?.hoverBg || 'bg-gray-100'} ${currentTheme?.textColor || 'text-gray-600'} hover:bg-gray-200`}
            >
              뒤로가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 노트가 없는 경우
  if (!displayNote) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${themeClass}`}>
        <div className="text-center max-w-md">
          <div className="mb-6">
            <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <h1 className={`text-2xl font-bold mb-4 ${currentTheme?.textColor || 'text-gray-800'}`}>
            노트를 찾을 수 없습니다
          </h1>
          <p className={`mb-6 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
            요청하신 노트가 삭제되었거나 존재하지 않습니다.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:bg-blue-600`}
            >
              홈으로 가기
            </button>
            <button
              onClick={() => navigate(-1)}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${currentTheme?.hoverBg || 'bg-gray-100'} ${currentTheme?.textColor || 'text-gray-600'} hover:bg-gray-200`}
            >
              뒤로가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto p-4 text-left ${themeClass}`}>
      {/* 상단 네비게이션 바 */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${currentTheme?.buttonBg || 'bg-gray-100'} ${currentTheme?.buttonText || 'text-gray-600'} hover:bg-gray-200`}
        >
          <FaArrowLeft className="mr-2" />
          뒤로가기
        </button>
        
        <div className="flex items-center space-x-3">
          <ReportButton
            contentType={REPORT_TYPES.NOTE}
            contentId={displayNote.id}
            contentTitle={displayNote.title}
            size="sm"
            variant="outline"
          />
          
          <button
            onClick={handleShare}
            className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:bg-blue-600`}
          >
            <FaShare className="mr-2" />
            공유하기
          </button>
        </div>
      </div>

      {/* 노트 제목 */}
      <h1 className={`text-3xl font-semibold mb-4 ${currentTheme?.textColor || 'text-gray-900'}`}>
        {displayNote.title || "제목 없음"}
      </h1>

      {/* 노트 메타 정보 */}
      <div className={`flex items-center justify-between mb-6 pb-4 border-b ${currentTheme?.textSecondary || 'text-gray-600'}`}>
        <div className="flex items-center space-x-4">
          <span>작성자: {displayNote.author || "익명"}</span>
          <span>카테고리: {displayNote.category || "없음"}</span>
          <span>{formatDate(displayNote.createdAt)}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <span>조회 {displayNote.views || 0}</span>
          <button
            onClick={handleToggleLike}
            disabled={likeLoading}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-all duration-200 ${
              userLiked 
                ? 'bg-red-100 text-red-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaHeart className={userLiked ? 'text-red-500' : 'text-gray-400'} />
            <span>{likes}</span>
          </button>
        </div>
      </div>

      {/* 노트 이미지 */}
      {displayNote.image && (
        <div className="mb-6">
          <img
            src={displayNote.image}
            alt={displayNote.title}
            className="w-full max-h-96 object-cover rounded-lg shadow-md"
            loading="lazy"
          />
        </div>
      )}

      {/* 노트 내용 */}
      <div 
        className={`prose max-w-none mb-8 ${currentTheme?.textColor || 'text-gray-900'}`}
        dangerouslySetInnerHTML={{ 
          __html: sanitizeHtml(displayNote.content || "내용이 없습니다.", {
            ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
            FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'iframe'],
            FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover']
          }) 
        }}
      />

      {/* 댓글 섹션 */}
      <CommentSection noteId={displayNote.id} />
    </div>
  );
}

export default MemoDetail;
