import React from 'react';
import { categories } from '../utils/editorUtils';
import { 
  FiEdit3, 
  FiMapPin, 
  FiActivity, 
  FiBook, 
  FiBriefcase, 
  FiCoffee, 
  FiFilm, 
  FiMusic, 
  FiBookOpen, 
  FiHeart, 
  FiMoreHorizontal 
} from 'react-icons/fi';

function CategorySelect({ selectedCategory, handleChange }) {
  const categoryIcons = {
    "일상": <FiEdit3 className="w-5 h-5" />,
    "기술": <FiActivity className="w-5 h-5" />,
    "여행": <FiMapPin className="w-5 h-5" />,
    "음식": <FiCoffee className="w-5 h-5" />,
    "영화/드라마": <FiFilm className="w-5 h-5" />,
    "음악": <FiMusic className="w-5 h-5" />,
    "독서": <FiBookOpen className="w-5 h-5" />,
    "취미": <FiHeart className="w-5 h-5" />,
    "기타": <FiMoreHorizontal className="w-5 h-5" />
  };

  return (
    <div className="mb-8">
      <label 
        htmlFor="category-select" 
        className="block font-semibold mb-3"
      >
        카테고리 선택
      </label>
      
      {/* 카테고리 스크롤 목록 */}
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-3 pb-2 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleChange({ target: { value: cat } })}
              className={`flex-shrink-0 p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 min-w-[80px] ${
                selectedCategory === cat
                  ? "border-transparent shadow-lg"
                  : ""
              }`}
            >
              <div className="mb-1 flex justify-center">{categoryIcons[cat]}</div>
              <div className="font-medium text-sm whitespace-nowrap">{cat}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 카테고리 표시 */}
      {selectedCategory && (
        <div className="p-3 rounded-lg mt-4">
          <p className="flex items-center gap-2">
            <span className="font-medium">선택된 카테고리:</span> 
            <span className="flex items-center gap-1">
              {categoryIcons[selectedCategory]} 
              {selectedCategory}
            </span>
          </p>
        </div>
      )}
      
      {!selectedCategory && (
        <p className="opacity-60 mt-4">
          노트의 주제에 맞는 카테고리를 선택해주세요
        </p>
      )}
    </div>
  );
}

export default CategorySelect; 