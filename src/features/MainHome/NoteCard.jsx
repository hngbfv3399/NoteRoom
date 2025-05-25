import React, { memo, useState } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { truncateTitle } from "@/utils/textUtils";
import { AiFillLike, AiFillEye } from "react-icons/ai";
import { FaCommentAlt } from "react-icons/fa";

const formatDate = (createdAt) => {
  if (!createdAt) return "";

  try {
    if (typeof createdAt.toDate === "function") {
      return dayjs(createdAt.toDate()).format("YY.MM.DD HH:mm");
    }
    return dayjs(createdAt).format("YY.MM.DD HH:mm");
  } catch (error) {
    console.error("Date formatting error:", error);
    return "날짜 없음";
  }
};

const NoteCard = memo(function NoteCard({ note, onClick }) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      className="relative h-[40vh] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* 이미지 영역 */}
      <div className="relative h-1/2 w-full bg-gray-100">
        {note.image && !imageError ? (
          <img
            src={note.image}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
            alt={note.title}
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80" />
      </div>

      {/* 텍스트 정보 */}
      <div className="p-3 h-1/2 flex flex-col justify-between">
        {/* 제목 */}
        <h3 className="text-base font-bold leading-snug line-clamp-2">
          {truncateTitle(note.title) || "제목 없음"}
        </h3>

        {/* 작성자, 날짜 */}
        <div className="flex justify-between text-xs mt-2">
          <span>{note.author || "닉네임 없음"}</span>
          <span>{formatDate(note.createdAt)}</span>
        </div>

        {/* 통계 */}
        <div className="flex justify-between items-center text-xs mt-3">
          <span className="flex items-center gap-1">
            <AiFillLike />
            {note.likes || 0}
          </span>
          <span className="flex items-center gap-1">
            <FaCommentAlt />
            {note.commentCount || 0}
          </span>
          <span className="flex items-center gap-1">
            <AiFillEye />
            {note.views || 0}
          </span>
        </div>
      </div>
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
    category: PropTypes.string.isRequired,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default NoteCard;
