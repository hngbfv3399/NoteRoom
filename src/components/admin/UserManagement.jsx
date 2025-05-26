/**
 * 사용자 관리 컴포넌트
 * 사용자 계정 관리, 권한 설정, 계정 상태 변경 등의 기능을 제공합니다.
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  FiUsers, 
  FiSearch, 
  FiFilter,
  FiMoreVertical,
  FiUser,
  FiMail,
  FiCalendar,
  FiActivity,
  FiShield,
  FiLock,
  FiUnlock
} from 'react-icons/fi';
import { getUserManagementData, updateUserStatus } from '@/utils/adminUtils';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userData = await getUserManagementData();
      setUsers(userData);
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action, reason = '') => {
    try {
      await updateUserStatus(userId, action, reason);
      await loadUsers(); // 데이터 새로고침
      setShowActionModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('사용자 상태 변경 실패:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'suspended':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return '활성';
      case 'suspended':
        return '정지';
      case 'pending':
        return '대기';
      default:
        return '알 수 없음';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={`text-lg ${currentTheme?.textColor || 'text-gray-600'}`}>
            사용자 데이터를 로드하는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="사용자 이름 또는 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>

        <div className="flex items-center space-x-2">
          <FiFilter className="text-gray-400 w-5 h-5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">모든 상태</option>
            <option value="active">활성</option>
            <option value="suspended">정지</option>
            <option value="pending">대기</option>
          </select>
        </div>
      </div>

      {/* 사용자 목록 */}
      <div className={`rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${currentTheme?.inputBg || 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme?.textColor || 'text-gray-500'} uppercase tracking-wider`}>
                  사용자
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme?.textColor || 'text-gray-500'} uppercase tracking-wider`}>
                  상태
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme?.textColor || 'text-gray-500'} uppercase tracking-wider`}>
                  활동
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme?.textColor || 'text-gray-500'} uppercase tracking-wider`}>
                  가입일
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme?.textColor || 'text-gray-500'} uppercase tracking-wider`}>
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className={`h-10 w-10 rounded-full ${currentTheme?.buttonBg || 'bg-blue-500'} flex items-center justify-center`}>
                          <FiUser className={`w-5 h-5 ${currentTheme?.buttonText || 'text-white'}`} />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                          {user.displayName || '이름 없음'}
                        </div>
                        <div className={`text-sm ${currentTheme?.textColor || 'text-gray-500'}`}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status || 'active')}`}>
                      {getStatusText(user.status || 'active')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <FiActivity className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                          노트 {user.notesCount || 0}개
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiMail className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                          댓글 {user.commentsCount || 0}개
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <FiCalendar className="w-4 h-4 text-gray-400" />
                      <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                        {user.createdAt?.toDate?.()?.toLocaleDateString() || '알 수 없음'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowActionModal(true);
                      }}
                      className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${currentTheme?.textColor || 'text-gray-400'} hover:text-gray-600`}
                    >
                      <FiMoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className={`text-lg font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
              사용자를 찾을 수 없습니다
            </p>
            <p className={`text-sm mt-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
              검색 조건을 변경해보세요.
            </p>
          </div>
        )}
      </div>

      {/* 사용자 작업 모달 */}
      {showActionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${currentTheme?.modalBgColor || 'bg-white'} rounded-xl p-6 max-w-md w-full mx-4`}
          >
            <div className="flex items-center space-x-3 mb-6">
              <FiShield className="w-6 h-6 text-blue-500" />
              <h3 className={`text-lg font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
                사용자 관리
              </h3>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`h-12 w-12 rounded-full ${currentTheme?.buttonBg || 'bg-blue-500'} flex items-center justify-center`}>
                  <FiUser className={`w-6 h-6 ${currentTheme?.buttonText || 'text-white'}`} />
                </div>
                <div>
                  <h4 className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                    {selectedUser.displayName || '이름 없음'}
                  </h4>
                  <p className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${currentTheme?.inputBg || 'bg-gray-50'}`}>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                      상태:
                    </span>
                    <span className={`ml-2 ${getStatusColor(selectedUser.status || 'active')} px-2 py-1 rounded-full text-xs`}>
                      {getStatusText(selectedUser.status || 'active')}
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                      노트:
                    </span>
                    <span className={`ml-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
                      {selectedUser.notesCount || 0}개
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                      댓글:
                    </span>
                    <span className={`ml-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
                      {selectedUser.commentsCount || 0}개
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium ${currentTheme?.textColor || 'text-gray-700'}`}>
                      가입일:
                    </span>
                    <span className={`ml-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
                      {selectedUser.createdAt?.toDate?.()?.toLocaleDateString() || '알 수 없음'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {selectedUser.status !== 'suspended' && (
                <button
                  onClick={() => handleUserAction(selectedUser.id, 'suspended', '관리자에 의한 계정 정지')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <FiLock className="w-4 h-4" />
                  <span>계정 정지</span>
                </button>
              )}

              {selectedUser.status === 'suspended' && (
                <button
                  onClick={() => handleUserAction(selectedUser.id, 'active', '관리자에 의한 계정 활성화')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <FiUnlock className="w-4 h-4" />
                  <span>계정 활성화</span>
                </button>
              )}

              <button
                onClick={() => setShowActionModal(false)}
                className={`w-full px-4 py-2 rounded-lg border ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-700'} hover:bg-gray-50 transition-colors`}
              >
                취소
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default UserManagement; 