/**
 * 관리자용 공지사항 관리 페이지
 * 
 * 주요 기능:
 * - 공지사항 추가/수정/삭제
 * - 업데이트 내역 추가/수정/삭제
 * - 관리자 권한 확인
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAnnouncements, 
  addAnnouncement, 
  addUpdate, 
  updateAnnouncement, 
  deleteAnnouncement 
} from '@/services/announcementService';
import { initializeAppData } from '@/utils/initializeData';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ROUTES } from '@/constants/routes';

function AdminAnnouncementPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // 공지사항 폼 상태
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    important: false
  });

  // 업데이트 폼 상태
  const [updateForm, setUpdateForm] = useState({
    version: '',
    title: '',
    changes: [''],
    type: 'minor',
    date: new Date().toISOString().split('T')[0]
  });

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const announcementsData = await getAnnouncements();
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 공지사항 추가/수정
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      if (editingId) {
        await updateAnnouncement(editingId, announcementForm);
        alert('공지사항이 수정되었습니다.');
      } else {
        await addAnnouncement(announcementForm);
        alert('공지사항이 추가되었습니다.');
      }
      
      setAnnouncementForm({ title: '', content: '', important: false });
      setEditingId(null);
      await loadData();
    } catch (error) {
      console.error('공지사항 저장 실패:', error);
      alert('공지사항 저장 중 오류가 발생했습니다.');
    }
  };

  // 업데이트 내역 추가
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updateForm.version.trim() || !updateForm.title.trim() || updateForm.changes.some(change => !change.trim())) {
      alert('모든 필드를 올바르게 입력해주세요.');
      return;
    }

    try {
      const updateData = {
        ...updateForm,
        changes: updateForm.changes.filter(change => change.trim()),
        releaseDate: new Date(updateForm.date)
      };
      
      await addUpdate(updateData);
      alert('업데이트 내역이 추가되었습니다.');
      
      setUpdateForm({
        version: '',
        title: '',
        changes: [''],
        type: 'minor',
        date: new Date().toISOString().split('T')[0]
      });
      await loadData();
    } catch (error) {
      console.error('업데이트 내역 저장 실패:', error);
      alert('업데이트 내역 저장 중 오류가 발생했습니다.');
    }
  };

  // 첫 배포 데이터 초기화
  const handleInitializeData = async () => {
    if (!window.confirm('첫 배포 업데이트 내역을 추가하시겠습니까?')) return;
    
    try {
      await initializeAppData();
      await loadData(); // 데이터 새로고침
    } catch (error) {
      console.error('데이터 초기화 실패:', error);
    }
  };

  // 공지사항 삭제
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) return;

    try {
      await deleteAnnouncement(id);
      alert('공지사항이 삭제되었습니다.');
      await loadData();
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
      alert('공지사항 삭제 중 오류가 발생했습니다.');
    }
  };

  // 공지사항 수정 모드
  const handleEditAnnouncement = (announcement) => {
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      important: announcement.important || false
    });
    setEditingId(announcement.id);
  };

  // 변경사항 추가/제거
  const addChange = () => {
    setUpdateForm(prev => ({
      ...prev,
      changes: [...prev.changes, '']
    }));
  };

  const removeChange = (index) => {
    setUpdateForm(prev => ({
      ...prev,
      changes: prev.changes.filter((_, i) => i !== index)
    }));
  };

  const updateChange = (index, value) => {
    setUpdateForm(prev => ({
      ...prev,
      changes: prev.changes.map((change, i) => i === index ? value : change)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        {/* 헤더 */}
        <div className="shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => navigate(ROUTES.SETTING)}
                  className="p-2 hover:opacity-80 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold">공지사항 관리</h1>
              </div>
              <button
                onClick={() => navigate(ROUTES.ANNOUNCEMENT)}
                className="px-4 py-2 rounded-lg hover:opacity-80 transition-colors"
              >
                공지사항 보기
              </button>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('announcements')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'announcements'
                    ? 'border-current opacity-100'
                    : 'border-transparent opacity-60 hover:opacity-80'
                }`}
              >
                공지사항 관리
              </button>
              <button
                onClick={() => setActiveTab('updates')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'updates'
                    ? 'border-current opacity-100'
                    : 'border-transparent opacity-60 hover:opacity-80'
                }`}
              >
                업데이트 내역 관리
              </button>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {activeTab === 'announcements' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 공지사항 추가/수정 폼 */}
              <div className="rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">
                  {editingId ? '공지사항 수정' : '새 공지사항 추가'}
                </h2>
                <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      제목
                    </label>
                    <input
                      type="text"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-current"
                      placeholder="공지사항 제목을 입력하세요"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      내용
                    </label>
                    <textarea
                      value={announcementForm.content}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-current"
                      placeholder="공지사항 내용을 입력하세요"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="important"
                      checked={announcementForm.important}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, important: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="important" className="text-sm">
                      중요 공지사항으로 표시
                    </label>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 rounded-md hover:opacity-80 transition-colors"
                    >
                      {editingId ? '수정' : '추가'}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setAnnouncementForm({ title: '', content: '', important: false });
                        }}
                        className="px-4 py-2 rounded-md hover:opacity-80 transition-colors opacity-60"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* 기존 공지사항 목록 */}
              <div className="rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">기존 공지사항</h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {announcement.important && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium opacity-80">
                              중요
                            </span>
                          )}
                          <h3 className="font-semibold">{announcement.title}</h3>
                        </div>
                        <span className="text-xs opacity-60">{announcement.date}</span>
                      </div>
                      <p className="text-sm mb-3 opacity-80">{announcement.content}</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditAnnouncement(announcement)}
                          className="px-3 py-1 text-xs rounded hover:opacity-80 transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          className="px-3 py-1 text-xs rounded hover:opacity-80 transition-colors opacity-60"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'updates' && (
            <div className="rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">새 업데이트 내역 추가</h2>
                <button
                  onClick={handleInitializeData}
                  className="px-4 py-2 rounded-md hover:opacity-80 transition-colors text-sm"
                >
                  🚀 첫 배포 데이터 초기화
                </button>
              </div>
              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      버전
                    </label>
                    <input
                      type="text"
                      value={updateForm.version}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, version: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-current"
                      placeholder="v2.1.0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      타입
                    </label>
                    <select
                      value={updateForm.type}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-current"
                    >
                      <option value="major">Major</option>
                      <option value="minor">Minor</option>
                      <option value="patch">Patch</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      출시일
                    </label>
                    <input
                      type="date"
                      value={updateForm.date}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-current"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    업데이트 제목
                  </label>
                  <input
                    type="text"
                    value={updateForm.title}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-current"
                    placeholder="업데이트 제목을 입력하세요"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    변경사항
                  </label>
                  {updateForm.changes.map((change, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={change}
                        onChange={(e) => updateChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-current"
                        placeholder="변경사항을 입력하세요"
                        required
                      />
                      {updateForm.changes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChange(index)}
                          className="px-3 py-2 rounded-md hover:opacity-80 transition-colors opacity-60"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addChange}
                    className="px-4 py-2 rounded-md hover:opacity-80 transition-colors"
                  >
                    변경사항 추가
                  </button>
                </div>
                
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-md hover:opacity-80 transition-colors"
                >
                  업데이트 내역 추가
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default AdminAnnouncementPage; 