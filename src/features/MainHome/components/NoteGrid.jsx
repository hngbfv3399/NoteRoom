/**
 * 노트 목록을 그리드 형태로 표시하는 컴포넌트
 * 
 * 기능:
 * - 반응형 그리드 레이아웃
 * - 노트 카드 렌더링
 * - React.memo로 성능 최적화
 * 
 * NOTE: React.memo로 성능 최적화
 * PERFORMANCE: 불필요한 리렌더링 방지
 */
import React, { memo } from 'react';
import PropTypes from 'prop-types';
import NoteCard from '../NoteCard';

const NoteGrid = memo(function NoteGrid({ notes, onNoteClick, className = "" }) {
  if (!notes || notes.length === 0) {
    return null;
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl ${className}`}>
      {notes.map((note) => (
        <NoteCard 
          key={note.id} 
          note={note} 
          onClick={() => onNoteClick(note)} 
        />
      ))}
    </div>
  );
});

NoteGrid.propTypes = {
  notes: PropTypes.arrayOf(PropTypes.object).isRequired,
  onNoteClick: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default NoteGrid; 