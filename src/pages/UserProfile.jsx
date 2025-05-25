//src/pages/UserProfile.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getUserDataByUid, loadNotesPage } from "@/utils/firebaseNoteDataUtil"
import ProfileHeader from "@/features/UserProfile/ProfileHeader"
import ProfileInfoCard from "@/features/UserProfile/ProfileInfoCard";
import NoteGrid from "@/features/UserProfile/NoteGrid";
import MemoDetail from "./MemoDetail";
import LoadingPage from "@/components/LoadingPage";
import { getModalThemeClass } from "@/utils/themeHelper";
import { useSelector } from "react-redux";

function UserProfile() {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

const { current, themes } = useSelector((state) => state.theme);
  const modalBgClass = themes[current] ? getModalThemeClass(themes[current]) : "bg-white";

  // 현재 시간 업데이트 로직 최적화
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }));
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // 유저 데이터 페칭 로직
  const fetchUserData = useCallback(async () => {
    if (!userId) {
      setError("유효하지 않은 사용자 ID입니다.");
      setIsLoading(false);
      return;
    }

    try {
      const userFromDB = await getUserDataByUid(userId);
      if (!userFromDB) {
        setError("사용자를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      setUserData({
        displayName: userFromDB.displayName ?? "이름 없음",
        birthDate: userFromDB.birthDate ?? "정보 없음",
        favorites: userFromDB.favorites ?? "정보 없음",
        mood: userFromDB.mood ?? "정보 없음",
        emotionalTemperature: userFromDB.emotionalTemperature ?? 0,
        favoriteQuote: userFromDB.favoriteQuote ?? "정보 없음",
        hobbies: userFromDB.hobbies ?? "정보 없음",
        email: userFromDB.email ?? "",
        noteCount: userFromDB.noteCount ?? 0,
        themeColor: userFromDB.themeColor ?? "defaultThemeColor",
      });
    } catch (error) {
      setError("사용자 데이터를 불러오는 중 오류가 발생했습니다.");
      console.error("유저 데이터 불러오기 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 노트 데이터 페칭 로직
  const fetchNotes = useCallback(async () => {
    try {
      const userNotes = await loadNotesPage(null, 10, userId);
      if (userNotes?.notes) {
        setNotes(userNotes.notes);
      } else {
        setNotes([]);
        console.log("사용자의 노트가 없습니다.");
      }
    } catch (error) {
      console.error("노트 불러오기 실패:", error);
      setError("노트를 불러오는 중 오류가 발생했습니다.");
    }
  }, [userId]);

  useEffect(() => {
    fetchUserData();
    fetchNotes();
  }, [fetchUserData, fetchNotes]);

  const handleOpenModal = useCallback((note) => {
    setSelectedNote(note);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setTimeout(() => setSelectedNote(null), 300);
  }, []);

  if (isLoading) return <LoadingPage />;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen overflow-y-auto">
      <section className="relative min-h-screen px-6 py-10">
        <img
          src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt="배경"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        <ProfileHeader currentTime={currentTime} emotionTemp={userData.emotionalTemperature} />
        <ProfileInfoCard userData={userData} />
      </section>

      <NoteGrid notes={notes} onNoteClick={handleOpenModal} />

      {selectedNote && (
        <Modal
          show={showModal}
          onClose={handleCloseModal}
          note={selectedNote}
          modalBgClass={modalBgClass}
        />
      )}
    </div>
  );
}

// 모달 컴포넌트 분리
// Modal 컴포넌트 수정 예시
const Modal = ({ show, onClose, note, modalBgClass }) => (
  <>
    {/* 오버레이 - 반투명 검정 배경으로 고정 */}
    <div
      className={`fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300  ${modalBgClass}` }
      onClick={onClose}
    />
    {/* 모달 본문 */}
    <div
      className={`fixed left-1/2 top-0 transform -translate-x-1/2
        rounded-lg shadow-lg
        w-[95vw] max-w-[1000px]
        max-h-[70vh] overflow-y-auto p-6 z-50
        transition-transform duration-300 hide-scrollbar
        ${show ? "translate-y-[5vh]" : "-translate-y-full"}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold leading-none"
        onClick={onClose}
        aria-label="Close modal"
      >
        ✕
      </button>
      <MemoDetail note={note} theme={modalBgClass} />
    </div>
  </>
);

export default UserProfile;
