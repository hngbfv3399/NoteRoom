/**
 * 프로필 정보 카드 컴포넌트
 * 
 * 주요 기능:
 * - 사용자 기본 정보 표시
 * - 현재 시간 실시간 표시
 * - 최근 감정 상태 표시 및 업데이트
 * - 테마 시스템 적용
 * - 반응형 디자인
 * - 애니메이션 효과
 * 
 * NOTE: 사용자 정보가 없을 때 기본값 표시
 * TODO: 정보 편집 기능 추가, 아바타 이미지 지원
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import { EMOTION_META } from '@/utils/emotionConstants';

function ProfileInfoCard({ userData, currentTime, onOpenEmotionModal }) {
  const [recentEmotion, setRecentEmotion] = useState(null);
  const [loading, setLoading] = useState(true);

  // 최근 감정 데이터 로딩
  useEffect(() => {
    const loadRecentEmotion = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const dailyEmotions = data.emotionTracking?.dailyEmotions || [];
          
          if (dailyEmotions.length > 0) {
            // 가장 최근 감정 가져오기
            const latest = dailyEmotions.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            setRecentEmotion(latest);
          }
        }
      } catch (error) {
        console.error('최근 감정 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentEmotion();
  }, []);

  // 최근 감정 표시 텍스트 생성
  const getRecentEmotionDisplay = () => {
    if (loading) return "감정 로딩 중...";
    
    // 감정 추적 시스템의 최근 감정이 있는 경우
    if (recentEmotion) {
      const emotionMeta = EMOTION_META[recentEmotion.emotion];
      if (emotionMeta) {
        const daysDiff = Math.floor((new Date() - new Date(recentEmotion.date)) / (1000 * 60 * 60 * 24));
        const timeText = daysDiff === 0 ? "오늘" : daysDiff === 1 ? "어제" : `${daysDiff}일 전`;
        return `${emotionMeta.emoji} ${emotionMeta.name} (${timeText})`;
      }
    }
    
    // 기존 mood 필드가 있는 경우
    if (userData.mood && userData.mood !== "정보 없음") {
      return userData.mood;
    }
    
    return "아직 기록 없음";
  };

  // 정보 항목 데이터
  const infoItems = [
    { 
      icon: "🎂", 
      label: "생년월일", 
      value: userData.birthDate || "정보 없음",
      ariaLabel: "생년월일 정보"
    },
    { 
      icon: "❤️", 
      label: "좋아하는 것", 
      value: userData.favorites || "정보 없음",
      ariaLabel: "좋아하는 것 정보"
    },
    { 
      icon: "😊", 
      label: "최근 기분", 
      value: getRecentEmotionDisplay(),
      ariaLabel: "최근 기분 상태",
      clickable: true,
      onClick: onOpenEmotionModal
    },
    { 
      icon: "📧", 
      label: "이메일", 
      value: userData.email || "정보 없음",
      ariaLabel: "이메일 정보"
    }
  ];

  const additionalInfo = [
    {
      icon: "✨",
      label: "좋아하는 명언",
      value: userData.favoriteQuote || "정보 없음",
      ariaLabel: "좋아하는 명언"
    },
    {
      icon: "🌱",
      label: "취미",
      value: userData.hobbies || "정보 없음",
      ariaLabel: "취미 정보"
    }
  ];

  // 애니메이션 variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  // 기본 아바타 생성 함수 (DiceBear API 사용)
  const getDefaultAvatar = (name) => {
    const seed = name || 'default';
    const colors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd93d', 'ffb3ba', 'bae1ff'];
    const randomColor = colors[Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length];
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${randomColor}`;
  };

  return (
    <motion.div 
      className="w-full max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 메인 정보 카드 */}
      <motion.div 
        className="backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 bg-black/20"
        variants={itemVariants}
      >
        {/* 상단 섹션: 시간과 이름 */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          {/* 현재 시간 섹션 */}
          <motion.div 
            className="text-center lg:text-left mb-4 lg:mb-0"
            variants={itemVariants}
          >
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold drop-shadow-lg mb-1 text-white">
              {currentTime}
            </p>
            <p className="text-xs opacity-80 text-white/80">
              현재 시간
            </p>
          </motion.div>

          {/* 사용자 이름 */}
          <motion.h1 
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold drop-shadow-lg text-center lg:text-right text-white"
            variants={itemVariants}
          >
            {userData.displayName || "이름 없음"}
          </motion.h1>
        </div>

        {/* 중앙 섹션: 프로필 이미지 */}
        <div className="flex justify-center mb-6">
          <motion.div 
            className="flex justify-center"
            variants={itemVariants}
          >
            <img
              src={userData.profileImage || getDefaultAvatar(userData.displayName)}
              alt={`${userData.displayName}의 프로필`}
              className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full object-cover border-4 border-white/50 shadow-lg"
              onError={(e) => {
                // 이미지 로드 실패 시 기본 아바타로 대체
                e.target.src = getDefaultAvatar(userData.displayName);
              }}
            />
          </motion.div>
        </div>

        {/* 정보 그리드 - 모바일 최적화 */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6"
          variants={itemVariants}
        >
          {infoItems.map((item, index) => (
            <motion.div
              key={index}
              className={`p-3 rounded-lg backdrop-blur-sm border border-white/10 bg-white/10 ${
                item.clickable ? 'cursor-pointer hover:bg-white/20 transition-all duration-200' : ''
              }`}
              variants={itemVariants}
              whileHover={{ scale: item.clickable ? 1.02 : 1.0 }}
              transition={{ type: "spring", stiffness: 300 }}
              onClick={item.onClick}
            >
              <div className="flex items-center space-x-2">
                <span 
                  className="text-lg sm:text-xl" 
                  role="img" 
                  aria-label={item.ariaLabel}
                >
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium opacity-80 text-white/80">
                    {item.label}
                    {item.clickable && (
                      <span className="ml-1 text-xs opacity-60">(클릭하여 기록)</span>
                    )}
                  </p>
                  <p className="text-sm sm:text-base font-semibold truncate text-white">
                    {item.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 추가 정보 섹션 */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-6"
          variants={itemVariants}
        >
          {additionalInfo.map((item, index) => (
            <motion.div
              key={index}
              className="p-3 sm:p-4 rounded-lg backdrop-blur-sm border border-white/10 bg-white/10"
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start space-x-3">
                <span 
                  className="text-base sm:text-lg mt-0.5" 
                  role="img" 
                  aria-label={item.ariaLabel}
                >
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium opacity-80 mb-1 text-white/80">
                    {item.label}
                  </p>
                  <p className="text-sm leading-relaxed text-white">
                    {item.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 통계 정보 */}
        {userData.noteCount !== undefined && (
          <motion.div 
            className="p-3 sm:p-4 rounded-lg text-center backdrop-blur-sm border border-white/10 bg-white/10"
            variants={itemVariants}
          >
            <p className="text-xl sm:text-2xl font-bold text-white">
              {userData.noteCount}
            </p>
            <p className="text-xs sm:text-sm opacity-80 text-white/80">
              작성한 노트
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

ProfileInfoCard.propTypes = {
  userData: PropTypes.shape({
    displayName: PropTypes.string,
    birthDate: PropTypes.string,
    favorites: PropTypes.string,
    mood: PropTypes.string,
    favoriteQuote: PropTypes.string,
    hobbies: PropTypes.string,
    noteCount: PropTypes.number,
    profileImage: PropTypes.string,
    email: PropTypes.string,
  }).isRequired,
  currentTime: PropTypes.string.isRequired,
  onOpenEmotionModal: PropTypes.func,
};

export default ProfileInfoCard;
