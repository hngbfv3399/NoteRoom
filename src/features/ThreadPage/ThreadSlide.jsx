import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiErrorCircle, BiImage } from 'react-icons/bi';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';

dayjs.locale('ko');

function ThreadSlide({ item }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // 날짜 포맷팅
  const formatDate = (date) => {
    if (!date) return '날짜 없음';
    return dayjs(date).format('YYYY년 MM월 DD일');
  };

  // 이미지가 없는 경우를 위한 컴포넌트
  const NoImageDisplay = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/90">
      <BiImage className="text-6xl mb-4 text-gray-400" />
      <p className="text-lg text-gray-500">이미지가 없는 게시글입니다</p>
    </div>
  );

  return (
    <div className="relative min-h-[calc(100vh-128px)] w-full snap-start flex items-center justify-center overflow-hidden">
      {/* 이미지 로딩 상태 */}
      {imageLoading && item.image && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <AiOutlineLoading3Quarters className="text-4xl text-gray-600 animate-spin" />
        </div>
      )}

      {/* 이미지 에러 상태 */}
      {imageError && item.image && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
          <BiErrorCircle className="text-6xl mb-4 text-red-500" />
          <p className="text-lg text-gray-600">이미지를 불러올 수 없습니다</p>
        </div>
      )}

      {/* 이미지가 없는 경우 */}
      {!item.image && <NoImageDisplay />}

      {/* 메인 이미지 */}
      {item.image && !imageError && (
        <img
          src={item.image}
          className={`absolute w-full h-full object-cover transition-opacity duration-300
            ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          alt={item.title ? `노트 이미지: ${item.title}` : "노트 이미지"}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}

      {/* 오버레이 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

      {/* 뒤로가기 버튼 */}
      <motion.button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 bg-black/30 text-white p-3 rounded-full backdrop-blur-sm
          hover:bg-black/50 transition-all z-10"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="홈으로 이동"
      >
        <IoArrowBack className="text-2xl" />
      </motion.button>

      {/* 콘텐츠 영역 */}
      <div className="absolute bottom-6 left-0 w-full p-6 space-y-4">
        {/* 제목 */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg"
        >
          {item.title}
        </motion.h1>

        {/* 메타 정보 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center space-x-4 text-white/80 text-sm sm:text-base"
        >
          <span>{item.author || "익명"}</span>
          <span className="opacity-50">•</span>
          <span>{formatDate(item.createdAt)}</span>
        </motion.div>
      </div>
    </div>
  );
}

export default ThreadSlide;
