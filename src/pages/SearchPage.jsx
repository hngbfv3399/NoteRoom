/**
 * 통합 검색 페이지 컴포넌트
 * 
 * 주요 기능:
 * - URL 파라미터로 받은 검색어로 노트 및 사용자 검색
 * - 쿼리 파라미터로 고급 필터 지원 (카테고리, 작성자, 기간, 정렬)
 * - 탭으로 노트/사용자 검색 결과 분리
 * - 노트: 제목, 작성자, 카테고리, 내용에서 검색
 * - 사용자: 이름, 이메일에서 검색
 * - 검색 결과 하이라이팅
 * - 노트 클릭 시 독립 페이지로 이동 (공유 가능)
 * - 사용자 클릭 시 프로필 페이지로 이동
 * 
 * NOTE: 페이지 이동 방식으로 변경하여 공유 기능 지원
 * TODO: 서버사이드 검색 구현, 페이지네이션
 * FIXME: 대량 데이터 시 성능 문제
 */
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useNoteInteraction } from "@/hooks/useNoteInteraction";
import { FaUser, FaFileAlt, FaSearch, FaFilter, FaSort } from "react-icons/fa";

function SearchPage() {
  const { searchParam } = useParams(); // URL에서 검색어 추출
  const [searchParams] = useSearchParams(); // 쿼리 파라미터 추출
  const navigate = useNavigate();
  
  // 검색 결과 상태
  const [notes, setNotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' 또는 'users'
  
  // 고급 필터 상태
  const [filters] = useState({
    category: searchParams.get('category') || '',
    author: searchParams.get('author') || '',
    dateRange: searchParams.get('dateRange') || '',
    sortBy: searchParams.get('sortBy') || 'relevance'
  });
  
  // 노트 상호작용 관리 (클릭 → 페이지 이동으로 공유 가능)
  const { handleNoteClick } = useNoteInteraction({ 
    useModal: false,  // 페이지 이동 사용 (공유 가능한 URL)
    enableViewIncrement: true 
  });

  // 검색어 하이라이팅 함수
  const highlightText = (text, searchTerm) => {
    if (!text || !searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // 날짜 필터링 함수
  const filterByDateRange = (createdAt, dateRange) => {
    if (!dateRange || !createdAt) return true;
    
    const noteDate = new Date(createdAt.seconds * 1000);
    const now = new Date();
    
    switch (dateRange) {
      case 'today': {
        return noteDate.toDateString() === now.toDateString();
      }
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return noteDate >= weekAgo;
      }
      case 'month': {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return noteDate >= monthAgo;
      }
      case 'year': {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return noteDate >= yearAgo;
      }
      default:
        return true;
    }
  };

  // 정렬 함수
  const sortResults = (results, sortBy) => {
    switch (sortBy) {
      case 'newest': {
        return results.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
      }
      case 'oldest': {
        return results.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return aTime - bTime;
        });
      }
      case 'popular': {
        return results.sort((a, b) => {
          const aViews = a.views || 0;
          const bViews = b.views || 0;
          return bViews - aViews;
        });
      }
      case 'relevance':
      default: {
        // 관련도순: 제목에 검색어가 포함된 것을 우선
        return results.sort((a, b) => {
          const aTitle = (a.title || '').toLowerCase();
          const bTitle = (b.title || '').toLowerCase();
          const searchLower = searchParam.toLowerCase();
          
          const aInTitle = aTitle.includes(searchLower) ? 1 : 0;
          const bInTitle = bTitle.includes(searchLower) ? 1 : 0;
          
          if (aInTitle !== bInTitle) {
            return bInTitle - aInTitle;
          }
          
          // 제목 길이가 짧을수록 관련도가 높다고 가정
          return aTitle.length - bTitle.length;
        });
      }
    }
  };

  // 기본 아바타 생성 함수 (DiceBear API 사용)
  const getDefaultAvatar = (name) => {
    const seed = name || 'default';
    const colors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd93d', 'ffb3ba', 'bae1ff'];
    const randomColor = colors[Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length];
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${randomColor}`;
  };

  // 통합 검색 로직
  useEffect(() => {
    async function fetchSearchResults() {
      setLoading(true);
      try {
        const lowerSearch = searchParam.toLowerCase();

        // 노트 검색
        const notesRef = collection(db, "notes");
        const notesSnapshot = await getDocs(notesRef);
        let filteredNotes = notesSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((note) => {
            // 기본 검색 조건
            const matchesSearch = (
              (note.title || "").toLowerCase().includes(lowerSearch) ||
              (note.authorName || "").toLowerCase().includes(lowerSearch) ||
              (note.category || "").toLowerCase().includes(lowerSearch) ||
              (note.content || "").toLowerCase().includes(lowerSearch)
            );
            
            if (!matchesSearch) return false;
            
            // 고급 필터 적용
            if (filters.category && note.category !== filters.category) {
              return false;
            }
            
            if (filters.author && !(note.authorName || "").toLowerCase().includes(filters.author.toLowerCase())) {
              return false;
            }
            
            if (filters.dateRange && !filterByDateRange(note.createdAt, filters.dateRange)) {
              return false;
            }
            
            return true;
          });

        // 정렬 적용
        filteredNotes = sortResults(filteredNotes, filters.sortBy);

        // 사용자 검색
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        const filteredUsers = usersSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((user) => {
            return (
              (user.displayName || "").toLowerCase().includes(lowerSearch) ||
              (user.email || "").toLowerCase().includes(lowerSearch)
            );
          });

        setNotes(filteredNotes);
        setUsers(filteredUsers);
      } catch (error) {
        console.error("검색 중 오류 발생:", error);
        // TODO: 사용자에게 에러 메시지 표시
      } finally {
        setLoading(false);
      }
    }

    if (searchParam) {
      fetchSearchResults();
    }
  }, [searchParam, filters]);

  // 사용자 프로필로 이동
  const handleUserClick = (user) => {
    navigate(`/profile/${user.id}`);
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 relative">
      {/* 검색 결과 헤더 */}
      <div className="mb-8">
        <h2 className="text-3xl mb-4 flex items-center gap-3">
          <FaSearch className="text-blue-500" />
          검색 결과: "{searchParam}"
        </h2>
        
        {/* 활성 필터 표시 */}
        {(filters.category || filters.author || filters.dateRange || filters.sortBy !== 'relevance') && (
          <div className="mb-4 flex flex-wrap gap-2">
            {filters.category && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1">
                <FaFilter className="w-3 h-3" />
                카테고리: {filters.category}
              </span>
            )}
            {filters.author && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-1">
                <FaUser className="w-3 h-3" />
                작성자: {filters.author}
              </span>
            )}
            {filters.dateRange && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                기간: {
                  filters.dateRange === 'today' ? '오늘' :
                  filters.dateRange === 'week' ? '이번 주' :
                  filters.dateRange === 'month' ? '이번 달' :
                  filters.dateRange === 'year' ? '올해' : filters.dateRange
                }
              </span>
            )}
            {filters.sortBy !== 'relevance' && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm flex items-center gap-1">
                <FaSort className="w-3 h-3" />
                정렬: {
                  filters.sortBy === 'newest' ? '최신순' :
                  filters.sortBy === 'oldest' ? '오래된순' :
                  filters.sortBy === 'popular' ? '인기순' : '관련도순'
                }
              </span>
            )}
          </div>
        )}
        
        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => handleTabChange('notes')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors duration-200 ${
              activeTab === 'notes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaFileAlt className="inline mr-2" />
            노트 ({loading ? '...' : notes.length})
          </button>
          <button
            onClick={() => handleTabChange('users')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors duration-200 ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaUser className="inline mr-2" />
            사용자 ({loading ? '...' : users.length})
          </button>
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">검색 중...</p>
        </div>
      )}

      {/* 노트 검색 결과 */}
      {!loading && activeTab === 'notes' && (
        <div>
          {notes.length === 0 ? (
            <div className="text-center py-16">
              <FaFileAlt className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">검색어에 맞는 노트가 없습니다.</p>
              <p className="text-sm text-gray-400">
                다른 검색어를 시도하거나 필터를 조정해보세요.
              </p>
            </div>
          ) : (
            notes.map((note) => {
              // HTML 태그 제거 후 미리보기 텍스트 생성 (100자로 확장)
              const preview =
                (note.content || "").replace(/<[^>]+>/g, "").slice(0, 100) +
                ((note.content || "").length > 100 ? "..." : "");

              return (
                <div
                  key={note.id}
                  className="mb-6 p-5 rounded-2xl border border-gray-300 hover:border-gray-500 transition-colors duration-300 cursor-pointer flex gap-5 items-start hover:shadow-md"
                  onClick={() => handleNoteClick(note)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNoteClick(note);
                    }
                  }}
                  aria-label={`노트: ${note.title}`}
                >
                  {/* 노트 이미지 또는 플레이스홀더 */}
                  {note.image ? (
                    <img
                      src={note.image}
                      alt={note.title}
                      className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-32 h-20 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400 text-sm">
                      <FaFileAlt className="text-2xl" />
                    </div>
                  )}

                  {/* 노트 정보 */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {highlightText(note.title || "제목 없음", searchParam)}
                    </h3>
                    
                    {/* 메타데이터 */}
                    <div className="flex justify-between text-sm mb-3 text-gray-600">
                      <span>
                        작성자: {highlightText(note.author || note.authorName || "익명", searchParam)}
                      </span>
                      <span>
                        카테고리: {highlightText(note.category || "없음", searchParam)}
                      </span>
                    </div>
                    
                    {/* 내용 미리보기 */}
                    <p className="leading-relaxed text-gray-700">
                      {highlightText(preview, searchParam)}
                    </p>
                    
                    {/* 추가 메타데이터 */}
                    <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                      <span>조회수: {note.views || 0}</span>
                      {note.createdAt && (
                        <span>
                          {new Date(note.createdAt.seconds * 1000).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 사용자 검색 결과 */}
      {!loading && activeTab === 'users' && (
        <div>
          {users.length === 0 ? (
            <div className="text-center py-16">
              <FaUser className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">검색어에 맞는 사용자가 없습니다.</p>
              <p className="text-sm text-gray-400">
                다른 검색어를 시도해보세요.
              </p>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="mb-4 p-5 rounded-2xl border border-gray-300 hover:border-gray-500 transition-colors duration-300 cursor-pointer flex gap-4 items-center hover:shadow-md"
                onClick={() => handleUserClick(user)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleUserClick(user);
                  }
                }}
                aria-label={`사용자: ${user.displayName}`}
              >
                {/* 프로필 이미지 또는 기본 아바타 */}
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200">
                  <img
                    src={user.profileImage || getDefaultAvatar(user.displayName)}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      // 이미지 로드 실패 시 기본 아바타로 대체
                      e.target.src = getDefaultAvatar(user.displayName);
                    }}
                  />
                </div>

                {/* 사용자 정보 */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">
                    {highlightText(user.displayName || "이름 없음", searchParam)}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {highlightText(user.email || "이메일 없음", searchParam)}
                  </p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>노트: {user.noteCount || 0}개</span>
                    {user.favoriteQuote && (
                      <span className="truncate max-w-xs">
                        "{user.favoriteQuote}"
                      </span>
                    )}
                  </div>
                </div>

                {/* 프로필 보기 화살표 */}
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default SearchPage;
