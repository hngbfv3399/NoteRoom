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
  deleteDoc
} from "firebase/firestore";
import { auth, db, storage } from "../services/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createEmotionDistribution, createEmotionTracking } from "./emotionConstants";

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
    // 노트 저장
    const docRef = await addDoc(collection(db, "notes"), noteWithUserId);
    
    // 사용자의 noteCount 증가
    await updateDoc(userDocRef, {
      noteCount: increment(1)
    });
    
    console.log("노트 저장 완료 및 사용자 noteCount 증가:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Firestore 저장 실패:", error);
    throw error;
  }
};

export const loadNotesPage = async (lastVisibleDoc = null, pageSize = 10, userId = null, filterCategory = null, sortType = 'new') => {
  const notesCollection = collection(db, "notes");
  let baseQuery = [];

  // 인덱스 문제를 피하기 위해 모든 노트를 가져온 후 클라이언트에서 필터링
  baseQuery.push(orderBy("createdAt", "desc"));

  // 페이지네이션
  if (lastVisibleDoc) {
    baseQuery.push(startAfter(lastVisibleDoc));
  }

  // 페이지 크기를 늘려서 필터링 후에도 충분한 데이터 확보
  const actualPageSize = userId ? pageSize * 3 : pageSize;
  baseQuery.push(limit(actualPageSize));

  // 쿼리 실행
  const q = query(notesCollection, ...baseQuery);
  
  try {
    const querySnapshot = await getDocs(q);
    let notes = [];
    
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

    // 클라이언트 사이드에서 userId 필터링
    if (userId) {
      notes = notes.filter(note => note.userId === userId);
      // 원하는 페이지 크기로 제한
      notes = notes.slice(0, pageSize);
    }

    // 클라이언트 사이드에서 카테고리 필터링
    if (filterCategory && filterCategory !== "전체") {
      notes = notes.filter(note => note.category === filterCategory);
    }

    // 클라이언트 사이드에서 정렬 처리
    if (sortType === 'hot') {
      // 인기순: 조회수, 좋아요, 댓글 수를 종합적으로 고려
      notes.sort((a, b) => {
        // 각 지표별 가중치 설정
        const weights = {
          views: 1,
          likes: 2,
          comments: 3
        };

        // 노트별 점수 계산
        const getScore = (note) => {
          const viewScore = (note.views || 0) * weights.views;
          const likeScore = (note.likes || 0) * weights.likes;
          const commentScore = (note.commentCount || 0) * weights.comments;
          return viewScore + likeScore + commentScore;
        };

        const aScore = getScore(a);
        const bScore = getScore(b);
        
        if (aScore !== bScore) {
          return bScore - aScore; // 점수 내림차순
        }
        return b.createdAt - a.createdAt; // 점수가 같으면 최신순
      });
    }
    // 최신순은 이미 서버에서 정렬되어 있음

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

  try {
    await updateDoc(docRef, {
      views: increment(1),
    });
  } catch (error) {
    console.error("조회수 증가 실패:", error);
    throw error;
  }
};

// 특정 노트 ID로 노트 데이터 가져오기
export const getNoteById = async (noteId) => {
  try {
    const docRef = doc(db, "notes", noteId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("노트를 찾을 수 없습니다.");
    }

    const data = docSnap.data();
    
    // Firestore Timestamp를 JavaScript Date 객체로 변환
    if (data.createdAt) {
      if (data.createdAt instanceof Timestamp) {
        data.createdAt = data.createdAt.toDate();
      } else if (typeof data.createdAt.toDate === 'function') {
        data.createdAt = data.createdAt.toDate();
      }
    }

    return { id: docSnap.id, ...data };
  } catch (error) {
    console.error("노트 가져오기 실패:", error);
    throw error;
  }
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
        profileImage: user.photoURL || "", // Google 프로필 이미지 또는 빈 문자열
        themeColor: themeColorFromRedux,
        emotionDistribution: createEmotionDistribution(),
        emotionTracking: createEmotionTracking(),
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

// 프로필 이미지 업로드 함수 추가
export const uploadProfileImageToFirebase = async (file, userId) => {
  if (!file) throw new Error("파일이 없습니다.");
  
  // 프로필 이미지는 별도 폴더에 저장
  const storageRef = ref(storage, `profiles/${userId}/profile-${Date.now()}`);
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

// 사용자의 실제 노트 수를 계산하여 noteCount 업데이트
export const updateUserNoteCount = async (userId) => {
  try {
    // 해당 사용자가 작성한 노트 수 계산
    const notesQuery = query(
      collection(db, "notes"),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(notesQuery);
    const userNotes = querySnapshot.docs.filter(doc => doc.data().userId === userId);
    const actualNoteCount = userNotes.length;
    
    // 사용자 문서의 noteCount 업데이트
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      noteCount: actualNoteCount
    });
    
    return actualNoteCount;
  } catch (error) {
    console.error('noteCount 업데이트 실패:', error);
    throw error;
  }
};

// 노트 삭제 함수
export const deleteNoteFromFirestore = async (noteId, userId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("로그인이 필요합니다.");
  }

  if (currentUser.uid !== userId) {
    throw new Error("본인의 노트만 삭제할 수 있습니다.");
  }

  try {
    // 노트 문서 삭제
    const noteDocRef = doc(db, "notes", noteId);
    await deleteDoc(noteDocRef);
    
    // 사용자의 noteCount 감소
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      noteCount: increment(-1)
    });
    
    console.log("노트 삭제 완료 및 사용자 noteCount 감소:", noteId);
    return true;
  } catch (error) {
    console.error("노트 삭제 실패:", error);
    throw error;
  }
};

// 노트 업데이트 함수
export const updateNoteInFirestore = async (noteId, updateData) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("로그인이 필요합니다.");
  }

  try {
    // 먼저 노트가 존재하고 현재 사용자의 노트인지 확인
    const noteDocRef = doc(db, "notes", noteId);
    const noteDoc = await getDoc(noteDocRef);
    
    if (!noteDoc.exists()) {
      throw new Error("노트를 찾을 수 없습니다.");
    }
    
    const noteData = noteDoc.data();
    if (noteData.userId !== currentUser.uid) {
      throw new Error("본인의 노트만 수정할 수 있습니다.");
    }
    
    // 수정 시간 추가
    const updateDataWithTimestamp = {
      ...updateData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(noteDocRef, updateDataWithTimestamp);
    console.log("노트 업데이트 완료:", noteId);
    return true;
  } catch (error) {
    console.error("노트 업데이트 실패:", error);
    throw error;
  }
};
