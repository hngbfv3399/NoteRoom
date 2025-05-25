import {
  collection,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  arrayUnion,
  query,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  where
} from "firebase/firestore";
import { auth, db, storage } from "../services/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const addCommentToNote = async (noteId, commentContent) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  if (!commentContent.trim()) throw new Error("댓글 내용을 입력해주세요.");

  // 사용자 문서에서 displayName 가져오기
  const userDocRef = doc(db, "users", currentUser.uid);
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.data();

  const commentData = {
    userUid: currentUser.uid,
    userName: userData?.displayName || currentUser.displayName || "익명",
    content: commentContent.trim(),
    createdAt: new Date(),
  };

  const noteDocRef = doc(db, "notes", noteId);

  try {
    await updateDoc(noteDocRef, {
      comment: arrayUnion(commentData),
      commentCount: increment(1),
    });
  } catch (error) {
    console.error("댓글 추가 실패:", error);
    throw error;
  }
};

export const saveNoteToFirestore = async (noteData) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("사용자가 로그인되어 있지 않습니다.");

  console.log("현재 로그인한 사용자:", {
    uid: currentUser.uid,
    displayName: currentUser.displayName,
    email: currentUser.email
  });

  // noteData에서 불필요한 필드 제거
  const { id: _, ...rest } = noteData;

  // 사용자 문서에서 displayName 가져오기
  const userDocRef = doc(db, "users", currentUser.uid);
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.data();

  const noteWithUserId = {
    ...rest,
    userId: currentUser.uid,
    author: userData?.displayName || currentUser.displayName || "닉네임 없음",
    createdAt: serverTimestamp(),
    views: 0,
    comment: [], // 댓글 배열 초기화
    commentCount: 0, // 댓글 수 초기화
  };


  try {
    const docRef = await addDoc(collection(db, "notes"), noteWithUserId);
    return docRef.id;
  } catch (error) {
    console.error("Firestore 저장 실패:", error);
    throw error;
  }
};

export const loadNotesPage = async (lastVisibleDoc = null, pageSize = 10, userId = null) => {
  const notesCollection = collection(db, "notes");
  let baseQuery = [];

  // 특정 유저의 노트만 필터링
  if (userId) {
    baseQuery.push(where("userId", "==", userId));
  } else {
    baseQuery.push(orderBy("createdAt", "desc"));
  }

  // 페이지네이션
  if (lastVisibleDoc) {
    baseQuery.push(startAfter(lastVisibleDoc));
  }

  // 페이지 크기 제한
  baseQuery.push(limit(pageSize));

  // 쿼리 실행
  const q = query(notesCollection, ...baseQuery);
  
  try {
    const querySnapshot = await getDocs(q);
    const notes = [];
    
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
  
      // Firestore Timestamp를 JavaScript Date 객체로 변환
      if (data.createdAt) {
        if (data.createdAt instanceof Timestamp) {
          data.createdAt = data.createdAt.toDate();
        } else if (typeof data.createdAt.toDate === 'function') {
          data.createdAt = data.createdAt.toDate();
        }
      }

      notes.push({ id: doc.id, ...data });
    }

    // 클라이언트 사이드에서 정렬
    if (userId) {
      notes.sort((a, b) => b.createdAt - a.createdAt);
    }

    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
    return { notes, lastVisible };
    
  } catch (error) {
    console.error("노트 데이터 가져오기 실패:", error);
    if (error.code === 'failed-precondition' || error.message.includes('requires an index')) {
      throw new Error("데이터 구조를 최적화하는 중입니다. 잠시 후 다시 시도해주세요.");
    }
    throw error;
  }
};

// 조회수 증가 함수 (선택사항, 다른 파일에 분리 가능)
export const incrementNoteViews = async (noteId) => {
  const docRef = doc(db, "notes", noteId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error(`문서가 존재하지 않습니다: ${noteId}`);
  }

  await updateDoc(docRef, {
    views: increment(1),
  });
};

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async (
  themeColorFromRedux = "defaultThemeColor"
) => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: user.displayName || "닉네임 없음",
        userId: user.email?.split("@")[0] || "unknownId",
        email: user.email || "",
        themeColor: themeColorFromRedux,
        emotionDistribution: {
          joy: 0,
          sadness: 0,
          anger: 0,
        },
        noteCount: 0,
        totalLikesReceived: 0,
        createdAt: serverTimestamp(),
        emotionalTemperature: 36.5,
        birthDate: "",
        favorites: "",
        favoriteQuote: "",
        hobbies: "",
      });
    } else {
      // 로그인할 때 테마도 업데이트
      await updateDoc(userDocRef, { themeColor: themeColorFromRedux });
    }

    return user;
  } catch (error) {
    console.error("구글 로그인 실패:", error);
    throw error;
  }
};

export const getUserDataByUid = async (uid) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      throw new Error(`유저 문서가 존재하지 않습니다: ${uid}`);
    }

    return userDocSnap.data();
  } catch (error) {
    console.error("유저 데이터 불러오기 실패:", error);
    throw error;
  }
};

export async function updateUserProfile(uid, data) {
  const userDocRef = doc(db, "users", uid);
  await updateDoc(userDocRef, data);
}
export const uploadImageToFirebase = async (file) => {
  if (!file) throw new Error("파일이 없습니다.");

  const storageRef = ref(storage, `noteImages/${file.name}-${Date.now()}`); // 고유 이름
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

export const signOut = async () => {
  try {
    await auth.signOut();
    return true;
  } catch (error) {
    console.error('로그아웃 실패:', error);
    throw error;
  }
};
