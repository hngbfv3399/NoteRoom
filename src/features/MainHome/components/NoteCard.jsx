/**
 * 개별 노트 카드 컴포넌트
 * 
 * 주요 기능:
 * - 노트 정보 표시 (제목, 작성자, 날짜, 카테고리)
 * - 이미지 로딩 및 에러 처리
 * - 통계 정보 표시 (좋아요, 댓글, 조회수)
 * - 노트 클릭 시 상세 페이지로 이동
 * - 공유 기능 (URL 복사)
 * 
 * NOTE: React.memo로 성능 최적화
 * TODO: 북마크 기능, 더보기 메뉴 추가
 */
import React, { memo } from 'react';
import { FaShare, FaEye, FaComment, FaHeart } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { getThemeClass } from '@/utils/themeHelper';
import { formatDate } from '@/utils/dateUtils';
import { useResponsiveButtonWidth } from '@/hooks/useResponsiveButtonWidth';
import NoteCardImage from './NoteCardImage';
import NoteCardStats from './NoteCardStats';
import ReportButton from '@/components/common/ReportButton';
import { REPORT_TYPES } from '@/constants/adminConstants';

const NoteCard = memo(({ note, onNoteClick }) => {
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const themeClass = getThemeClass(currentTheme);
  
  // 반응형 버튼 크기
  const buttonWidth = useResponsiveButtonWidth();

  // 공유 기능
  const handleShare = async (e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    
    const shareUrl = `${window.location.origin}/note/${note.id}`;
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
          console.error('공유 실패:', error);
        }
      }
    } else {
      // URL 복사 (데스크톱)
      try {
        await navigator.clipboard.writeText(shareUrl);
        // TODO: 토스트 메시지로 피드백 제공
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

  return (
    <div
      className={`
        group relative cursor-pointer rounded-xl shadow-md hover:shadow-xl 
        transition-all duration-300 overflow-hidden border border-gray-200
        ${themeClass}
        ${currentTheme?.cardBg || 'bg-white'}
        ${currentTheme?.cardHover || 'hover:shadow-xl'}
      `}
      onClick={() => onNoteClick(note)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNoteClick(note);
        }
      }}
      aria-label={`노트: ${note.title}`}
    >
      {/* 액션 버튼들 */}
      <div className="absolute top-3 right-3 z-10 flex space-x-2">
        {/* 신고 버튼 */}
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-200">
          <ReportButton
            contentType={REPORT_TYPES.NOTE}
            contentId={note.id}
            contentTitle={note.title}
            size="xs"
            variant="ghost"
            className={`
              p-2 rounded-full backdrop-blur-sm
              ${currentTheme?.buttonBg || 'bg-white/90'} 
              ${currentTheme?.buttonText || 'text-gray-600'}
              ${currentTheme?.buttonHover || 'hover:bg-white hover:shadow-md'}
            `}
          />
        </div>
        
        {/* 공유 버튼 */}
        <button
          onClick={handleShare}
          className={`
            p-2 rounded-full
            transition-all duration-200 opacity-0 group-hover:opacity-100
            ${currentTheme?.buttonBg || 'bg-white/90'} 
            ${currentTheme?.buttonText || 'text-gray-600'}
            ${currentTheme?.buttonHover || 'hover:bg-white hover:shadow-md'}
            backdrop-blur-sm
          `}
          aria-label="노트 공유하기"
          title="공유하기"
        >
          <FaShare className="w-4 h-4" />
        </button>
      </div>

      {/* 노트 이미지 */}
      <NoteCardImage 
        image={note.image} 
        title={note.title} 
        category={note.category}
      />

      {/* 노트 정보 */}
      <div className="p-4 space-y-3">
        {/* 제목 */}
        <h3 
          className={`
            text-lg font-semibold line-clamp-2 leading-tight
            ${currentTheme?.textColor || 'text-gray-900'}
          `}
          title={note.title}
        >
          {note.title || "제목 없음"}
        </h3>

        {/* 메타데이터 */}
        <div className={`text-sm space-y-1 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
          <div className="flex items-center justify-between">
            <span className="truncate">
              작성자: {note.author || note.authorName || "익명"}
            </span>
            {note.category && (
              <span className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${currentTheme?.badgeBg || 'bg-blue-100'} 
                ${currentTheme?.badgeText || 'text-blue-800'}
              `}>
                {note.category}
              </span>
            )}
          </div>
          
          <div className="text-xs opacity-75">
            {formatDate(note.date || note.createdAt)}
          </div>
        </div>

        {/* 통계 정보 */}
        <NoteCardStats 
          likes={note.likes || 0}
          comments={note.commentCount || 0}
          views={note.views || 0}
          buttonWidth={buttonWidth}
        />
      </div>
    </div>
  );
});

NoteCard.displayName = 'NoteCard';

NoteCard.propTypes = {
  note: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    author: PropTypes.string,
    authorName: PropTypes.string,
    category: PropTypes.string,
    image: PropTypes.string,
    date: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    createdAt: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    likes: PropTypes.number,
    commentCount: PropTypes.number,
    views: PropTypes.number,
  }).isRequired,
  onNoteClick: PropTypes.func.isRequired,
};

export default NoteCard; 