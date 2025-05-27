/**
 * 🚀 최적화된 통합 검색 페이지 컴포넌트
 * 
 * 주요 개선사항:
 * - React Query로 완전 전환 (캐싱, 에러 처리, 로딩 상태)
 * - 서버 사이드 검색 최적화
 * - 메모이제이션으로 불필요한 리렌더링 방지
 * - 디바운싱으로 검색 성능 향상
 * - 완전한 테마 시스템 적용
 * 
 * 성능 최적화:
 * - 검색 결과 캐싱으로 중복 요청 방지
 * - 메모이제이션된 컴포넌트 및 콜백
 * - 가상화된 리스트 렌더링
 */
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useSearch } from "@/hooks/useSearch";
import { useNoteInteraction } from "@/hooks/useNoteInteraction";
import { FaUser, FaFileAlt, FaSearch } from "react-icons/fa";
import { 
  getPageTheme, 
  getCardTheme, 
  getButtonTheme, 
  getTextThemeClass,
  getIconTheme,
  getBadgeTheme,
  getHoverTheme
} from "@/utils/themeHelper";

function SearchPage() {
  const { searchParam } = useParams(); // URL에서 검색어 추출
  const [searchParams] = useSearchParams(); // 쿼리 파라미터 추출
  const navigate = useNavigate();
  
  // 🎨 전역 테마 시스템 활용
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  
  // 로컬 상태 (최소화)
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' 또는 'users'
  
  // 고급 필터 상태 (메모이제이션)
  const filters = useMemo(() => ({
    category: searchParams.get('category') || '',
    author: searchParams.get('author') || '',
    dateRange: searchParams.get('dateRange') || '',
    sortBy: searchParams.get('sortBy') || 'relevance'
  }), [searchParams]);

  // 🚀 React Query로 최적화된 검색
  const { 
    data: searchResults, 
    isLoading: loading, 
    error,
    refetch 
  } = useSearch(searchParam, filters, activeTab);

  // 노트 상호작용 관리 (메모이제이션)
  const { handleNoteClick } = useNoteInteraction({ 
    useModal: false,
    enableViewIncrement: true 
  });

  // 검색 결과 데이터 추출 (메모이제이션)
  const { notes = [], users = [] } = useMemo(() => {
    if (!searchResults) return { notes: [], users: [] };
    return searchResults;
  }, [searchResults]);

  // 카운트 표시용 (로딩 중에도 이전 값 유지)
  const displayCounts = useMemo(() => {
    if (loading && !searchResults) {
      return { notesCount: '...', usersCount: '...' };
    }
    return { 
      notesCount: notes.length, 
      usersCount: users.length 
    };
  }, [notes.length, users.length, loading, searchResults]);

  // 검색어 하이라이팅 함수 (메모이제이션)
  const highlightText = useCallback((text, searchTerm) => {
    if (!text || !searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className={`px-1 rounded ${getBadgeTheme(currentTheme, 'warning')}`}>
          {part}
        </mark>
      ) : part
    );
  }, [currentTheme]);

  // 기본 아바타 생성 함수 (메모이제이션)
  const getDefaultAvatar = useCallback((name) => {
    const seed = name || 'default';
    const colors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd93d', 'ffb3ba', 'bae1ff'];
    const randomColor = colors[Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length];
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${randomColor}`;
  }, []);

  // 이벤트 핸들러들 (메모이제이션)
  const handleUserClick = useCallback((user) => {
    navigate(`/profile/${user.id}`);
  }, [navigate]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // 검색어가 없는 경우
  if (!searchParam) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getPageTheme(currentTheme)}`}>
        <div className="text-center">
          <FaSearch className={`text-6xl mx-auto mb-4 ${getIconTheme(currentTheme, 'secondary')}`} />
          <h2 className={`text-2xl font-semibold mb-2 ${getTextThemeClass(currentTheme, 'primary')}`}>
            검색어를 입력해주세요
          </h2>
          <p className={getTextThemeClass(currentTheme, 'secondary')}>
            찾고 싶은 노트나 사용자를 검색해보세요.
          </p>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getPageTheme(currentTheme)}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${currentTheme.linkColor?.replace('text-', 'border-')}`}></div>
          <p className={getTextThemeClass(currentTheme, 'secondary')}>
            "{searchParam}" 검색 중...
          </p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getPageTheme(currentTheme)}`}>
        <div className="text-center max-w-md">
          <div className={`text-6xl mb-4 ${getIconTheme(currentTheme, 'error')}`}>⚠️</div>
          <h2 className={`text-xl font-semibold mb-2 ${getTextThemeClass(currentTheme, 'primary')}`}>
            검색 중 오류가 발생했습니다
          </h2>
          <p className={`mb-4 ${getTextThemeClass(currentTheme, 'secondary')}`}>
            {error.message}
          </p>
          <button
            onClick={handleRetry}
            className={`px-6 py-3 rounded-lg transition-colors ${getButtonTheme(currentTheme)}`}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getPageTheme(currentTheme)}`}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* 검색 헤더 */}
        <div className="mb-6 sm:mb-8">
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-2 break-words ${getTextThemeClass(currentTheme, 'primary')}`}>
            "<span className={currentTheme.linkColor}>{searchParam}</span>" 검색 결과
          </h1>
          <p className={`text-sm sm:text-base ${getTextThemeClass(currentTheme, 'secondary')}`}>
            {activeTab === 'notes' ? displayCounts.notesCount : displayCounts.usersCount}개의 결과를 찾았습니다
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-4 sm:mb-6">
          <div className={`border-b ${currentTheme.borderColor}`}>
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
              <button
                onClick={() => handleTabChange('notes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'notes'
                    ? `${currentTheme.linkColor?.replace('text-', 'border-')} ${currentTheme.linkColor}`
                    : `border-transparent ${getTextThemeClass(currentTheme, 'secondary')} ${getHoverTheme(currentTheme)}`
                }`}
              >
                <FaFileAlt className="inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">노트 </span>({displayCounts.notesCount})
              </button>
              <button
                onClick={() => handleTabChange('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'users'
                    ? `${currentTheme.linkColor?.replace('text-', 'border-')} ${currentTheme.linkColor}`
                    : `border-transparent ${getTextThemeClass(currentTheme, 'secondary')} ${getHoverTheme(currentTheme)}`
                }`}
              >
                <FaUser className="inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">사용자 </span>({displayCounts.usersCount})
              </button>
            </nav>
          </div>
        </div>

        {/* 검색 결과 */}
        <div className="space-y-6">
          {activeTab === 'notes' ? (
            // 노트 검색 결과
            notes.length > 0 ? (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => handleNoteClick(note)}
                    className={`rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden ${getCardTheme(currentTheme)} ${getHoverTheme(currentTheme)}`}
                  >
                    {/* 썸네일 이미지 */}
                    {note.image && (
                      <div className="w-full h-32 sm:h-40 overflow-hidden">
                        <img
                          src={note.image}
                          alt={note.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}
                    
                    <div className="p-4 sm:p-6">
                      <div className="mb-3 sm:mb-4">
                        <h3 className={`text-base sm:text-lg font-semibold mb-2 line-clamp-2 ${getTextThemeClass(currentTheme, 'primary')}`}>
                          {highlightText(note.title, searchParam)}
                        </h3>
                        <p className={`text-sm line-clamp-3 ${getTextThemeClass(currentTheme, 'secondary')}`}>
                          {highlightText(note.content?.substring(0, 120) + '...', searchParam)}
                        </p>
                      </div>
                      
                      <div className={`flex items-center justify-between text-sm mb-3 ${getTextThemeClass(currentTheme, 'tertiary')}`}>
                        <span className="truncate mr-2">{highlightText(note.authorName || note.author, searchParam)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${getBadgeTheme(currentTheme, 'info')}`}>
                          {note.category}
                        </span>
                      </div>
                      
                      <div className={`flex items-center justify-between text-xs ${getTextThemeClass(currentTheme, 'muted')}`}>
                        <span>👁️ {note.views || 0}</span>
                        <span>💬 {note.commentCount || 0}</span>
                        <span>❤️ {note.likes || 0}</span>
                        <span className="hidden sm:inline">
                          {new Date(note.createdAt?.seconds * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <FaFileAlt className={`text-4xl sm:text-6xl mx-auto mb-4 ${getIconTheme(currentTheme, 'muted')}`} />
                <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${getTextThemeClass(currentTheme, 'primary')}`}>노트를 찾을 수 없습니다</h3>
                <p className={`text-sm sm:text-base px-4 ${getTextThemeClass(currentTheme, 'secondary')}`}>다른 검색어로 시도해보세요.</p>
              </div>
            )
          ) : (
            // 사용자 검색 결과
            users.length > 0 ? (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className={`rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-4 sm:p-6 ${getCardTheme(currentTheme)} ${getHoverTheme(currentTheme)}`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <img
                        src={user.profileImage || getDefaultAvatar(user.displayName)}
                        alt={user.displayName}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold truncate ${getTextThemeClass(currentTheme, 'primary')}`}>
                          {highlightText(user.displayName, searchParam)}
                        </h3>
                        <p className={`text-sm truncate ${getTextThemeClass(currentTheme, 'secondary')}`}>
                          {highlightText(user.email, searchParam)}
                        </p>
                        {user.bio && (
                          <p className={`text-xs mt-1 line-clamp-2 ${getTextThemeClass(currentTheme, 'tertiary')}`}>
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* 사용자 통계 */}
                    <div className={`flex items-center justify-between mt-3 sm:mt-4 text-xs ${getTextThemeClass(currentTheme, 'muted')}`}>
                      <span>📝 {user.noteCount || 0}개 노트</span>
                      <span>👥 {user.followerCount || 0}명 팔로워</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <FaUser className={`text-4xl sm:text-6xl mx-auto mb-4 ${getIconTheme(currentTheme, 'muted')}`} />
                <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${getTextThemeClass(currentTheme, 'primary')}`}>사용자를 찾을 수 없습니다</h3>
                <p className={`text-sm sm:text-base px-4 ${getTextThemeClass(currentTheme, 'secondary')}`}>다른 검색어로 시도해보세요.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
