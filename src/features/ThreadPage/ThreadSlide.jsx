import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IoArrowBack, IoHeart, IoHeartOutline, IoChatbubbleOutline, IoShareOutline, IoEyeOutline } from 'react-icons/io5';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiErrorCircle, BiImage } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, setDoc, deleteDoc, increment, updateDoc } from 'firebase/firestore';
import { auth, db, retryFirebaseOperation } from '@/services/firebase';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';

dayjs.locale('ko');

function ThreadSlide({ item }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [likes, setLikes] = useState(item?.likes || 0);
  const [userLiked, setUserLiked] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  
  const navigate = useNavigate();
  const slideRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const currentUser = auth.currentUser;

  // 작성자 프로필 정보 가져오기
  useEffect(() => {
    const fetchAuthorProfile = async () => {
      if (item?.userUid) {
        try {
          const userDocRef = doc(db, "users", item.userUid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setAuthorProfile(userDoc.data());
          }
        } catch (error) {
          console.error("작성자 프로필 가져오기 실패:", error);
        }
      }
    };
    fetchAuthorProfile();
  }, [item?.userUid]);

  // 현재 사용자의 좋아요 상태 확인
  useEffect(() => {
    const checkUserLiked = async () => {
      if (!currentUser || !item?.id) return;

      try {
        const likeDocRef = doc(db, "notes", item.id, "likesUsers", currentUser.uid);
        const likeDocSnap = await getDoc(likeDocRef);
        setUserLiked(likeDocSnap.exists());
      } catch (error) {
        console.error("좋아요 상태 확인 실패:", error);
      }
    };
    checkUserLiked();
  }, [item?.id, currentUser]);

  // 스와이프 제스처 처리
  useEffect(() => {
    const slide = slideRef.current;
    if (!slide) return;

    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      // 수평 스와이프가 수직 스와이프보다 클 때만 처리
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          // 오른쪽 스와이프 - 상세 페이지로 이동
          navigate(`/note/${item.id}`);
        }
      }
    };

    slide.addEventListener('touchstart', handleTouchStart, { passive: true });
    slide.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      slide.removeEventListener('touchstart', handleTouchStart);
      slide.removeEventListener('touchend', handleTouchEnd);
    };
  }, [item?.id, navigate]);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // 좋아요 토글
  const toggleLike = async () => {
    if (!currentUser || !item?.id || isLiking) return;

    setIsLiking(true);
    
    // 낙관적 업데이트를 위한 이전 상태 저장
    const previousLiked = userLiked;
    const previousLikes = likes;
    
    try {
      // 낙관적 업데이트
      setUserLiked(!userLiked);
      setLikes(prev => userLiked ? Math.max(0, prev - 1) : prev + 1);
      
      const operation = async () => {
        const likeDocRef = doc(db, "notes", item.id, "likesUsers", currentUser.uid);
        const noteDocRef = doc(db, "notes", item.id);

        if (userLiked) {
          // 좋아요 취소
          await deleteDoc(likeDocRef);
          await updateDoc(noteDocRef, { likes: increment(-1) });
        } else {
          // 좋아요 추가
          await setDoc(likeDocRef, {
            userId: currentUser.uid,
            createdAt: new Date(),
          });
          await updateDoc(noteDocRef, { likes: increment(1) });
        }
      };
      
      await retryFirebaseOperation(operation);
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
      
      // 에러 발생 시 이전 상태로 롤백
      setUserLiked(previousLiked);
      setLikes(previousLikes);
      
      // 네트워크 에러인지 확인
      if (error.code === 'unavailable' || error.message.includes('network')) {
        alert('네트워크 연결을 확인해주세요.');
      } else {
        alert('좋아요 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsLiking(false);
    }
  };

  // 공유 기능
  const handleShare = async () => {
    const shareData = {
      title: item.title,
      text: `${item.title} - NoteRoom에서 확인하세요!`,
      url: `${window.location.origin}/note/${item.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('링크가 클립보드에 복사되었습니다!');
      }
    } catch (error) {
      console.error('공유 실패:', error);
    }
  };

  // 날짜 포맷팅
  const formatDate = (date) => {
    if (!date) return '날짜 없음';
    const now = dayjs();
    const postDate = dayjs(date);
    const diffHours = now.diff(postDate, 'hour');
    
    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}일 전`;
    return postDate.format('MM월 DD일');
  };

  // HTML 태그 제거 함수 - 보안 강화
  const getTextPreview = (htmlContent, maxLength = 100) => {
    if (!htmlContent) return '';
    
    // DOMParser를 사용하여 안전하게 HTML 파싱
    let text = '';
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      text = doc.body.textContent || doc.body.innerText || '';
    } catch (error) {
      // DOMParser 실패 시 정규식으로 기본적인 태그 제거
      console.warn("DOMParser 실패, 정규식 사용:", error);
      text = htmlContent.replace(/<[^>]*>/g, '').trim();
    }
    
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // 이미지가 없는 경우를 위한 컴포넌트
  const NoImageDisplay = () => (
    <div className={`absolute inset-0 flex flex-col items-center justify-center ${currentTheme?.modalBgColor || 'bg-gray-100'}/90`}>
      <BiImage className={`text-6xl mb-4 ${currentTheme?.textColor || 'text-gray-400'}`} />
      <p className={`text-lg ${currentTheme?.textColor || 'text-gray-500'}`}>이미지가 없는 게시글입니다</p>
      <div className={`mt-4 p-4 rounded-lg max-w-sm ${currentTheme?.inputBg || 'bg-white'}/80`}>
        <p className={`text-sm ${currentTheme?.textColor || 'text-gray-700'}`}>
          {getTextPreview(item.content)}
        </p>
      </div>
    </div>
  );

  // 기본 아바타 생성 함수 (DiceBear API 사용)
  const getDefaultAvatar = (name) => {
    const seed = name || 'default';
    const colors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd93d', 'ffb3ba', 'bae1ff'];
    const randomColor = colors[Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length];
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${randomColor}`;
  };

  return (
    <div 
      ref={slideRef}
      className="relative w-full snap-start flex items-center justify-center overflow-hidden"
      style={{ height: 'calc(100vh - 128px)' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* 이미지 로딩 상태 */}
      {imageLoading && item.image && (
        <div className={`absolute inset-0 flex items-center justify-center ${currentTheme?.modalBgColor || 'bg-gray-100'}`}>
          <AiOutlineLoading3Quarters className={`text-4xl animate-spin ${currentTheme?.textColor || 'text-gray-600'}`} />
        </div>
      )}

      {/* 이미지 에러 상태 */}
      {imageError && item.image && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${currentTheme?.modalBgColor || 'bg-gray-100'}`}>
          <BiErrorCircle className="text-6xl mb-4 text-red-500" />
          <p className={`text-lg ${currentTheme?.textColor || 'text-gray-600'}`}>이미지를 불러올 수 없습니다</p>
        </div>
      )}

      {/* 이미지가 없는 경우 */}
      {!item.image && <NoImageDisplay />}

      {/* 메인 이미지 */}
      {item.image && !imageError && (
        <img
          src={item.image}
          className={`absolute w-full h-full object-cover transition-opacity duration-300
            ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          alt={item.title ? `노트 이미지: ${item.title}` : "노트 이미지"}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}

      {/* 오버레이 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />

      {/* 상단 네비게이션 */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
        {/* 뒤로가기 버튼 */}
        <motion.button
          onClick={() => navigate('/')}
          className="bg-black/30 text-white p-3 rounded-full backdrop-blur-sm hover:bg-black/50 transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="홈으로 이동"
        >
          <IoArrowBack className="text-xl" />
        </motion.button>

        {/* 카테고리 뱃지 */}
        {item.category && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-black/30 text-white px-3 py-1 rounded-full backdrop-blur-sm text-sm font-medium"
          >
            {item.category}
          </motion.div>
        )}
      </div>

      {/* 우측 액션 버튼들 */}
      <AnimatePresence>
        {(showActions || window.innerWidth <= 768) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-4 bottom-32 flex flex-col space-y-4 z-20"
          >
            {/* 좋아요 버튼 */}
            <motion.button
              onClick={toggleLike}
              disabled={isLiking}
              className="thread-action-button bg-black/30 text-white p-3 rounded-full backdrop-blur-sm hover:bg-black/50 transition-all disabled:opacity-50"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={userLiked ? "좋아요 취소" : "좋아요"}
            >
              {userLiked ? (
                <IoHeart className="text-xl text-red-500" />
              ) : (
                <IoHeartOutline className="text-xl" />
              )}
            </motion.button>
            <span className="text-white text-sm text-center font-medium">{likes}</span>

            {/* 댓글 버튼 */}
            <motion.button
              onClick={() => navigate(`/note/${item.id}`)}
              className="thread-action-button bg-black/30 text-white p-3 rounded-full backdrop-blur-sm hover:bg-black/50 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="댓글 보기"
            >
              <IoChatbubbleOutline className="text-xl" />
            </motion.button>
            <span className="text-white text-sm text-center font-medium">{item.commentCount || 0}</span>

            {/* 공유 버튼 */}
            <motion.button
              onClick={handleShare}
              className="thread-action-button bg-black/30 text-white p-3 rounded-full backdrop-blur-sm hover:bg-black/50 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="공유하기"
            >
              <IoShareOutline className="text-xl" />
            </motion.button>

            {/* 조회수 */}
            <div className="flex flex-col items-center">
              <IoEyeOutline className="text-white text-xl mb-1" />
              <span className="text-white text-sm font-medium">{item.views || 0}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 하단 콘텐츠 영역 */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4 z-10">
        {/* 작성자 정보 */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center space-x-3 mb-4"
        >
          {/* 프로필 이미지 */}
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50">
            <img
              src={authorProfile?.profileImage || getDefaultAvatar(authorProfile?.displayName || item.author)}
              alt={`${authorProfile?.displayName || item.author || '익명'} 프로필`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // 이미지 로드 실패 시 기본 아바타로 대체
                e.target.src = getDefaultAvatar(authorProfile?.displayName || item.author);
              }}
            />
          </div>
          
          <div>
            <p className="text-white font-semibold text-sm">
              {authorProfile?.displayName || item.author || "익명"}
            </p>
            <p className="text-white/70 text-xs">
              {formatDate(item.createdAt)}
            </p>
          </div>
        </motion.div>

        {/* 제목 */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="thread-text-shadow text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg leading-tight cursor-pointer"
          onClick={() => navigate(`/note/${item.id}`)}
        >
          {item.title}
        </motion.h1>

        {/* 내용 미리보기 (이미지가 없는 경우에만) */}
        {!item.image && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="thread-text-shadow text-white/90 text-sm leading-relaxed"
          >
            {getTextPreview(item.content, 150)}
          </motion.p>
        )}

        {/* 스와이프 힌트 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center mt-4"
        >
          <div className="thread-swipe-hint text-white/50 text-xs flex items-center space-x-2">
            <span>→</span>
            <span>오른쪽으로 스와이프하여 자세히 보기</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ThreadSlide;
