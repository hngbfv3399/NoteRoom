/**
 * 최적화된 데이터 테이블 컴포넌트
 * 실제 Firebase 데이터를 가상화와 함께 표시합니다.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { FixedSizeList as List } from 'react-window';
import { 
  FiSearch, 
  FiDownload, 
  FiRefreshCw,
  FiChevronUp,
  FiChevronDown,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiEye,
  FiUser,
  FiFileText,
  FiMessageCircle
} from 'react-icons/fi';
import { db } from '@/services/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  startAfter,
  doc,
  getDoc
} from 'firebase/firestore';

function OptimizedDataTable({ dataType = 'users' }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [lastDoc, setLastDoc] = useState(null);

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  // 데이터 타입별 설정
  const tableConfigs = {
    users: {
      title: '사용자 관리',
      icon: FiUser,
      columns: [
        { key: 'displayName', label: '이름', sortable: true },
        { key: 'email', label: '이메일', sortable: true },
        { key: 'createdAt', label: '가입일', sortable: true },
        { key: 'lastLoginAt', label: '마지막 로그인', sortable: true },
        { key: 'isActive', label: '상태', sortable: false }
      ]
    },
    notes: {
      title: '노트 관리',
      icon: FiFileText,
      columns: [
        { key: 'title', label: '제목', sortable: true },
        { key: 'authorName', label: '작성자', sortable: true },
        { key: 'createdAt', label: '작성일', sortable: true },
        { key: 'viewCount', label: '조회수', sortable: true },
        { key: 'isPublic', label: '공개여부', sortable: false }
      ]
    },
    comments: {
      title: '댓글 관리',
      icon: FiMessageCircle,
      columns: [
        { key: 'content', label: '내용', sortable: false },
        { key: 'authorName', label: '작성자', sortable: true },
        { key: 'noteTitle', label: '노트', sortable: true },
        { key: 'createdAt', label: '작성일', sortable: true },
        { key: 'isReported', label: '신고여부', sortable: false }
      ]
    }
  };

  const config = tableConfigs[dataType];

  // 실제 데이터 로드
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      setLoading(true);
      
      let collectionRef = collection(db, dataType);
      let queryConstraints = [];

      // 정렬 조건 추가
      if (sortField && config.columns.find(col => col.key === sortField)?.sortable) {
        queryConstraints.push(orderBy(sortField, sortDirection));
      }

      // 페이지네이션
      queryConstraints.push(limit(itemsPerPage));
      
      if (!isRefresh && lastDoc && currentPage > 1) {
        queryConstraints.push(startAfter(lastDoc));
      }

      const dataQuery = query(collectionRef, ...queryConstraints);
      const snapshot = await getDocs(dataQuery);
      
      let processedData = [];
      
      if (dataType === 'users') {
        processedData = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const userData = docSnapshot.data();
            return {
              id: docSnapshot.id,
              displayName: userData.displayName || '이름 없음',
              email: userData.email || '이메일 없음',
              createdAt: userData.createdAt?.toDate() || new Date(),
              lastLoginAt: userData.lastLoginAt?.toDate() || null,
              isActive: userData.isActive !== false
            };
          })
        );
      } else if (dataType === 'notes') {
        processedData = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const noteData = docSnapshot.data();
            
            // 작성자 정보 가져오기
            let authorName = '알 수 없음';
            if (noteData.authorUid) {
              try {
                const authorDoc = await getDoc(doc(db, 'users', noteData.authorUid));
                if (authorDoc.exists()) {
                  authorName = authorDoc.data().displayName || '이름 없음';
                }
              } catch (error) {
                console.error('작성자 정보 로드 실패:', error);
              }
            }

            return {
              id: docSnapshot.id,
              title: noteData.title || '제목 없음',
              authorName,
              authorUid: noteData.authorUid,
              createdAt: noteData.createdAt?.toDate() || new Date(),
              viewCount: noteData.viewCount || 0,
              isPublic: noteData.isPublic !== false
            };
          })
        );
      } else if (dataType === 'comments') {
        // 댓글은 서브컬렉션이므로 모든 노트의 댓글을 수집
        const notesSnapshot = await getDocs(collection(db, 'notes'));
        const allComments = [];
        
        for (const noteDoc of notesSnapshot.docs) {
          const commentsSnapshot = await getDocs(
            query(
              collection(db, 'notes', noteDoc.id, 'comments'),
              orderBy('createdAt', 'desc'),
              limit(10) // 노트당 최대 10개 댓글
            )
          );
          
          for (const commentDoc of commentsSnapshot.docs) {
            const commentData = commentDoc.data();
            allComments.push({
              id: `${noteDoc.id}-${commentDoc.id}`,
              content: commentData.content?.substring(0, 100) + '...' || '내용 없음',
              authorName: commentData.authorName || '익명',
              noteTitle: noteDoc.data().title || '제목 없음',
              noteId: noteDoc.id,
              createdAt: commentData.createdAt?.toDate() || new Date(),
              isReported: false // 실제 신고 시스템 구현 시 업데이트
            });
          }
        }
        
        // 정렬 및 페이지네이션 적용
        allComments.sort((a, b) => {
          if (sortField === 'createdAt') {
            return sortDirection === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
          }
          return 0;
        });
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        processedData = allComments.slice(startIndex, startIndex + itemsPerPage);
        setTotalItems(allComments.length);
      }

      if (isRefresh || currentPage === 1) {
        setData(processedData);
      } else {
        setData(prev => [...prev, ...processedData]);
      }

      // 마지막 문서 저장 (페이지네이션용)
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }

      // 총 아이템 수 설정 (댓글 제외)
      if (dataType !== 'comments') {
        setTotalItems(snapshot.size);
      }

    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [dataType, sortField, sortDirection, itemsPerPage, currentPage, lastDoc, config.columns]);

  // 초기 데이터 로드
  useEffect(() => {
    loadData(true);
  }, [dataType, sortField, sortDirection, itemsPerPage]);

  // 검색 필터링된 데이터
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return Object.values(item).some(value => {
        if (value && typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    });
  }, [data, searchTerm]);

  // 정렬 핸들러
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
    setLastDoc(null);
  };

  // 선택 핸들러
  const handleSelectItem = (id) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedItems.size === filteredData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredData.map(item => item.id)));
    }
  };

  // 데이터 내보내기
  const handleExport = () => {
    const csvContent = [
      config.columns.map(col => col.label).join(','),
      ...filteredData.map(item => 
        config.columns.map(col => {
          const value = item[col.key];
          if (value instanceof Date) {
            return value.toLocaleDateString();
          }
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${config.title}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 값 포맷팅
  const formatValue = (value, key) => {
    if (value instanceof Date) {
      return value.toLocaleDateString('ko-KR');
    }
    if (typeof value === 'boolean') {
      if (key === 'isActive') return value ? '활성' : '비활성';
      if (key === 'isPublic') return value ? '공개' : '비공개';
      if (key === 'isReported') return value ? '신고됨' : '정상';
    }
    if (key === 'viewCount') {
      return value?.toLocaleString() || '0';
    }
    return value || '-';
  };

  // 행 렌더러 (가상화용)
  const Row = ({ index, style }) => {
    const item = filteredData[index];
    if (!item) return null;

    return (
      <div style={style} className="flex items-center border-b border-gray-100 hover:bg-gray-50">
        {/* 체크박스 */}
        <div className="w-12 flex justify-center">
          <input
            type="checkbox"
            checked={selectedItems.has(item.id)}
            onChange={() => handleSelectItem(item.id)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>

        {/* 데이터 컬럼들 */}
        {config.columns.map((column, colIndex) => (
          <div
            key={column.key}
            className={`px-4 py-3 text-sm ${currentTheme?.textColor || 'text-gray-900'} ${
              colIndex === 0 ? 'flex-1' : 'w-32'
            }`}
          >
            {formatValue(item[column.key], column.key)}
          </div>
        ))}

        {/* 액션 버튼 */}
        <div className="w-20 flex justify-center">
          <div className="relative group">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <FiMoreVertical className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2">
                <FiEye className="w-3 h-3" />
                <span>보기</span>
              </button>
              <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2">
                <FiEdit className="w-3 h-3" />
                <span>편집</span>
              </button>
              <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center space-x-2">
                <FiTrash2 className="w-3 h-3" />
                <span>삭제</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-xl border shadow-sm ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <config.icon className={`w-6 h-6 ${currentTheme?.textColor || 'text-gray-700'}`} />
            <h2 className={`text-xl font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
              {config.title}
            </h2>
            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700`}>
              {totalItems.toLocaleString()}개
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* 새로고침 */}
            <button
              onClick={() => loadData(true)}
              disabled={loading}
              className={`p-2 rounded-lg transition-colors ${
                loading 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : `${currentTheme?.inputBg || 'bg-gray-100'} hover:bg-gray-200 ${currentTheme?.textColor || 'text-gray-700'}`
              }`}
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* 내보내기 */}
            <button
              onClick={handleExport}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${currentTheme?.inputBg || 'bg-gray-100'} hover:bg-gray-200 ${currentTheme?.textColor || 'text-gray-700'}`}
            >
              <FiDownload className="w-4 h-4" />
              <span>내보내기</span>
            </button>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex items-center space-x-4">
          {/* 검색 */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          {/* 페이지당 항목 수 */}
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
              setLastDoc(null);
            }}
            className={`px-3 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value={25}>25개씩</option>
            <option value={50}>50개씩</option>
            <option value={100}>100개씩</option>
          </select>
        </div>

        {/* 선택된 항목 정보 */}
        {selectedItems.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedItems.size}개 항목이 선택됨
              </span>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                  일괄 편집
                </button>
                <button className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                  일괄 삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 테이블 헤더 */}
      <div className="flex items-center bg-gray-50 border-b border-gray-200">
        {/* 전체 선택 체크박스 */}
        <div className="w-12 flex justify-center">
          <input
            type="checkbox"
            checked={filteredData.length > 0 && selectedItems.size === filteredData.length}
            onChange={handleSelectAll}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>

        {/* 컬럼 헤더들 */}
        {config.columns.map((column, index) => (
          <div
            key={column.key}
            className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
              index === 0 ? 'flex-1' : 'w-32'
            } ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
            onClick={() => column.sortable && handleSort(column.key)}
          >
            <div className="flex items-center space-x-1">
              <span>{column.label}</span>
              {column.sortable && sortField === column.key && (
                sortDirection === 'asc' ? 
                  <FiChevronUp className="w-3 h-3" /> : 
                  <FiChevronDown className="w-3 h-3" />
              )}
            </div>
          </div>
        ))}

        {/* 액션 컬럼 */}
        <div className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          액션
        </div>
      </div>

      {/* 데이터 테이블 (가상화) */}
      <div className="relative">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                데이터를 불러오는 중...
              </p>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <config.icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
              데이터가 없습니다
            </h3>
            <p className={`text-sm mt-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
              {searchTerm ? '검색 조건에 맞는 데이터가 없습니다.' : '아직 데이터가 없습니다.'}
            </p>
          </div>
        ) : (
          <List
            height={400}
            itemCount={filteredData.length}
            itemSize={60}
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {Row}
          </List>
        )}
      </div>

      {/* 페이지네이션 */}
      {filteredData.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`text-sm ${currentTheme?.textColor || 'text-gray-700'}`}>
              총 {totalItems.toLocaleString()}개 중 {filteredData.length}개 표시
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                  setLastDoc(null);
                }}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded border ${
                  currentPage === 1 
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed' 
                    : `${currentTheme?.textColor || 'text-gray-700'} border-gray-300 hover:bg-gray-50`
                }`}
              >
                이전
              </button>
              
              <span className={`px-3 py-1 ${currentTheme?.textColor || 'text-gray-700'}`}>
                {currentPage}
              </span>
              
              <button
                onClick={() => {
                  setCurrentPage(prev => prev + 1);
                  loadData();
                }}
                disabled={filteredData.length < itemsPerPage}
                className={`px-3 py-1 rounded border ${
                  filteredData.length < itemsPerPage
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed' 
                    : `${currentTheme?.textColor || 'text-gray-700'} border-gray-300 hover:bg-gray-50`
                }`}
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OptimizedDataTable; 