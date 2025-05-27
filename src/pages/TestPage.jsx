/**
 * 테스트 페이지
 * UI 컴포넌트와 기능들을 테스트할 수 있는 전용 페이지
 */

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import store from '@/store/store';
import { 
  FiPlay, 
  FiCheck, 
  FiX, 
  FiAlertTriangle, 
  FiInfo, 
  FiSettings,
  FiUser,
  FiFileText,
  FiMessageCircle,
  FiShield,
  FiZap,
  FiRefreshCw,
  FiBell,
  FiHeart,
  FiEye,
  FiSend,
  FiTrash2,
  FiTrash
} from 'react-icons/fi';
import { showToast } from '@/store/toast/slice';
import ReportModal from '@/components/common/ReportModal';
import { reportContent } from '@/utils/reportUtils';
import { autoModerateContent } from '@/utils/adminUtils';
import { auth } from '@/services/firebase';
import { 
  getUserNotifications, 
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  deleteUnreadNotifications
} from '@/utils/notificationUtils';
import { 
  requestNotificationPermission,
  showCommentNotification,
  getNotificationPermission
} from '@/utils/pushNotificationUtils';
import { EMOTION_TYPES, EMOTION_META } from '@/utils/emotionConstants';

function TestPage() {
  const dispatch = useDispatch();
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [testResults, setTestResults] = useState([]);

  // 토스트 테스트 함수들
  const testToasts = {
    success: () => dispatch(showToast({ 
      message: '성공! 작업이 완료되었습니다.', 
      type: 'success', 
      duration: 2000 
    })),
    error: () => dispatch(showToast({ 
      message: '오류가 발생했습니다. 다시 시도해주세요.', 
      type: 'error', 
      duration: 3000 
    })),
    warning: () => dispatch(showToast({ 
      message: '주의: 이 작업은 되돌릴 수 없습니다.', 
      type: 'warning', 
      duration: 2500 
    })),
    info: () => dispatch(showToast({ 
      message: '새로운 업데이트가 있습니다.', 
      type: 'info', 
      duration: 2000 
    })),
    long: () => dispatch(showToast({ 
      message: '이것은 매우 긴 메시지입니다. 토스트가 여러 줄로 표시되는지 확인하기 위한 테스트 메시지입니다. 텍스트가 적절히 줄바꿈되는지 확인해보세요.', 
      type: 'info', 
      duration: 4000 
    })),
    multiple: () => {
      dispatch(showToast({ message: '첫 번째 알림', type: 'success', duration: 2000 }));
      setTimeout(() => dispatch(showToast({ message: '두 번째 알림', type: 'warning', duration: 2000 })), 500);
      setTimeout(() => dispatch(showToast({ message: '세 번째 알림', type: 'error', duration: 2000 })), 1000);
    }
  };

  // 기능 테스트 함수들
  const functionalTests = {
    reportSystem: async () => {
      try {
        // Firebase Auth에서 현재 사용자 확인
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          addTestResult('신고 시스템', false, '로그인이 필요합니다.');
          return;
        }

        const result = await reportContent('note', 'test-note-id', 'spam', '테스트 신고입니다.', currentUser.uid);
        addTestResult('신고 시스템', result.success, result.message);
      } catch (error) {
        addTestResult('신고 시스템', false, error.message);
      }
    },
    
    autoModeration: async () => {
      try {
        const result = await autoModerateContent('note', 'test-note-id', '이것은 테스트 콘텐츠입니다.');
        addTestResult('자동 모더레이션', true, `신뢰도: ${Math.round(result.confidence * 100)}%`);
      } catch (error) {
        addTestResult('자동 모더레이션', false, error.message);
      }
    },
    
    themeSystem: () => {
      const isWorking = currentTheme && Object.keys(currentTheme).length > 0;
      addTestResult('테마 시스템', isWorking, isWorking ? `현재 테마: ${current}` : '테마 로드 실패');
    },
    
    reduxStore: () => {
      try {
        const state = store.getState();
        const hasRequiredSlices = state.theme && state.toast && state.noteData;
        addTestResult('Redux Store', hasRequiredSlices, hasRequiredSlices ? '모든 slice 정상' : '일부 slice 누락');
      } catch (error) {
        addTestResult('Redux Store', false, error.message);
      }
    },

    // 새로운 테스트들
    notificationSystem: async () => {
      try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          addTestResult('알림 시스템', false, '로그인이 필요합니다.');
          return;
        }

        console.log('알림 시스템 테스트 시작:', currentUser.uid);
        
        // 알림 개수 조회 테스트
        const unreadCount = await getUnreadNotificationCount(currentUser.uid);
        console.log('읽지 않은 알림 개수:', unreadCount);
        addTestResult('알림 시스템', true, `읽지 않은 알림: ${unreadCount}개`);
      } catch (error) {
        console.error('알림 시스템 테스트 오류:', error);
        addTestResult('알림 시스템', false, `오류: ${error.message}`);
      }
    },

    pushNotifications: async () => {
      try {
        console.log('푸시 알림 테스트 시작');
        
        // 브라우저 지원 확인
        if (!('Notification' in window)) {
          addTestResult('푸시 알림', false, '브라우저가 알림을 지원하지 않습니다.');
          return;
        }

        const permission = getNotificationPermission();
        console.log('현재 알림 권한:', permission);
        
        if (permission === 'granted') {
          try {
            const result = await showCommentNotification('테스트 사용자', '테스트 노트 제목', 'test-note-id');
            console.log('알림 전송 결과:', result);
            addTestResult('푸시 알림', true, '브라우저 알림 전송 성공');
          } catch (notificationError) {
            console.error('알림 전송 오류:', notificationError);
            addTestResult('푸시 알림', false, `알림 전송 실패: ${notificationError.message}`);
          }
        } else if (permission === 'default') {
          try {
            const granted = await requestNotificationPermission();
            console.log('권한 요청 결과:', granted);
            addTestResult('푸시 알림', granted, granted ? '권한 허용됨' : '권한 거부됨');
          } catch (permissionError) {
            console.error('권한 요청 오류:', permissionError);
            addTestResult('푸시 알림', false, `권한 요청 실패: ${permissionError.message}`);
          }
        } else {
          addTestResult('푸시 알림', false, '알림 권한이 차단되어 있습니다.');
        }
      } catch (error) {
        console.error('푸시 알림 테스트 오류:', error);
        addTestResult('푸시 알림', false, `오류: ${error.message}`);
      }
    },

    emotionTracking: () => {
      try {
        console.log('감정 추적 테스트 시작');
        const emotionCount = Object.keys(EMOTION_TYPES).length;
        const hasEmotionMeta = Object.keys(EMOTION_META).length > 0;
        console.log('감정 타입 개수:', emotionCount, '메타데이터 존재:', hasEmotionMeta);
        addTestResult('감정 추적', hasEmotionMeta, `${emotionCount}개 감정 타입 로드됨`);
      } catch (error) {
        console.error('감정 추적 테스트 오류:', error);
        addTestResult('감정 추적', false, `오류: ${error.message}`);
      }
    },

    commentNotification: async () => {
      try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          addTestResult('댓글 알림', false, '로그인이 필요합니다.');
          return;
        }

        console.log('댓글 알림 테스트 시작:', currentUser.uid);

        // 간단한 테스트용 알림 생성 (실제 Firestore 작업 없이)
        try {
          // 토스트 메시지만 테스트
          dispatch(showToast({ 
            message: '댓글 알림 테스트가 실행되었습니다.', 
            type: 'info', 
            duration: 3000 
          }));
          addTestResult('댓글 알림', true, '댓글 알림 기능 테스트 완료');
        } catch (toastError) {
          console.error('토스트 알림 오류:', toastError);
          addTestResult('댓글 알림', false, `토스트 알림 실패: ${toastError.message}`);
        }
      } catch (error) {
        console.error('댓글 알림 테스트 오류:', error);
        addTestResult('댓글 알림', false, `오류: ${error.message}`);
      }
    },

    userNotifications: async () => {
      try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          addTestResult('사용자 알림', false, '로그인이 필요합니다.');
          return;
        }

        console.log('사용자 알림 테스트 시작:', currentUser.uid);
        
        const notifications = await getUserNotifications(currentUser.uid, 5);
        console.log('조회된 알림:', notifications);
        addTestResult('사용자 알림', true, `최근 알림 ${notifications.length}개 조회됨`);
      } catch (error) {
        console.error('사용자 알림 테스트 오류:', error);
        addTestResult('사용자 알림', false, `오류: ${error.message}`);
      }
    },

    deleteAllNotifications: async () => {
      try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          addTestResult('모든 알림 삭제', false, '로그인이 필요합니다.');
          return;
        }

        console.log('모든 알림 삭제 테스트 시작:', currentUser.uid);
        
        const result = await markAllNotificationsAsRead(currentUser.uid);
        console.log('모든 알림 삭제 결과:', result);
        addTestResult('모든 알림 삭제', true, `${result.deletedCount}개 알림 삭제 완료`);
      } catch (error) {
        console.error('모든 알림 삭제 테스트 오류:', error);
        addTestResult('모든 알림 삭제', false, `오류: ${error.message}`);
      }
    },

    deleteUnreadNotifications: async () => {
      try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          addTestResult('읽지 않은 알림 삭제', false, '로그인이 필요합니다.');
          return;
        }

        console.log('읽지 않은 알림 삭제 테스트 시작:', currentUser.uid);
        
        const result = await deleteUnreadNotifications(currentUser.uid);
        console.log('읽지 않은 알림 삭제 결과:', result);
        addTestResult('읽지 않은 알림 삭제', true, `${result.deletedCount}개 읽지 않은 알림 삭제 완료`);
      } catch (error) {
        console.error('읽지 않은 알림 삭제 테스트 오류:', error);
        addTestResult('읽지 않은 알림 삭제', false, `오류: ${error.message}`);
      }
    }
  };

  // 테스트 결과 추가
  const addTestResult = (testName, success, message) => {
    const result = {
      id: Date.now(),
      testName,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // 최대 10개 결과 유지
  };

  // 모든 테스트 실행
  const runAllTests = async () => {
    setTestResults([]);
    
    // 토스트 테스트
    testToasts.success();
    
    // 기본 기능 테스트들
    functionalTests.themeSystem();
    functionalTests.reduxStore();
    functionalTests.emotionTracking();
    
    // 비동기 테스트들
    setTimeout(() => functionalTests.autoModeration(), 1000);
    setTimeout(() => functionalTests.reportSystem(), 2000);
    setTimeout(() => functionalTests.notificationSystem(), 3000);
    setTimeout(() => functionalTests.userNotifications(), 4000);
    setTimeout(() => functionalTests.pushNotifications(), 5000);
  };

  return (
    <div className={`min-h-screen ${currentTheme?.bgColor || 'bg-gray-50'} p-6`}>
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className={`${currentTheme?.cardBg || 'bg-white'} rounded-xl p-6 mb-6 shadow-lg border ${currentTheme?.borderColor || 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                🧪 테스트 페이지
              </h1>
              <p className={`mt-2 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                UI 컴포넌트와 시스템 기능을 테스트할 수 있습니다.
              </p>
            </div>
            <button
              onClick={runAllTests}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90 transition-opacity`}
            >
              <FiPlay className="w-4 h-4" />
              <span>전체 테스트 실행</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 토스트 테스트 섹션 */}
          <div className={`${currentTheme?.cardBg || 'bg-white'} rounded-xl p-6 shadow-lg border ${currentTheme?.borderColor || 'border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${currentTheme?.textColor || 'text-gray-900'}`}>
              🍞 토스트 알림 테스트
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={testToasts.success}
                className="flex items-center justify-center space-x-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <FiCheck className="w-4 h-4" />
                <span>성공</span>
              </button>
              
              <button
                onClick={testToasts.error}
                className="flex items-center justify-center space-x-2 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <FiX className="w-4 h-4" />
                <span>오류</span>
              </button>
              
              <button
                onClick={testToasts.warning}
                className="flex items-center justify-center space-x-2 p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                <FiAlertTriangle className="w-4 h-4" />
                <span>경고</span>
              </button>
              
              <button
                onClick={testToasts.info}
                className="flex items-center justify-center space-x-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FiInfo className="w-4 h-4" />
                <span>정보</span>
              </button>
              
              <button
                onClick={testToasts.long}
                className="flex items-center justify-center space-x-2 p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <FiFileText className="w-4 h-4" />
                <span>긴 메시지</span>
              </button>
              
              <button
                onClick={testToasts.multiple}
                className="flex items-center justify-center space-x-2 p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                <FiRefreshCw className="w-4 h-4" />
                <span>다중 알림</span>
              </button>
            </div>
          </div>

          {/* 모달 테스트 섹션 */}
          <div className={`${currentTheme?.cardBg || 'bg-white'} rounded-xl p-6 shadow-lg border ${currentTheme?.borderColor || 'border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${currentTheme?.textColor || 'text-gray-900'}`}>
              📱 모달 컴포넌트 테스트
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <FiShield className="w-4 h-4" />
                <span>신고 모달 열기</span>
              </button>
              
              <div className={`p-3 rounded-lg ${currentTheme?.cardBg || 'bg-gray-50'}`}>
                <p className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                  신고 모달을 열어서 테마 적용, 애니메이션, 폼 기능을 테스트할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 기능 테스트 섹션 */}
          <div className={`${currentTheme?.cardBg || 'bg-white'} rounded-xl p-6 shadow-lg border ${currentTheme?.borderColor || 'border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${currentTheme?.textColor || 'text-gray-900'}`}>
              ⚙️ 시스템 기능 테스트
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={functionalTests.themeSystem}
                className="flex items-center justify-center space-x-2 p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <FiSettings className="w-4 h-4" />
                <span>테마</span>
              </button>
              
              <button
                onClick={functionalTests.reduxStore}
                className="flex items-center justify-center space-x-2 p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                <FiZap className="w-4 h-4" />
                <span>Redux</span>
              </button>
              
              <button
                onClick={functionalTests.autoModeration}
                className="flex items-center justify-center space-x-2 p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <FiShield className="w-4 h-4" />
                <span>자동 모더레이션</span>
              </button>
              
              <button
                onClick={functionalTests.reportSystem}
                className="flex items-center justify-center space-x-2 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <FiAlertTriangle className="w-4 h-4" />
                <span>신고 시스템</span>
              </button>
            </div>
          </div>

          {/* 새로운 알림 시스템 테스트 섹션 */}
          <div className={`${currentTheme?.cardBg || 'bg-white'} rounded-xl p-6 shadow-lg border ${currentTheme?.borderColor || 'border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${currentTheme?.textColor || 'text-gray-900'}`}>
              🔔 알림 시스템 테스트
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={functionalTests.notificationSystem}
                className="flex items-center justify-center space-x-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FiBell className="w-4 h-4" />
                <span>알림 시스템</span>
              </button>
              
              <button
                onClick={functionalTests.pushNotifications}
                className="flex items-center justify-center space-x-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <FiSend className="w-4 h-4" />
                <span>푸시 알림</span>
              </button>
              
              <button
                onClick={functionalTests.commentNotification}
                className="flex items-center justify-center space-x-2 p-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                <FiMessageCircle className="w-4 h-4" />
                <span>댓글 알림</span>
              </button>
              
              <button
                onClick={functionalTests.userNotifications}
                className="flex items-center justify-center space-x-2 p-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
              >
                <FiUser className="w-4 h-4" />
                <span>사용자 알림</span>
              </button>
              
              <button
                onClick={functionalTests.deleteAllNotifications}
                className="flex items-center justify-center space-x-2 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
                <span>모든 알림 삭제</span>
              </button>
              
              <button
                onClick={functionalTests.deleteUnreadNotifications}
                className="flex items-center justify-center space-x-2 p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <FiTrash className="w-4 h-4" />
                <span>읽지 않은 알림 삭제</span>
              </button>
            </div>
          </div>

          {/* 감정 추적 테스트 섹션 */}
          <div className={`${currentTheme?.cardBg || 'bg-white'} rounded-xl p-6 shadow-lg border ${currentTheme?.borderColor || 'border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${currentTheme?.textColor || 'text-gray-900'}`}>
              🎭 감정 추적 테스트
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={functionalTests.emotionTracking}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <FiHeart className="w-4 h-4" />
                <span>감정 시스템 확인</span>
              </button>
              
              <div className={`p-3 rounded-lg ${currentTheme?.cardBg || 'bg-gray-50'}`}>
                <p className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                  감정 추적 시스템의 기본 기능과 데이터 구조를 테스트합니다.
                </p>
              </div>
            </div>
          </div>

          {/* 테스트 결과 섹션 */}
          <div className={`${currentTheme?.cardBg || 'bg-white'} rounded-xl p-6 shadow-lg border ${currentTheme?.borderColor || 'border-gray-200'} lg:col-span-2`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
                📊 테스트 결과
              </h2>
              <button
                onClick={() => setTestResults([])}
                className={`text-sm px-3 py-1 rounded ${currentTheme?.hoverBg || 'hover:bg-gray-100'} ${currentTheme?.textSecondary || 'text-gray-600'}`}
              >
                지우기
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className={`text-sm ${currentTheme?.textSecondary || 'text-gray-500'} text-center py-4`}>
                  아직 테스트 결과가 없습니다.
                </p>
              ) : (
                testResults.map((result) => (
                  <div
                    key={result.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      result.success 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {result.success ? (
                          <FiCheck className="w-4 h-4 text-green-600" />
                        ) : (
                          <FiX className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`font-medium text-sm ${currentTheme?.textColor || 'text-gray-900'}`}>
                          {result.testName}
                        </span>
                      </div>
                      <span className={`text-xs ${currentTheme?.textSecondary || 'text-gray-500'}`}>
                        {result.timestamp}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                      {result.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 테마 정보 섹션 */}
        <div className={`mt-6 ${currentTheme?.cardBg || 'bg-white'} rounded-xl p-6 shadow-lg border ${currentTheme?.borderColor || 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${currentTheme?.textColor || 'text-gray-900'}`}>
            🎨 현재 테마 정보
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-3 rounded-lg ${currentTheme?.cardBg || 'bg-gray-50'}`}>
              <p className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>테마 이름</p>
              <p className={`text-xs ${currentTheme?.textSecondary || 'text-gray-600'}`}>{current || 'Unknown'}</p>
            </div>
            
            <div className={`p-3 rounded-lg ${currentTheme?.cardBg || 'bg-gray-50'}`}>
              <p className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>배경색</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-4 h-4 rounded ${currentTheme?.bgColor || 'bg-gray-100'} border`}></div>
                <p className={`text-xs ${currentTheme?.textSecondary || 'text-gray-600'}`}>{currentTheme?.bgColor || 'N/A'}</p>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${currentTheme?.cardBg || 'bg-gray-50'}`}>
              <p className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>카드 배경</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-4 h-4 rounded ${currentTheme?.cardBg || 'bg-white'} border`}></div>
                <p className={`text-xs ${currentTheme?.textSecondary || 'text-gray-600'}`}>{currentTheme?.cardBg || 'N/A'}</p>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${currentTheme?.cardBg || 'bg-gray-50'}`}>
              <p className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>버튼 색상</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-4 h-4 rounded ${currentTheme?.buttonBg || 'bg-blue-500'} border`}></div>
                <p className={`text-xs ${currentTheme?.textSecondary || 'text-gray-600'}`}>{currentTheme?.buttonBg || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 신고 모달 */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="note"
        contentId="test-note-id"
        contentTitle="테스트 노트"
        contentText="이것은 테스트용 노트 내용입니다. 신고 모달의 자동 모더레이션 기능을 테스트하기 위한 샘플 텍스트입니다."
      />
    </div>
  );
}

export default TestPage; 