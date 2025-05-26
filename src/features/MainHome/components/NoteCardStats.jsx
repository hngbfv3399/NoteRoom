/**
 * 노트 카드의 통계 정보 컴포넌트
 * 
 * 기능:
 * - 좋아요, 댓글, 조회수 표시
 * - 아이콘과 함께 시각적 표현
 * - 숫자 포맷팅 (1000+ 등)
 * 
 * TODO: 숫자 포맷팅 개선 (1.2k, 1.5M 등), 애니메이션 효과 추가
 */
import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { AiFillLike, AiFillEye } from 'react-icons/ai';
import { FaCommentAlt } from 'react-icons/fa';

/**
 * 숫자를 간단한 형태로 포맷팅
 * @param {number} num - 포맷팅할 숫자
 * @returns {string} 포맷된 문자열
 */
const formatNumber = (num) => {
  if (!num || num === 0) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

const NoteCardStats = memo(function NoteCardStats({ 
  likes = 0, 
  commentCount = 0, 
  views = 0,
  className = "flex justify-between items-center text-xs mt-3"
}) {
  const stats = [
    {
      icon: AiFillLike,
      value: likes,
      color: "text-red-500",
      label: "좋아요"
    },
    {
      icon: FaCommentAlt,
      value: commentCount,
      color: "text-blue-500",
      label: "댓글"
    },
    {
      icon: AiFillEye,
      value: views,
      color: "text-gray-500",
      label: "조회수"
    }
  ];

  return (
    <div className={className}>
      {stats.map(({ icon: IconComponent, value, color, label }) => (
        <span 
          key={label}
          className={`flex items-center gap-1 ${color} hover:opacity-80 transition-opacity`}
          title={`${label}: ${value}`}
        >
          <IconComponent className="w-3 h-3" />
          <span className="font-medium">{formatNumber(value)}</span>
        </span>
      ))}
    </div>
  );
});

NoteCardStats.propTypes = {
  likes: PropTypes.number,
  commentCount: PropTypes.number,
  views: PropTypes.number,
  className: PropTypes.string,
};

export default NoteCardStats; 