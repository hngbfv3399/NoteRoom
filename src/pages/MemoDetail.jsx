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
 * FIXME: 날짜 처리 로직 개선, 에러 처리 강화
 */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaHeart, FaArrowLeft, FaShare } from "react-icons/fa";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
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

// dayjs 플러그인 설정
dayjs.extend(utc);
dayjs.extend(timezone);

function MemoDetail({ note: propNote }) {
  const { id } = useParams(); // URL에서 노트 ID 가져오기
  const navigate = useNavigate();
  
  // 메모이제이션된 selector 사용
  const currentTheme = useSelector(selectCurrentTheme);
  const themeClass = currentTheme ? getThemeClass(currentTheme) : "";

  // 노트 데이터 상태 (prop으로 받거나 Firebase에서 로드)
  const [note, setNote] = useState(propNote || null);
  const [loading, setLoading] = useState(!propNote);
  const [error, setError] = useState(null);
  
  // 좋아요 관련 상태
  const [likes, setLikes] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  
  // 작성자 정보 상태
  const [authorName, setAuthorName] = useState("익명");
  
  const currentUser = auth.currentUser;

  // URL 파라미터로 접근한 경우 노트 데이터 로드
  useEffect(() => {
    if (!propNote && id) {
      const fetchNote = async () => {
        setLoading(true);
        try {
          const noteDoc = await getDoc(doc(db, "notes", id));
          if (noteDoc.exists()) {
            const noteData = { id: noteDoc.id, ...noteDoc.data() };
            setNote(noteData);
            setLikes(noteData.likes || 0);
            
            // 메타 태그 업데이트 (소셜 미디어 공유용)
            updateMetaTags(noteData);
          } else {
            setError("노트를 찾을 수 없습니다.");
          }
        } catch (err) {
          console.error("노트 로드 실패:", err);
          setError("노트를 불러오는 중 오류가 발생했습니다.");
        } finally {
          setLoading(false);
        }
      };
      fetchNote();
    } else if (propNote) {
      setLikes(propNote.likes || 0);
      // prop으로 받은 경우에도 메타 태그 업데이트
      updateMetaTags(propNote);
    }
  }, [id, propNote]);

  // 작성자 이름 가져오기
  useEffect(() => {
    const fetchAuthorName = async () => {
      if (note?.userUid) {
        try {
          const userDocRef = doc(db, "users", note.userUid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setAuthorName(userDoc.data().displayName || note.author || "익명");
          }
        } catch (error) {
          console.error("작성자 정보 가져오기 실패:", error);
        }
      }
    };
    if (note) {
      fetchAuthorName();
    }
  }, [note]);

  // 현재 사용자의 좋아요 상태 확인
  const checkUserLiked = async () => {
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
    }
  };

  useEffect(() => {
    if (note) {
      checkUserLiked();
    }
  }, [note, currentUser]);

  // 좋아요 토글 기능
  const toggleLike = async () => {
    if (!currentUser) {
      alert("좋아요를 누르려면 로그인이 필요합니다.");
      return;
    }

    if (!note) return;

    try {
      const noteRef = doc(db, "notes", note.id);
      const likeDocRef = doc(db, "notes", note.id, "likesUsers", currentUser.uid);

      if (userLiked) {
        // 좋아요 취소
        await deleteDoc(likeDocRef);
        await updateDoc(noteRef, { likes: increment(-1) });
        setLikes((prev) => prev - 1);
        setUserLiked(false);
      } else {
        // 좋아요 추가
        await setDoc(likeDocRef, { likedAt: new Date() });
        await updateDoc(noteRef, { likes: increment(1) });
        setLikes((prev) => prev + 1);
        setUserLiked(true);
      }
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  // 공유 기능
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
              return;
            }
          } catch (imageError) {
            console.log('이미지 공유 실패, 텍스트만 공유:', imageError);
            // 이미지 공유 실패 시 텍스트만 공유
          }
        }

        // 기본 텍스트 공유
        await navigator.share(shareData);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.log("공유 취소됨 또는 실패:", error);
        }
      }
    } else {
      // URL 복사 (데스크톱)
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('링크가 클립보드에 복사되었습니다!');
      } catch (error) {
        console.error('클립보드 복사 실패:', error);
        // 폴백: 텍스트 선택
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert('링크가 복사되었습니다!');
      }
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateValue) => {
    if (!dateValue) return "날짜 없음";
    
    try {
      const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
      return dayjs(date).tz("Asia/Seoul").format("YYYY-MM-DD HH:mm");
    } catch (error) {
      console.error("날짜 포맷팅 실패:", error);
      return "날짜 오류";
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

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4 text-red-600">오류 발생</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          뒤로가기
        </button>
      </div>
    );
  }

  // 노트가 없는 경우
  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">노트를 찾을 수 없습니다</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          뒤로가기
        </button>
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


      {/* 노트 내용 */}
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
