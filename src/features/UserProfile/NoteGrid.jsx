/**
 * 노트 그리드 컴포넌트
 * 
 * 주요 기능:
 * - 사용자 노트 목록을 그리드 형태로 표시
 * - 테마 시스템 적용
 * - 반응형 디자인 (모바일/태블릿/데스크톱)
 * - 애니메이션 효과
 * - 빈 상태 처리 개선
 * 
 * NOTE: 노트 클릭 시 상세 모달 표시
 * TODO: 무한 스크롤, 필터링, 정렬 기능 추가
 */

import React from "react";
import { useSelector } from "react-redux";
import PropTypes from 'prop-types';
import LoginComponents from "@/components/LoginComponents";
import { getThemeClass } from "@/utils/themeHelper";
import { ROUTES } from '@/constants/routes';

function NoteGrid({ notes, onNoteClick, onNoteEdit, onNoteDelete, isOwnProfile }) {
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const themeClass = currentTheme ? getThemeClass(currentTheme) : "";

  // 로그인하지 않은 경우
  if (!notes) return <LoginComponents />;

  // 노트 클릭 핸들러
  const handleNoteClick = (note) => {
    onNoteClick(note);
  };

  // 노트 삭제 확인 핸들러
  const handleDeleteNote = (note, e) => {
    e.stopPropagation();
    
    if (window.confirm(`"${note.title}" 노트를 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      onNoteDelete(note);
    }
  };

  // 빈 상태 컴포넌트
  const EmptyState = () => (
    <div 
      className={`text-center py-16 px-6 ${themeClass}`}
    >
      <div
        className="max-w-md mx-auto"
      >
        {/* 빈 상태 아이콘 */}
        <div className="mb-6">
          <svg 
            className={`w-24 h-24 mx-auto opacity-50 ${currentTheme?.textColor || 'text-gray-400'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>
        
        {/* 빈 상태 메시지 */}
        <h3 className={`text-xl font-semibold mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
          아직 작성한 노트가 없어요
        </h3>
        <p className={`text-base mb-6 leading-relaxed opacity-70 ${currentTheme?.textColor || 'text-gray-600'}`}>
          첫 번째 노트를 작성해서<br />
          소중한 생각들을 기록해보세요!
        </p>
        
        {/* 작성 유도 버튼 */}
        <button
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} ${currentTheme?.buttonHover || 'hover:shadow-lg'}`}
          onClick={() => window.location.href = ROUTES.WRITE}
          aria-label="새 노트 작성하기"
        >
          ✨ 첫 노트 작성하기
        </button>
      </div>
    </div>
  );

  // 노트가 없는 경우 빈 상태 표시
  if (notes.length === 0) {
    return <EmptyState />;
  }

  // 날짜 포맷팅 함수
  const formatDate = (date) => {
    try {
      const noteDate = new Date(date || date?.toDate?.() || date);
      return noteDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '날짜 없음';
    }
  };

  // HTML 태그 제거 함수 - 보안 강화
  const stripHtml = (html) => {
    if (!html) return "";
    
    // DOMParser를 사용하여 안전하게 HTML 파싱
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      return doc.body.textContent || doc.body.innerText || "";
    } catch (error) {
      // DOMParser 실패 시 정규식으로 기본적인 태그 제거
      console.warn("DOMParser 실패, 정규식 사용:", error);
      return html.replace(/<[^>]*>/g, '').trim();
    }
  };

  return (
    <div className={`px-4 sm:px-6 max-w-7xl mx-auto ${themeClass}`}>
      {/* 사용법 안내 (본인 프로필이고 노트가 있는 경우) */}
      {isOwnProfile && notes.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-700 flex items-center">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>노트 우측 상단의 수정(파란색) 및 삭제(빨간색) 버튼을 클릭하여 관리할 수 있습니다</span>
          </p>
        </div>
      )}

      {/* 노트 그리드 */}
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
      >
        {notes.map((note) => (
          <div
            key={note.id}
            className={`group relative cursor-pointer rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${currentTheme?.modalBgColor || 'bg-white'} border border-gray-200`}
            role="button"
            tabIndex={0}
            aria-label={`노트 "${note.title}" 상세보기`}
          >
            {/* 본인 노트인 경우 수정/삭제 버튼 */}
            {isOwnProfile && (onNoteEdit || onNoteDelete) && (
              <div className="absolute top-2 right-2 z-10 flex space-x-1 transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 scale-100 sm:scale-95 sm:group-hover:scale-100">
                {/* 수정 버튼 */}
                {onNoteEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNoteEdit(note);
                    }}
                    className="p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-md text-xs sm:text-sm"
                    title="노트 수정"
                    aria-label="노트 수정"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                
                {/* 삭제 버튼 */}
                {onNoteDelete && (
                  <button
                    onClick={(e) => handleDeleteNote(note, e)}
                    className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-colors shadow-md text-xs sm:text-sm"
                    title="노트 삭제"
                    aria-label="노트 삭제"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* 노트 카드 내용 */}
            <div 
              className="p-4 sm:p-5 h-48 flex flex-col"
              onClick={() => handleNoteClick(note)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleNoteClick(note);
                }
              }}
            >
              {/* 노트 제목 */}
              <h3 className={`font-bold text-lg mb-3 line-clamp-2 transition-colors ${currentTheme?.textColor || 'text-gray-900'}`}>
                {note.title || '제목 없음'}
              </h3>
              
              {/* 노트 내용 미리보기 */}
              <div className="flex-1 mb-4">
                <p className={`text-sm leading-relaxed line-clamp-4 opacity-70 ${currentTheme?.textColor || 'text-gray-600'}`}>
                  {stripHtml(note.content) || '내용 없음'}
                </p>
              </div>
              
              {/* 노트 메타 정보 */}
              <div className="flex items-center justify-between text-xs">
                <time 
                  className={`font-medium opacity-60 ${currentTheme?.textColor || 'text-gray-500'}`}
                  dateTime={note.date || note.createdAt}
                >
                  {formatDate(note.date || note.createdAt)}
                </time>
                
                {/* 카테고리 표시 (있는 경우) */}
                {note.category && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentTheme?.buttonBg || 'bg-blue-100'} ${currentTheme?.buttonText || 'text-blue-800'}`}>
                    {note.category}
                  </span>
                )}
              </div>
            </div>

            {/* 호버 효과 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* 더 보기 버튼 (향후 무한 스크롤 대신 사용 가능) */}
      {notes.length >= 10 && (
        <div 
          className="text-center mt-12"
        >
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-gray-100'} ${currentTheme?.buttonText || 'text-gray-700'} ${currentTheme?.buttonHover || 'hover:shadow-md'}`}
            aria-label="더 많은 노트 보기"
          >
            더 보기
          </button>
        </div>
      )}
    </div>
  );
}

NoteGrid.propTypes = {
  notes: PropTypes.array,
  onNoteClick: PropTypes.func.isRequired,
  onNoteEdit: PropTypes.func,
  onNoteDelete: PropTypes.func,
  isOwnProfile: PropTypes.bool,
};

export default NoteGrid;

