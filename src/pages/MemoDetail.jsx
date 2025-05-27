/**
 * 노트 상세 보기 페이지 컴포넌트
 * 
 * 주요 기능:
 * - URL 파라미터로 노트 ID를 받아서 Firebase에서 노트 데이터 로드
 * - 노트 제목, 내용, 이미지 표시
 * - 작성자 정보 및 작성 시간 표시
 * - 좋아요 기능 (토글)
 * - 댓글 섹션 포함
 * - 조회수, 댓글 수 통계 표시
 * - 공유 기능 (URL 복사, 소셜 미디어)
 * - 뒤로가기 네비게이션
 * 
 * NOTE: 좋아요 상태는 서브컬렉션으로 관리
 * TODO: 북마크 기능, 신고 기능 추가
 * IMPROVED: 날짜 처리 로직 개선, 에러 처리 강화, 토스트 알림 추가
 */
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FaHeart, FaArrowLeft, FaShare } from "react-icons/fa";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  increment,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/services/firebase";
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

// 한국어 로케일 설정
dayjs.locale('ko');

function MemoDetail({ note: propNote }) {
  const { id } = useParams(); // URL에서 노트 ID 가져오기
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // 메모이제이션된 selector 사용
  const currentTheme = useSelector(selectCurrentTheme);
  const themeClass = currentTheme ? getThemeClass(currentTheme) : "";

  // 노트 데이터 상태 (prop으로 받거나 Firebase에서 로드)
  const [note, setNote] = useState(propNote || null);
  const [loading, setLoading] = useState(!propNote);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // 좋아요 관련 상태
  const [likes, setLikes] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  
  // 작성자 정보 상태
  const [authorName, setAuthorName] = useState("익명");
  
  const currentUser = auth.currentUser;
  const MAX_RETRY_COUNT = 3;

  // 개선된 날짜 포맷팅 함수
  const formatDate = useCallback((dateValue) => {
    if (!dateValue) {
      console.warn("날짜 값이 없습니다:", dateValue);
      return "날짜 없음";
    }
    
    try {
      let date;
      
      // Firebase Timestamp 객체인 경우
      if (dateValue && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
      }
      // Date 객체인 경우
      else if (dateValue instanceof Date) {
        date = dateValue;
      }
      // 문자열이나 숫자인 경우
      else {
        date = new Date(dateValue);
      }
      
      // 유효한 날짜인지 확인
      if (!dayjs(date).isValid()) {
        console.error("유효하지 않은 날짜:", dateValue, date);
        return "날짜 오류";
      }
      
      const dayjsDate = dayjs(date).tz("Asia/Seoul");
      const now = dayjs().tz("Asia/Seoul");
      const diffInHours = now.diff(dayjsDate, 'hour');
      
      // 24시간 이내면 상대 시간으로 표시
      if (diffInHours < 24) {
        return dayjsDate.fromNow();
      }
      // 그 외에는 절대 시간으로 표시
      else {
        return dayjsDate.format("YYYY년 MM월 DD일 HH:mm");
      }
    } catch (error) {
      console.error("날짜 포맷팅 실패:", error, "원본 값:", dateValue);
      return "날짜 오류";
    }
  }, []);

  // 에러 처리 개선된 노트 로드 함수
  const fetchNote = useCallback(async (isRetry = false) => {
    if (!id) return;
    
    setLoading(true);
    if (!isRetry) {
      setError(null);
      setRetryCount(0);
    }
    
    try {
      console.log("=== MemoDetail 노트 로드 시작 ===");
      console.log("노트 ID:", id, "재시도:", isRetry, "재시도 횟수:", retryCount);
      
      const noteDoc = await getDoc(doc(db, "notes", id));
      
      if (noteDoc.exists()) {
        const noteData = { id: noteDoc.id, ...noteDoc.data() };
        
        console.log("=== MemoDetail 로드된 노트 데이터 ===");
        console.log("noteData:", noteData);
        
        // 데이터 유효성 검사
        if (!noteData.title && !noteData.content) {
          throw new Error("노트 데이터가 손상되었습니다.");
        }
        
        setNote(noteData);
        setLikes(noteData.likes || 0);
        setError(null);
        setRetryCount(0);
        
        // 메타 태그 업데이트 (소셜 미디어 공유용)
        updateMetaTags(noteData);
        
        dispatch(showToast({
          type: 'success',
          message: '노트를 성공적으로 불러왔습니다.'
        }));
      } else {
        console.log("노트를 찾을 수 없음");
        setError("노트를 찾을 수 없습니다.");
        dispatch(showToast({
          type: 'error',
          message: '노트를 찾을 수 없습니다.'
        }));
      }
    } catch (err) {
      console.error("노트 로드 실패:", err);
      const errorMessage = err.code === 'permission-denied' 
        ? '노트에 접근할 권한이 없습니다.'
        : err.code === 'unavailable'
        ? '네트워크 연결을 확인해주세요.'
        : '노트를 불러오는 중 오류가 발생했습니다.';
      
      setError(errorMessage);
      
      // 자동 재시도 로직 (네트워크 오류인 경우)
      if (err.code === 'unavailable' && retryCount < MAX_RETRY_COUNT) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchNote(true);
        }, 2000 * (retryCount + 1)); // 지수 백오프
      } else {
        dispatch(showToast({
          type: 'error',
          message: errorMessage
        }));
      }
    } finally {
      setLoading(false);
      console.log("=== MemoDetail 노트 로드 완료 ===");
    }
  }, [id, retryCount, dispatch]);

  // URL 파라미터로 접근한 경우 노트 데이터 로드
  useEffect(() => {
    if (!propNote && id) {
      fetchNote();
    } else if (propNote) {
      console.log("=== MemoDetail prop으로 받은 노트 ===");
      console.log("propNote:", propNote);
      
      setLikes(propNote.likes || 0);
      // prop으로 받은 경우에도 메타 태그 업데이트
      updateMetaTags(propNote);
    }
  }, [id, propNote, fetchNote]);

     // 작성자 이름 가져오기 (에러 처리 개선)
   const fetchAuthorName = useCallback(async () => {
     if (!note?.userUid) return;
     
     try {
       const userDocRef = doc(db, "users", note.userUid);
       const userDoc = await getDoc(userDocRef);
       
       if (userDoc.exists()) {
         const userData = userDoc.data();
         setAuthorName(userData.displayName || note.author || "익명");
       } else {
         console.warn("작성자 정보를 찾을 수 없음:", note.userUid);
         setAuthorName(note.author || "익명");
       }
     } catch (error) {
       console.error("작성자 정보 가져오기 실패:", error);
       setAuthorName(note.author || "익명");
       
       // 권한 오류가 아닌 경우에만 토스트 표시
       if (error.code !== 'permission-denied') {
         dispatch(showToast({
           type: 'warning',
           message: '작성자 정보를 불러올 수 없습니다.'
         }));
       }
     }
   }, [note, dispatch]);

  useEffect(() => {
    if (note) {
      fetchAuthorName();
    }
  }, [note, fetchAuthorName]);

  // 현재 사용자의 좋아요 상태 확인 (에러 처리 개선)
  const checkUserLiked = useCallback(async () => {
    if (!currentUser || !note) {
      setUserLiked(false);
      return;
    }

    try {
      const likeDocRef = doc(db, "notes", note.id, "likesUsers", currentUser.uid);
      const likeDocSnap = await getDoc(likeDocRef);
      setUserLiked(likeDocSnap.exists());
    } catch (error) {
      console.error("좋아요 상태 확인 실패:", error);
      // 좋아요 상태 확인 실패는 사용자에게 알리지 않음 (중요하지 않은 기능)
    }
  }, [currentUser, note]);

  useEffect(() => {
    if (note) {
      checkUserLiked();
    }
  }, [note, currentUser, checkUserLiked]);

  // 좋아요 토글 기능 (에러 처리 및 로딩 상태 개선)
  const toggleLike = async () => {
    if (!currentUser) {
      dispatch(showToast({
        type: 'warning',
        message: '좋아요를 누르려면 로그인이 필요합니다.'
      }));
      return;
    }

    if (!note || likeLoading) return;

    setLikeLoading(true);
    const previousLiked = userLiked;
    const previousLikes = likes;

    try {
      // 낙관적 업데이트
      setUserLiked(!userLiked);
      setLikes(prev => userLiked ? prev - 1 : prev + 1);

      const noteRef = doc(db, "notes", note.id);
      const likeDocRef = doc(db, "notes", note.id, "likesUsers", currentUser.uid);

      if (userLiked) {
        // 좋아요 취소
        await deleteDoc(likeDocRef);
        await updateDoc(noteRef, { likes: increment(-1) });
        
        dispatch(showToast({
          type: 'info',
          message: '좋아요를 취소했습니다.'
        }));
      } else {
        // 좋아요 추가
        await setDoc(likeDocRef, { 
          likedAt: new Date(),
          userId: currentUser.uid 
        });
        await updateDoc(noteRef, { likes: increment(1) });
        
        dispatch(showToast({
          type: 'success',
          message: '좋아요를 눌렀습니다!'
        }));
      }
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
      
      // 롤백
      setUserLiked(previousLiked);
      setLikes(previousLikes);
      
      const errorMessage = error.code === 'permission-denied'
        ? '좋아요 권한이 없습니다.'
        : '좋아요 처리 중 오류가 발생했습니다.';
      
      dispatch(showToast({
        type: 'error',
        message: errorMessage
      }));
    } finally {
      setLikeLoading(false);
    }
  };

  // 공유 기능 (에러 처리 및 토스트 알림 개선)
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `${note.title} - NoteRoom에서 확인하세요!`;

    if (navigator.share) {
      // 네이티브 공유 API 사용 (모바일)
      try {
        const shareData = {
          title: note.title,
          text: shareText,
          url: shareUrl,
        };

        // 이미지가 있는 경우 포함 (지원하는 브라우저에서만)
        if (note.image && navigator.canShare) {
          try {
            // 이미지를 Blob으로 변환하여 공유
            const response = await fetch(note.image);
            const blob = await response.blob();
            const file = new File([blob], 'note-image.jpg', { type: blob.type });
            
            const shareDataWithImage = {
              ...shareData,
              files: [file]
            };

            // 파일 공유가 지원되는지 확인
            if (navigator.canShare(shareDataWithImage)) {
              await navigator.share(shareDataWithImage);
              dispatch(showToast({
                type: 'success',
                message: '노트가 성공적으로 공유되었습니다!'
              }));
              return;
            }
          } catch (imageError) {
            console.log('이미지 공유 실패, 텍스트만 공유:', imageError);
            // 이미지 공유 실패 시 텍스트만 공유
          }
        }

        // 기본 텍스트 공유
        await navigator.share(shareData);
        dispatch(showToast({
          type: 'success',
          message: '노트가 성공적으로 공유되었습니다!'
        }));
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.log("공유 취소됨 또는 실패:", error);
          dispatch(showToast({
            type: 'error',
            message: '공유 중 오류가 발생했습니다.'
          }));
        }
        // AbortError는 사용자가 공유를 취소한 경우이므로 알림 표시하지 않음
      }
    } else {
      // URL 복사 (데스크톱)
      try {
        await navigator.clipboard.writeText(shareUrl);
        dispatch(showToast({
          type: 'success',
          message: '링크가 클립보드에 복사되었습니다!'
        }));
      } catch (error) {
        console.error('클립보드 복사 실패:', error);
        try {
          // 폴백: 텍스트 선택
          const textArea = document.createElement("textarea");
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          dispatch(showToast({
            type: 'success',
            message: '링크가 복사되었습니다!'
          }));
        } catch (fallbackError) {
          console.error('폴백 복사도 실패:', fallbackError);
          dispatch(showToast({
            type: 'error',
            message: '링크 복사에 실패했습니다.'
          }));
        }
      }
    }
  };

  // 메타 태그 업데이트 함수 (소셜 미디어 공유용)
  const updateMetaTags = (noteData) => {
    // 기본 메타 태그들
    document.title = `${noteData.title || '제목 없음'} - NoteRoom`;
    
    // 기존 메타 태그 제거
    const existingMetas = document.querySelectorAll('meta[data-dynamic="true"]');
    existingMetas.forEach(meta => meta.remove());

    // 새로운 메타 태그 추가
    const metaTags = [
      // Open Graph (Facebook, LinkedIn 등)
      { property: 'og:title', content: noteData.title || '제목 없음' },
      { property: 'og:description', content: extractTextFromHtml(noteData.content) || 'NoteRoom에서 공유된 노트입니다.' },
      { property: 'og:url', content: window.location.href },
      { property: 'og:type', content: 'article' },
      { property: 'og:site_name', content: 'NoteRoom' },
      
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: noteData.title || '제목 없음' },
      { name: 'twitter:description', content: extractTextFromHtml(noteData.content) || 'NoteRoom에서 공유된 노트입니다.' },
      
      // 일반 메타 태그
      { name: 'description', content: extractTextFromHtml(noteData.content) || 'NoteRoom에서 공유된 노트입니다.' },
    ];

    // 이미지가 있는 경우 추가
    if (noteData.image) {
      metaTags.push(
        { property: 'og:image', content: noteData.image },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:image', content: noteData.image }
      );
    }

    // 메타 태그들을 head에 추가
    metaTags.forEach(({ property, name, content }) => {
      const meta = document.createElement('meta');
      if (property) meta.setAttribute('property', property);
      if (name) meta.setAttribute('name', name);
      meta.setAttribute('content', content);
      meta.setAttribute('data-dynamic', 'true'); // 나중에 제거하기 위한 마커
      document.head.appendChild(meta);
    });
  };

  // 컴포넌트 언마운트 시 메타 태그 정리
  useEffect(() => {
    return () => {
      // 동적으로 추가된 메타 태그들 제거
      const dynamicMetas = document.querySelectorAll('meta[data-dynamic="true"]');
      dynamicMetas.forEach(meta => meta.remove());
      
      // 기본 타이틀로 복원
      document.title = 'NoteRoom - 감정과 생각을 기록하고 공유하는 소셜 노트 플랫폼';
    };
  }, []);

  // 로딩 상태
  if (loading) {
    return <LoadingPage />;
  }

  // 에러 상태 (개선된 UI 및 재시도 기능)
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${themeClass}`}>
        <div className="text-center max-w-md">
          {/* 에러 아이콘 */}
          <div className="mb-6">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833-.23 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className={`text-2xl font-bold mb-4 ${currentTheme?.textColor || 'text-red-600'}`}>
            오류가 발생했습니다
          </h1>
          <p className={`mb-6 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
            {error}
          </p>
          
          {/* 재시도 횟수 표시 */}
          {retryCount > 0 && (
            <p className={`text-sm mb-4 ${currentTheme?.textSecondary || 'text-gray-500'}`}>
              재시도 중... ({retryCount}/{MAX_RETRY_COUNT})
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* 재시도 버튼 */}
            <button
              onClick={() => fetchNote()}
              disabled={loading}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                loading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : `${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} ${currentTheme?.buttonHover || 'hover:bg-blue-600'}`
              }`}
            >
              {loading ? '재시도 중...' : '다시 시도'}
            </button>
            
            {/* 뒤로가기 버튼 */}
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

  // 노트가 없는 경우 (개선된 UI)
  if (!note) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${themeClass}`}>
        <div className="text-center max-w-md">
          {/* 404 아이콘 */}
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
            {/* 홈으로 가기 버튼 */}
            <button
              onClick={() => navigate('/')}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} ${currentTheme?.buttonHover || 'hover:bg-blue-600'}`}
            >
              홈으로 가기
            </button>
            
            {/* 뒤로가기 버튼 */}
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
          className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${currentTheme?.buttonBg || 'bg-gray-100'} ${currentTheme?.buttonText || 'text-gray-600'} ${currentTheme?.buttonHover || 'hover:bg-gray-200'}`}
          aria-label="뒤로가기"
        >
          <FaArrowLeft className="mr-2" />
          뒤로가기
        </button>
        
        <div className="flex items-center space-x-3">
          {/* 신고 버튼 */}
          <ReportButton
            contentType={REPORT_TYPES.NOTE}
            contentId={note.id}
            contentTitle={note.title}
            size="sm"
            variant="outline"
          />
          
          <button
            onClick={handleShare}
            className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} ${currentTheme?.buttonHover || 'hover:bg-blue-600'}`}
            aria-label="공유하기"
          >
            <FaShare className="mr-2" />
            공유하기
          </button>
        </div>
      </div>

      {/* 노트 제목 */}
      <h1 
        className={`text-3xl font-semibold mb-4 ${themeClass}`} 
        id="note-title"
      >
        {note.title || "제목 없음"}
      </h1>

      {/* 메타데이터 (작성자, 날짜) */}
      <div 
        className={`text-sm mb-6 opacity-70 ${themeClass}`}
      >
        <span>작성자: {authorName}</span>
        <span className="mx-2">|</span>
        <time dateTime={note.date || note.createdAt}>
          {formatDate(note.date || note.createdAt)}
        </time>
        {note.category && (
          <>
            <span className="mx-2">|</span>
            <span>카테고리: {note.category}</span>
          </>
        )}
      </div>

      {/* 노트 이미지 */}
      {note.image && (
        <div className="mb-6">
          <img
            src={note.image}
            alt={note.title || "노트 이미지"}
            className="w-full h-80 object-cover rounded"
            loading="lazy"
          />
        </div>
      )}

      {/* 노트 내용 */}
      {(() => {
        console.log("=== MemoDetail 렌더링 시점 ===");
        console.log("note.content:", note.content);
        console.log("note.content 타입:", typeof note.content);
        console.log("note.content 길이:", note.content?.length);
        
        const sanitizedContent = sanitizeHtml(note.content) || "내용이 없습니다.";
        console.log("sanitized content:", sanitizedContent);
        console.log("sanitized content 길이:", sanitizedContent.length);
        
        return null; // 이 함수는 렌더링용이 아니라 로그용
      })()}
      <div
        className={`ProseMirror prose max-w-none mb-8 ${themeClass}`}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content) || "내용이 없습니다." }}
      />

      {/* 상호작용 버튼 및 통계 */}
      <div className={`mt-8 text-sm flex justify-between items-center border-t pt-4 ${themeClass}`}>
        {/* 좋아요 버튼 */}
        <button
          className={`flex items-center cursor-pointer transition-all duration-200 px-3 py-2 rounded-lg ${themeClass}`}
          onClick={toggleLike}
          aria-label={userLiked ? "좋아요 취소" : "좋아요"}
        >
          <FaHeart
            size={20}
            color={userLiked ? "#ef4444" : (themeClass.includes('white') ? "#9ca3af" : "#6b7280")}
            className="mr-2 transition-colors"
          />
          <span className="select-none font-medium">{likes}</span>
        </button>

        {/* 댓글 수 */}
        <span 
          className={`opacity-70 ${themeClass}`}
        >
          댓글: {note.commentCount || 0}
        </span>

        {/* 조회수 */}
        <span 
          className={`opacity-70 ${themeClass}`}
        >
          조회수: {note.views || 0}
        </span>
      </div>

      {/* 댓글 섹션 */}
      <CommentSection noteId={note.id} />
    </div>
  );
}

export default MemoDetail;
