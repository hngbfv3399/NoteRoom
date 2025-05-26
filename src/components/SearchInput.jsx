import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";
import { FaSearch, FaHistory, FaClock, FaTimes, FaFilter, FaUser } from "react-icons/fa";
import { debounce } from "lodash";

function SearchInput({ className = "" }) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 고급 필터 상태
  const [filters, setFilters] = useState({
    category: "",
    author: "",
    dateRange: "",
    sortBy: "relevance"
  });

  const navigate = useNavigate();
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // 기본 아바타 생성 함수 (DiceBear API 사용)
  const getDefaultAvatar = (name) => {
    const seed = name || 'default';
    const colors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd93d', 'ffb3ba', 'bae1ff'];
    const randomColor = colors[Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length];
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${randomColor}`;
  };

  // 검색 히스토리 로드
  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 실시간 검색 제안 생성 (디바운스 적용)
  const fetchSuggestions = useCallback(
    debounce(async (searchTerm) => {
      if (!searchTerm.trim() || searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const lowerSearch = searchTerm.toLowerCase();
        
        // 노트에서 검색 제안 가져오기
        const notesRef = collection(db, "notes");
        const notesSnapshot = await getDocs(notesRef);
        
        const titleSuggestions = [];
        const categorySuggestions = new Set();
        const authorSuggestions = new Map(); // 작성자 정보를 더 자세히 저장

        notesSnapshot.docs.forEach((doc) => {
          const note = doc.data();
          
          // 제목 제안 (부분 일치)
          if (note.title && note.title.toLowerCase().includes(lowerSearch)) {
            titleSuggestions.push({
              type: "title",
              text: note.title,
              category: note.category,
              author: note.authorName
            });
          }
          
          // 카테고리 제안 (부분 일치)
          if (note.category && note.category.toLowerCase().includes(lowerSearch)) {
            categorySuggestions.add(note.category);
          }
          
          // 작성자 제안 (부분 일치) - 프로필 정보 포함
          if (note.authorName && note.authorName.toLowerCase().includes(lowerSearch)) {
            if (!authorSuggestions.has(note.authorName)) {
              authorSuggestions.set(note.authorName, {
                name: note.authorName,
                uid: note.authorId,
                profileImage: null // 나중에 사용자 컬렉션에서 가져올 예정
              });
            }
          }
        });

        // 사용자 컬렉션에서 작성자 정보 보완
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        usersSnapshot.docs.forEach((doc) => {
          const user = doc.data();
          const userId = doc.id;
          
          // 사용자 이름 제안
          if (user.displayName && user.displayName.toLowerCase().includes(lowerSearch)) {
            if (authorSuggestions.has(user.displayName)) {
              // 기존 작성자 정보 업데이트
              const existing = authorSuggestions.get(user.displayName);
              authorSuggestions.set(user.displayName, {
                ...existing,
                profileImage: user.profileImage
              });
            } else {
              // 새로운 작성자 추가
              authorSuggestions.set(user.displayName, {
                name: user.displayName,
                uid: userId,
                profileImage: user.profileImage
              });
            }
          }
        });

        // 제안 목록 구성 (우선순위: 작성자 > 제목 > 카테고리)
        const allSuggestions = [
          // 작성자 제안을 먼저 표시 (프로필 이미지 포함)
          ...Array.from(authorSuggestions.values()).slice(0, 4).map(author => ({
            type: "author", 
            text: author.name,
            profileImage: author.profileImage,
            uid: author.uid
          })),
          // 제목 제안
          ...titleSuggestions.slice(0, 3),
          // 카테고리 제안
          ...Array.from(categorySuggestions).slice(0, 2).map(cat => ({
            type: "category",
            text: cat
          }))
        ];

        // 중복 제거 및 최대 8개로 제한
        const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) => 
          index === self.findIndex(s => s.text === suggestion.text && s.type === suggestion.type)
        );

        setSuggestions(uniqueSuggestions.slice(0, 8));
        
      } catch (error) {
        console.error("검색 제안 가져오기 실패:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // 입력값 변경 시 제안 업데이트
  useEffect(() => {
    if (inputValue.trim()) {
      fetchSuggestions(inputValue);
    } else {
      setSuggestions([]);
    }
  }, [inputValue, fetchSuggestions]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 검색 실행
  const executeSearch = (searchTerm, customFilters = {}) => {
    if (!searchTerm.trim()) return;

    // 검색 히스토리에 추가
    const newHistory = [
      searchTerm,
      ...searchHistory.filter(item => item !== searchTerm)
    ].slice(0, 10);
    
    setSearchHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));

    // 필터가 있으면 쿼리 파라미터로 전달
    const queryParams = new URLSearchParams();
    if (customFilters.category || filters.category) {
      queryParams.set("category", customFilters.category || filters.category);
    }
    if (customFilters.author || filters.author) {
      queryParams.set("author", customFilters.author || filters.author);
    }
    if (customFilters.dateRange || filters.dateRange) {
      queryParams.set("dateRange", customFilters.dateRange || filters.dateRange);
    }
    if (customFilters.sortBy || filters.sortBy) {
      queryParams.set("sortBy", customFilters.sortBy || filters.sortBy);
    }

    const queryString = queryParams.toString();
    const searchUrl = `/search/${encodeURIComponent(searchTerm)}${queryString ? `?${queryString}` : ''}`;
    
    navigate(searchUrl);
    setInputValue("");
    setShowDropdown(false);
    setShowAdvancedFilter(false);
  };

  // 제안 항목 클릭
  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === "category") {
      executeSearch(suggestion.text, { category: suggestion.text });
    } else if (suggestion.type === "author") {
      executeSearch(suggestion.text, { author: suggestion.text });
    } else {
      executeSearch(suggestion.text);
    }
  };

  // 히스토리 항목 삭제
  const removeHistoryItem = (item, e) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter(h => h !== item);
    setSearchHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  // 히스토리 전체 삭제
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case "category": return "🏷️";
      case "author": return "👤";
      default: return "📝";
    }
  };

  const getSuggestionLabel = (type) => {
    switch (type) {
      case "category": return "카테고리";
      case "author": return "작성자";
      default: return "노트";
    }
  };

  // 작성자 아바타 렌더링 컴포넌트
  const AuthorAvatar = ({ suggestion }) => {
    if (suggestion.type !== "author") return null;

    const avatarSrc = suggestion.profileImage || getDefaultAvatar(suggestion.text);

    return (
      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
        <img
          src={avatarSrc}
          alt={`${suggestion.text} 프로필`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // 이미지 로드 실패 시 기본 아바타로 대체
            e.target.src = getDefaultAvatar(suggestion.text);
          }}
        />
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* 검색 입력창 */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          placeholder="검색어를 입력하세요..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              executeSearch(inputValue);
            } else if (e.key === "Escape") {
              setShowDropdown(false);
            }
          }}
          className={`w-full pl-10 pr-12 py-2 rounded-lg transition-all ${
            currentTheme?.inputBg || 'bg-white'
          } ${
            currentTheme?.inputText || 'text-gray-800'
          } ${
            currentTheme?.inputBorder || 'border border-gray-300'
          } ${
            currentTheme?.inputFocus || 'focus:border-blue-500 focus:ring-blue-300'
          } focus:ring-2`}
        />
        
        {/* 고급 필터 버튼 */}
        <button
          onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
            showAdvancedFilter 
              ? 'text-blue-500 bg-blue-50' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
          title="고급 필터"
        >
          <FaFilter className="w-4 h-4" />
        </button>
      </div>

      {/* 고급 필터 패널 */}
      {showAdvancedFilter && (
        <div 
          className={`absolute top-full left-0 right-0 mt-1 p-4 rounded-lg border shadow-lg z-[100] ${
            currentTheme?.modalBgColor || 'bg-white'
          } ${
            currentTheme?.inputBorder || 'border-gray-200'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${currentTheme?.textColor || 'text-gray-700'}`}>
                카테고리
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className={`w-full px-3 py-2 rounded border ${
                  currentTheme?.inputBg || 'bg-white'
                } ${
                  currentTheme?.inputBorder || 'border-gray-300'
                }`}
              >
                <option value="">전체 카테고리</option>
                <option value="일상">일상</option>
                <option value="기술">기술</option>
                <option value="여행">여행</option>
                <option value="음식">음식</option>
                <option value="영화/드라마">영화/드라마</option>
                <option value="음악">음악</option>
                <option value="독서">독서</option>
                <option value="취미">취미</option>
                <option value="기타">기타</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${currentTheme?.textColor || 'text-gray-700'}`}>
                정렬 기준
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                className={`w-full px-3 py-2 rounded border ${
                  currentTheme?.inputBg || 'bg-white'
                } ${
                  currentTheme?.inputBorder || 'border-gray-300'
                }`}
              >
                <option value="relevance">관련도순</option>
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="popular">인기순</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${currentTheme?.textColor || 'text-gray-700'}`}>
                작성자
              </label>
              <input
                type="text"
                value={filters.author}
                onChange={(e) => setFilters({...filters, author: e.target.value})}
                placeholder="작성자 이름"
                className={`w-full px-3 py-2 rounded border ${
                  currentTheme?.inputBg || 'bg-white'
                } ${
                  currentTheme?.inputBorder || 'border-gray-300'
                }`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${currentTheme?.textColor || 'text-gray-700'}`}>
                기간
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                className={`w-full px-3 py-2 rounded border ${
                  currentTheme?.inputBg || 'bg-white'
                } ${
                  currentTheme?.inputBorder || 'border-gray-300'
                }`}
              >
                <option value="">전체 기간</option>
                <option value="today">오늘</option>
                <option value="week">이번 주</option>
                <option value="month">이번 달</option>
                <option value="year">올해</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setFilters({ category: "", author: "", dateRange: "", sortBy: "relevance" })}
              className={`px-3 py-1 text-sm rounded ${
                currentTheme?.textColor || 'text-gray-600'
              } hover:bg-gray-100`}
            >
              초기화
            </button>
            <button
              onClick={() => setShowAdvancedFilter(false)}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              적용
            </button>
          </div>
        </div>
      )}

      {/* 검색 드롭다운 */}
      {showDropdown && (
        <div 
          ref={dropdownRef}
          className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-[100] max-h-96 overflow-y-auto ${
            currentTheme?.modalBgColor || 'bg-white'
          } ${
            currentTheme?.inputBorder || 'border-gray-200'
          }`}
        >
          {/* 로딩 상태 */}
          {isLoading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          )}

          {/* 검색 제안 */}
          {!isLoading && suggestions.length > 0 && (
            <div className="p-2">
              <div className={`px-3 py-2 text-sm font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                검색 제안
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full px-3 py-2 text-left rounded hover:bg-gray-100 flex items-center gap-3 ${
                    currentTheme?.textColor || 'text-gray-800'
                  }`}
                >
                  {/* 작성자인 경우 프로필 이미지, 아니면 이모지 아이콘 */}
                  {suggestion.type === "author" ? (
                    <AuthorAvatar suggestion={suggestion} />
                  ) : (
                    <span className="text-lg w-8 h-8 flex items-center justify-center">
                      {getSuggestionIcon(suggestion.type)}
                    </span>
                  )}
                  
                  <div className="flex-1">
                    <div className="font-medium">{suggestion.text}</div>
                    <div className="text-xs text-gray-500">
                      {getSuggestionLabel(suggestion.type)}
                      {suggestion.category && ` • ${suggestion.category}`}
                      {suggestion.author && ` • ${suggestion.author}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 검색 히스토리 */}
          {!isLoading && suggestions.length === 0 && searchHistory.length > 0 && (
            <div className="p-2">
              <div className={`px-3 py-2 text-sm font-medium flex items-center justify-between ${
                currentTheme?.textColor || 'text-gray-700'
              }`}>
                <span className="flex items-center gap-2">
                  <FaHistory className="w-4 h-4" />
                  최근 검색
                </span>
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  전체 삭제
                </button>
              </div>
              {searchHistory.map((item, index) => (
                <div
                  key={index}
                  className={`w-full px-3 py-2 text-left rounded hover:bg-gray-100 flex items-center justify-between group ${
                    currentTheme?.textColor || 'text-gray-800'
                  }`}
                >
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => executeSearch(item)}
                  >
                    <FaClock className="w-4 h-4 text-gray-400" />
                    <span>{item}</span>
                  </div>
                  <button
                    onClick={(e) => removeHistoryItem(item, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                  >
                    <FaTimes className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 빈 상태 */}
          {!isLoading && suggestions.length === 0 && searchHistory.length === 0 && inputValue.trim() && (
            <div className="p-4 text-center text-gray-500">
              <FaSearch className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>검색어를 입력하고 Enter를 눌러주세요</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchInput; 