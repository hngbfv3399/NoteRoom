/**
 * 노트 작성 페이지 컴포넌트 (UI/UX 개선됨)
 * 
 * 주요 기능:
 * - 현대적이고 직관적인 UI/UX
 * - 테마 시스템 완전 적용
 * - 반응형 디자인
 * - 진행 상태 표시
 * - 자동 저장 기능 (향후 추가)
 * 
 * NOTE: 전체적인 사용자 경험을 개선한 새로운 디자인
 */
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WriteEditer from "@/features/WritePage/WriteEditer";
import { getThemeClass } from '@/utils/themeHelper';

function WritePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  const isEditMode = !!editId;
  
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const themeClass = getThemeClass(currentTheme);

  // 페이지 로딩 애니메이션
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    // 진행률 애니메이션
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 2;
      });
    }, 16);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, []);

  // 로딩 화면
  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${themeClass}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* 로딩 아이콘 */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6"
          >
            <svg
              className={`w-full h-full ${currentTheme?.textColor || 'text-blue-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </motion.div>

          {/* 로딩 텍스트 */}
          <h2 className={`text-2xl font-bold mb-4 ${currentTheme?.textColor || 'text-gray-900'}`}>
            에디터 준비 중...
          </h2>
          
          {/* 진행률 바 */}
          <div className={`w-64 h-2 rounded-full overflow-hidden ${currentTheme?.inputBg || 'bg-gray-200'}`}>
            <motion.div
              className={`h-full rounded-full ${currentTheme?.buttonBg || 'bg-blue-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          
          <p className={`mt-4 text-sm opacity-70 ${currentTheme?.textColor || 'text-gray-600'}`}>
            최고의 글쓰기 경험을 준비하고 있습니다
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClass}`}>
      {/* 헤더 */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`sticky top-0 z-20 backdrop-blur-md border-b ${currentTheme?.modalBgColor || 'bg-white'}/90 ${currentTheme?.inputBorder || 'border-gray-200'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 로고/제목 */}
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className={`p-2 rounded-lg transition-all duration-200 ${currentTheme?.buttonBg || 'bg-gray-100'} ${currentTheme?.buttonText || 'text-gray-700'} ${currentTheme?.buttonHover || 'hover:bg-gray-200'}`}
                aria-label="홈으로 돌아가기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </motion.button>
              
              <div>
                <h1 className={`text-xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {isEditMode ? '노트 수정' : '새 노트 작성'}
                </h1>
                <p className={`text-sm opacity-70 ${currentTheme?.textColor || 'text-gray-600'}`}>
                  {isEditMode ? '기존 노트를 수정해보세요' : '당신의 이야기를 들려주세요'}
                </p>
              </div>
            </div>

            {/* 상태 표시 */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${currentTheme?.buttonBg || 'bg-green-500'}`} />
                <span className={`text-sm opacity-70 ${currentTheme?.textColor || 'text-gray-600'}`}>
                  준비됨
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 메인 에디터 영역 */}
      <motion.main
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="relative"
      >
        <WriteEditer editId={editId} />
      </motion.main>

      {/* 도움말 플로팅 버튼 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        className="fixed bottom-6 right-6 z-30"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowHelpModal(true)}
          className={`w-12 h-12 rounded-full shadow-lg transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} ${currentTheme?.buttonHover || 'hover:shadow-xl'}`}
          title="도움말"
        >
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </motion.button>
      </motion.div>

      {/* 도움말 모달 */}
      <AnimatePresence key="help-modal">
        {showHelpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={() => setShowHelpModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-2xl rounded-2xl overflow-hidden ${currentTheme?.modalBgColor || 'bg-white'} shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className={`p-6 border-b ${currentTheme?.inputBorder || 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">📝</div>
                    <h2 className={`text-xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                      글쓰기 도움말
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className={`p-2 rounded-full transition-colors ${currentTheme?.inputBg || 'hover:bg-gray-100'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 모달 내용 */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-6">
                  {/* 작성 순서 */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                      📋 작성 순서
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'}`}>1</span>
                        <span className={`${currentTheme?.textColor || 'text-gray-700'}`}>제목을 입력하세요 (최대 100자)</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'}`}>2</span>
                        <span className={`${currentTheme?.textColor || 'text-gray-700'}`}>카테고리를 선택하세요</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'}`}>3</span>
                        <span className={`${currentTheme?.textColor || 'text-gray-700'}`}>본문 내용을 작성하세요</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'}`}>4</span>
                        <span className={`${currentTheme?.textColor || 'text-gray-700'}`}>썸네일 이미지를 선택하세요</span>
                      </div>
                    </div>
                  </div>

                  {/* 에디터 기능 */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                      🛠️ 에디터 기능
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold">B</span>
                        <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>굵게</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="italic">I</span>
                        <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>기울임</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="underline">U</span>
                        <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>밑줄</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>📷</span>
                        <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>이미지 삽입</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>🔗</span>
                        <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>링크 추가</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>📝</span>
                        <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>인용구</span>
                      </div>
                    </div>
                  </div>

                  {/* 팁 */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                      💡 작성 팁
                    </h3>
                    <ul className="space-y-2">
                      <li className={`flex items-start space-x-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-sm">제목은 독자의 관심을 끌 수 있도록 구체적으로 작성하세요</span>
                      </li>
                      <li className={`flex items-start space-x-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-sm">이미지는 본문 내용과 관련된 것을 선택하세요</span>
                      </li>
                      <li className={`flex items-start space-x-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-sm">썸네일은 글의 첫인상을 결정하므로 신중히 선택하세요</span>
                      </li>
                      <li className={`flex items-start space-x-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-sm">Ctrl+Z로 실행 취소, Ctrl+Y로 다시 실행할 수 있습니다</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className={`p-6 border-t ${currentTheme?.inputBorder || 'border-gray-200'}`}>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} ${currentTheme?.buttonHover || 'hover:bg-blue-600'}`}
                  >
                    확인
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WritePage;
