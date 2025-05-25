import React, { useState, useEffect } from "react";
import ThemedButton from "@/components/ui/ThemedButton"
import ModalOne from "../MainHome/ModalOne";
import { updateUserProfile } from "@/utils/firebaseNoteDataUtil";
import { db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getModalThemeClass } from '@/utils/themeHelper';
import { useSelector } from 'react-redux';
function ProfileActions({ uid }) {
  const [isOpen, setIsOpen] = useState(false);
 const { current, themes } = useSelector((state) => state.theme);
  const modalBgClass = themes[current] ? getModalThemeClass(themes[current]) : "bg-white";
  // 폼 상태
  const [formData, setFormData] = useState({
    birthDate: "",
    favorites: "",
    favoriteQuote: "",
    hobbies: "",
    emotionalTemperature: 36.5,
  });

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
          });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile(uid, formData);
      alert("프로필이 성공적으로 저장되었습니다!");
      setIsOpen(false);
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-2">
      <ThemedButton onClick={() => setIsOpen(true)}>프로필 설정</ThemedButton>

      <ModalOne isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <form onSubmit={handleSubmit} className={`space-y-4 p-4 ${modalBgClass}`}>
          <div>
            <label className="block mb-1 font-semibold">생년월일</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              className="w-full border rounded px-2 py-1"
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
              className="w-full border rounded px-2 py-1"
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
              className="w-full border rounded px-2 py-1"
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
              className="w-full border rounded px-2 py-1"
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
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            저장하기
          </button>
        </form>
      </ModalOne>
    </div>
  );
}

export default ProfileActions;
