/**
 * 공지사항 페이지 컴포넌트
 * 
 * 주요 기능:
 * - 앱 업데이트 내역 표시
 * - 앱 소개 및 주요 기능 안내
 * - 공지사항 목록 표시
 * 
 * NOTE: Firebase에서 실시간 공지사항 데이터를 불러와 표시
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import { getAnnouncements, getUpdates, defaultUpdateHistory, defaultNotices } from '@/services/announcementService';
import { getThemeClass } from '@/utils/themeHelper';
import { useSelector } from 'react-redux';
import { ROUTES } from '@/constants/routes';

function AnnouncementPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('updates'); // 'updates', 'intro', 'notices'
  const [updateHistory, setUpdateHistory] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentTheme = useSelector(state => state.theme.currentTheme);

  // 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 업데이트 내역 로딩 (Firebase에서 불러오거나 기본 데이터 사용)
        try {
          const updates = await getUpdates();
          setUpdateHistory(updates.length > 0 ? updates : defaultUpdateHistory);
        } catch {
          console.log('Firebase에서 업데이트 내역을 불러올 수 없어 기본 데이터를 사용합니다.');
          setUpdateHistory(defaultUpdateHistory);
        }

        // 공지사항 로딩 (Firebase에서 불러오거나 기본 데이터 사용)
        try {
          const announcements = await getAnnouncements();
          setNotices(announcements.length > 0 ? announcements : defaultNotices.map((notice, index) => ({
            id: index + 1,
            ...notice,
            date: new Date().toLocaleDateString('ko-KR')
          })));
        } catch {
          console.log('Firebase에서 공지사항을 불러올 수 없어 기본 데이터를 사용합니다.');
          setNotices(defaultNotices.map((notice, index) => ({
            id: index + 1,
            ...notice,
            date: new Date().toLocaleDateString('ko-KR')
          })));
        }
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 앱 소개 데이터
  const appIntro = {
    title: "NoteRoom에 오신 것을 환영합니다!",
    description: "당신의 생각과 감정을 기록하고 공유하는 특별한 공간입니다.",
    features: [
      {
        icon: "📝",
        title: "자유로운 글쓰기",
        description: "일상의 소중한 순간들을 카테고리별로 정리하여 기록하세요."
      },
      {
        icon: "🎭",
        title: "감정 추적",
        description: "글과 함께 감정 상태를 기록하고 나만의 감정 패턴을 분석해보세요."
      },
      {
        icon: "🔍",
        title: "스마트 검색",
        description: "태그, 카테고리, 내용으로 원하는 글을 빠르게 찾아보세요."
      },
      {
        icon: "👥",
        title: "소셜 기능",
        description: "다른 사용자들과 글을 공유하고 소통할 수 있습니다."
      },
      {
        icon: "📊",
        title: "통계 분석",
        description: "작성한 글과 감정 데이터를 통해 나만의 인사이트를 얻어보세요."
      },
      {
        icon: "🌙",
        title: "다양한 테마 지원",
        description: "여러 가지 아름다운 테마 중에서 선택하여 나만의 스타일을 만들어보세요."
      }
    ]
  };

  const getVersionBadgeColor = (type) => {
    switch (type) {
      case 'major': return 'opacity-100';
      case 'minor': return 'opacity-80';
      default: return 'opacity-60';
    }
  };

  const renderUpdates = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">업데이트 내역</h2>
        <p className="opacity-60">NoteRoom의 최신 업데이트 소식을 확인하세요</p>
      </div>
      
      {updateHistory.map((update, index) => (
        <div key={index} className="rounded-lg shadow-md p-6 border-l-4 border-current">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVersionBadgeColor(update.type)}`}>
                {update.version}
              </span>
              <h3 className="text-lg font-semibold">{update.title}</h3>
            </div>
            <span className="text-sm opacity-60">{update.date}</span>
          </div>
          
          <ul className="space-y-2">
            {update.changes.map((change, changeIndex) => (
              <li key={changeIndex} className="flex items-start space-x-2">
                <span className="mt-1">✓</span>
                <span className="opacity-80">{change}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  const renderIntro = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">{appIntro.title}</h2>
        <p className="text-lg opacity-80 max-w-2xl mx-auto">{appIntro.description}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {appIntro.features.map((feature, index) => (
          <div key={index} className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="text-3xl">{feature.icon}</div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="opacity-80">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border rounded-lg p-8 text-center opacity-90">
        <h3 className="text-2xl font-bold mb-4">지금 시작해보세요!</h3>
        <p className="text-lg mb-6">당신만의 특별한 이야기를 NoteRoom에서 기록해보세요.</p>
        <button
          onClick={() => navigate(ROUTES.WRITE)}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90`}
        >
          노트 작성하기
        </button>
      </div>
    </div>
  );

  const renderNotices = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">공지사항</h2>
        <p className="opacity-60">중요한 소식과 안내사항을 확인하세요</p>
      </div>
      
      {notices.map((notice) => (
        <div key={notice.id} className={`rounded-lg shadow-md p-6 ${notice.important ? 'border-l-4 border-current' : 'border-l-4 border-current opacity-60'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {notice.important && (
                <span className="px-2 py-1 rounded-full text-xs font-medium opacity-80">
                  중요
                </span>
              )}
              <h3 className="text-lg font-semibold">{notice.title}</h3>
            </div>
            <span className="text-sm opacity-60">{notice.date}</span>
          </div>
          <p className="opacity-80">{notice.content}</p>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mx-auto mb-4"></div>
          <p className="opacity-60">공지사항을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        {/* 헤더 */}
        <div className="shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => navigate(-1)}
                  className="p-2 hover:opacity-80 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold">공지사항</h1>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('updates')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'updates'
                    ? 'border-current opacity-100'
                    : 'border-transparent opacity-60 hover:opacity-80'
                }`}
              >
                업데이트 내역
              </button>
              <button
                onClick={() => setActiveTab('intro')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'intro'
                    ? 'border-current opacity-100'
                    : 'border-transparent opacity-60 hover:opacity-80'
                }`}
              >
                앱 소개
              </button>
              <button
                onClick={() => setActiveTab('notices')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'notices'
                    ? 'border-current opacity-100'
                    : 'border-transparent opacity-60 hover:opacity-80'
                }`}
              >
                공지사항
              </button>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {activeTab === 'updates' && renderUpdates()}
          {activeTab === 'intro' && renderIntro()}
          {activeTab === 'notices' && renderNotices()}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default AnnouncementPage; 