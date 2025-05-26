/**
 * 노트 카드 컴포넌트 (리팩토링됨)
 * 
 * 주요 기능:
 * - 노트 정보를 카드 형태로 표시
 * - 이미지, 제목, 메타데이터, 통계 정보 포함
 * - 호버 효과 및 클릭 이벤트 처리
 * 
 * NOTE: 컴포넌트 분리로 가독성과 재사용성 향상
 * TODO: 카테고리 태그 표시, 북마크 기능 추가
 */
import React, { memo } from "react";
import PropTypes from "prop-types";
import { formatDate } from "@/utils/dateUtils";
import { truncateTitle } from "@/utils/textUtils";

// 분리된 컴포넌트들 import
import NoteCardImage from "./components/NoteCardImage";
import NoteCardStats from "./components/NoteCardStats";

const NoteCard = memo(function NoteCard({ note, onClick }) {
  return (
    <div
      className="relative h-[40vh] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`노트: ${note.title}`}
    >
      {/* 이미지 영역 */}
      <NoteCardImage 
        src={note.image} 
        alt={note.title || "노트 이미지"} 
      />

      {/* 텍스트 정보 영역 */}
      <div className="p-3 h-1/2 flex flex-col justify-between">
        {/* 제목 */}
        <h3 className="text-base font-bold leading-snug line-clamp-2">
          {truncateTitle(note.title) || "제목 없음"}
        </h3>

        {/* 작성자 및 날짜 */}
        <div className="flex justify-between text-xs mt-2 text-gray-600">
          <span className="font-medium">
            {note.author || "닉네임 없음"}
          </span>
          <time dateTime={note.createdAt?.toDate?.()?.toISOString()}>
            {formatDate(note.createdAt)}
          </time>
        </div>

        {/* 통계 정보 */}
        <NoteCardStats
          likes={note.likes}
          commentCount={note.commentCount}
          views={note.views}
        />
      </div>

      {/* 카테고리 태그 (선택사항) */}
      {note.category && (
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-full">
            {note.category}
          </span>
        </div>
      )}
    </div>
  );
});

NoteCard.propTypes = {
  note: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    image: PropTypes.string,
    author: PropTypes.string,
    createdAt: PropTypes.object,
    likes: PropTypes.number,
    commentCount: PropTypes.number,
    views: PropTypes.number,
    userUid: PropTypes.string.isRequired,
    category: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default NoteCard;
