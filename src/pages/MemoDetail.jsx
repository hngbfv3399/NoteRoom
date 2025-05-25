// src/pages/MemoDetail.jsx
import React, { useState, useEffect } from "react";
import { FaHeart } from "react-icons/fa";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  increment,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/services/firebase";
import CommentSection from "@/components/CommentSection";

dayjs.extend(utc);
dayjs.extend(timezone);

function MemoDetail({ note, theme = {} }) {
  const [likes, setLikes] = useState(note.likes || 0);
  const [userLiked, setUserLiked] = useState(false);
  const [authorName, setAuthorName] = useState(note.author || "익명");
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchAuthorName = async () => {
      if (note.userUid) {
        try {
          const userDocRef = doc(db, "users", note.userUid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setAuthorName(userDoc.data().displayName || note.author || "익명");
          }
        } catch (error) {
          console.error("작성자 정보 가져오기 실패:", error);
        }
      }
    };
    fetchAuthorName();
  }, [note.userUid, note.author]);

  const checkUserLiked = async () => {
    if (!currentUser) {
      setUserLiked(false);
      return;
    }

    const likeDocRef = doc(db, "notes", note.id, "likesUsers", currentUser.uid);
    const likeDocSnap = await getDoc(likeDocRef);
    setUserLiked(likeDocSnap.exists());
  };

  useEffect(() => {
    checkUserLiked();
  }, [note.id, currentUser]);

  const toggleLike = async () => {
    if (!currentUser) {
      alert("좋아요를 누르려면 로그인이 필요합니다.");
      return;
    }

    const noteRef = doc(db, "notes", note.id);
    const likeDocRef = doc(db, "notes", note.id, "likesUsers", currentUser.uid);

    if (userLiked) {
      await deleteDoc(likeDocRef);
      await updateDoc(noteRef, { likes: increment(-1) });
      setLikes((prev) => prev - 1);
      setUserLiked(false);
    } else {
      await setDoc(likeDocRef, { likedAt: new Date() });
      await updateDoc(noteRef, { likes: increment(1) });
      setLikes((prev) => prev + 1);
      setUserLiked(true);
    }
  };

  return (
    <div
    className={`${theme} max-w-full mx-auto p-4 text-left hide-scrollbar`}
  >
      <h2 className="text-3xl font-semibold mb-4">{note.title}</h2>

      <p className="text-sm mb-6">
        작성자: {authorName} |{" "}
        {dayjs(note.date).tz("Asia/Seoul").format("YYYY-MM-DD HH:mm")}
      </p>

      {note.image && (
        <img
          src={note.image}
          alt={note.title}
          className="w-full h-80 object-cover rounded mb-6"
        />
      )}

      <div
        className="ProseMirror"
        dangerouslySetInnerHTML={{ __html: note.content }}
      />

      <div className="mt-8 text-sm flex justify-between items-center">
        <div className="flex items-center cursor-pointer" onClick={toggleLike}>
          <FaHeart
            size={20}
            color={userLiked ? "#ef4444" : "#9ca3af"}
            className="mr-1 transition-colors"
          />
          <span className="select-none">{likes}</span>
        </div>

        <span>댓글: {note.commentCount || 0}</span>

        <span>조회수: {note.views || 0}</span>
      </div>

      <CommentSection noteId={note.id} theme={theme} />
    </div>
  );
}

export default MemoDetail;
