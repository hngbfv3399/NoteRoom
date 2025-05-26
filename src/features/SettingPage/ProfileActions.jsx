import React, { useState, useEffect, useMemo } from "react";
import ThemedButton from "@/components/ui/ThemedButton"
import ModalOne from "../MainHome/ModalOne";
import { updateUserProfile, uploadProfileImageToFirebase } from "@/utils/firebaseNoteDataUtil";
import { db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getModalThemeClass } from '@/utils/themeHelper';
import { useSelector } from 'react-redux';

function ProfileActions({ uid }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const modalBgClass = themes[current] ? getModalThemeClass(themes[current]) : "bg-white";
  
  // 입력 필드 클래스 메모이제이션
  const inputClassName = useMemo(() => {
    return `w-full rounded px-2 py-1 ${themes[current]?.inputBg || 'bg-white'} ${themes[current]?.inputText || 'text-gray-800'} ${themes[current]?.inputBorder || 'border border-gray-300'} ${themes[current]?.inputFocus || 'focus:border-blue-500 focus:ring-blue-300'}`;
  }, [themes, current]);

  // 폼 상태
  const [formData, setFormData] = useState({
    birthDate: "",
    favorites: "",
    favoriteQuote: "",
    hobbies: "",
    emotionalTemperature: 36.5,
    profileImage: "",
  });

  // 프로필 이미지 관련 상태
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  // 기본 아바타 옵션들 - 저작권 걱정 없는 이미지들
  const defaultAvatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&backgroundColor=ffd93d',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=ffb3ba',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan&backgroundColor=bae1ff',
  ];

  // 사용자 데이터 불러오기
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            birthDate: userData.birthDate || "",
            favorites: userData.favorites || "",
            favoriteQuote: userData.favoriteQuote || "",
            hobbies: userData.hobbies || "",
            emotionalTemperature: userData.emotionalTemperature || 36.5,
            profileImage: userData.profileImage || "",
          });
          setProfileImagePreview(userData.profileImage || "");
        }
      } catch (error) {
        console.error("사용자 데이터 로딩 실패:", error);
      }
    };

    if (isOpen && uid) {
      fetchUserData();
    }
  }, [isOpen, uid]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 프로필 이미지 파일 선택 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }

      setNewProfileImage(file);
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 기본 아바타 선택 핸들러
  const handleAvatarSelect = (avatarUrl) => {
    setNewProfileImage(null);
    setProfileImagePreview(avatarUrl);
    setFormData(prev => ({ ...prev, profileImage: avatarUrl }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setImageUploadLoading(true);
    
    try {
      let finalProfileImageUrl = formData.profileImage;

      // 새로운 이미지가 업로드된 경우
      if (newProfileImage) {
        try {
          finalProfileImageUrl = await uploadProfileImageToFirebase(newProfileImage, uid);
        } catch (error) {
          console.error('이미지 업로드 실패:', error);
          alert('이미지 업로드 중 오류가 발생했습니다.');
          return;
        }
      }

      // 프로필 업데이트
      await updateUserProfile(uid, {
        ...formData,
        profileImage: finalProfileImageUrl,
      });
      
      alert("프로필이 성공적으로 저장되었습니다!");
      setIsOpen(false);
      
      // 페이지 새로고침으로 변경사항 반영
      window.location.reload();
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setImageUploadLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <ThemedButton onClick={() => setIsOpen(true)}>프로필 설정</ThemedButton>

      <ModalOne isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <form onSubmit={handleSubmit} className={`space-y-4 p-4 ${modalBgClass}`}>
          {/* 프로필 이미지 섹션 */}
          <div className="text-center mb-6">
            <label className="block mb-2 font-semibold">프로필 이미지</label>
            
            {/* 현재 이미지 미리보기 */}
            <div className="mb-4">
              {profileImagePreview ? (
                <img
                  src={profileImagePreview}
                  alt="프로필 미리보기"
                  className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-gray-300"
                />
              ) : (
                <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-100">
                  <span className="text-sm text-gray-500">이미지 없음</span>
                </div>
              )}
            </div>

            {/* 파일 업로드 버튼 */}
            <div className="mb-4">
              <label className={`cursor-pointer inline-flex items-center px-3 py-2 rounded text-sm font-medium transition-colors ${themes[current]?.buttonBg || 'bg-blue-500'} ${themes[current]?.buttonText || 'text-white'} hover:opacity-90`}>
                📷 이미지 변경
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* 기본 아바타 선택 */}
            <div>
              <p className="text-xs mb-2 text-gray-500">또는 기본 아바타 선택</p>
              <div className="grid grid-cols-3 gap-2">
                {defaultAvatars.map((avatar, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAvatarSelect(avatar)}
                    className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                      profileImagePreview === avatar 
                        ? 'border-blue-500 ring-1 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={avatar}
                      alt={`아바타 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-1 font-semibold">생년월일</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">좋아하는 것</label>
            <input
              type="text"
              name="favorites"
              value={formData.favorites}
              onChange={handleInputChange}
              placeholder="예: 공부, 음악감상, 게임"
              className={inputClassName}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">
              좋아하는 명언 및 좌우명
            </label>
            <input
              type="text"
              name="favoriteQuote"
              value={formData.favoriteQuote}
              onChange={handleInputChange}
              placeholder="예: 후회 없는 선택을 하자"
              className={inputClassName}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">취미</label>
            <input
              type="text"
              name="hobbies"
              value={formData.hobbies}
              onChange={handleInputChange}
              placeholder="예: 감성 노트 쓰기, 음악 감상"
              className={inputClassName}
            />
          </div>
          
          <div>
            <label className="block mb-1 font-semibold">
              감정 온도
            </label>
            <input
              type="number"
              name="emotionalTemperature"
              value={formData.emotionalTemperature}
              onChange={handleInputChange}
              placeholder="36.5"
              step="0.1"
              min="0"
              max="100"
              className={inputClassName}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <ThemedButton 
              type="submit" 
              className="flex-1"
              disabled={imageUploadLoading}
            >
              {imageUploadLoading ? '저장 중...' : '저장하기'}
            </ThemedButton>
            <ThemedButton 
              type="button" 
              onClick={() => setIsOpen(false)}
              disabled={imageUploadLoading}
            >
              취소
            </ThemedButton>
          </div>
        </form>
      </ModalOne>
    </div>
  );
}

export default ProfileActions;
