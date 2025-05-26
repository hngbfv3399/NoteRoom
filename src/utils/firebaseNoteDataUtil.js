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
import { createCommentNotification, createNewNoteNotification } from "./notificationUtils";

export const addCommentToNote = async (noteId, commentContent) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  if (!commentContent.trim()) throw new Error("댓글 내용을 입력해주세요.");

  // 사용자 문서에서 displayName 가져오기
  const userDocRef = doc(db, "users", currentUser.uid);
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.data();

  // 노트 정보 가져오기 (알림을 위해)
  const noteDocRef = doc(db, "notes", noteId);
  const noteDoc = await getDoc(noteDocRef);
  const noteData = noteDoc.data();

  if (!noteData) {
    throw new Error("노트를 찾을 수 없습니다.");
  }

  const commentData = {
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 고유 ID 생성
    userUid: currentUser.uid,
    userName: userData?.displayName || currentUser.displayName || "익명",
    content: commentContent.trim(),
    createdAt: new Date(),
    replies: [], // 대댓글 배열 추가
    replyCount: 0, // 대댓글 수 추가
  };

  try {
    // 댓글 추가
    await updateDoc(noteDocRef, {
      comment: arrayUnion(commentData),
      commentCount: increment(1),
    });

    // 알림 생성 (노트 작성자에게)
    try {
      await createCommentNotification(
        noteId,
        noteData.userUid || noteData.userId, // 노트 작성자 ID
        currentUser.uid, // 댓글 작성자 ID
        commentContent.trim()
      );
    } catch (notificationError) {
      console.warn("댓글 알림 생성 실패:", notificationError);
      // 알림 생성 실패해도 댓글 작성은 성공으로 처리
      // 토스트 알림은 createCommentNotification 내부에서 처리됨
    }
  } catch (error) {
    console.error("댓글 추가 실패:", error);
    // 토스트 알림 표시
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast('댓글 작성에 실패했습니다. 다시 시도해주세요.', 'error');
    }
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
    
    // 구독자들에게 새 노트 알림 생성
    try {
      await createNewNoteNotification(
        docRef.id,
        currentUser.uid,
        noteData.title,
        noteData.content
      );
    } catch (notificationError) {
      console.warn("새 노트 알림 생성 실패:", notificationError);
      // 알림 생성 실패해도 노트 작성은 성공으로 처리
      // 토스트 알림은 createNewNoteNotification 내부에서 처리됨
    }
    
    console.log("노트 저장 완료 및 사용자 noteCount 증가:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Firestore 저장 실패:", error);
    // 토스트 알림 표시
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast('노트 저장에 실패했습니다. 다시 시도해주세요.', 'error');
    }
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

  // 사용자 인증 확인
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  // 파일 보안 검증
  // 파일 크기 검증 (5MB 제한)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("이미지 크기는 5MB를 초과할 수 없습니다.");
  }

  // 파일 타입 검증 (MIME 타입과 확장자 이중 검증)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("지원하지 않는 파일 형식입니다. (JPG, PNG, GIF, WebP만 허용)");
  }

  // 파일 확장자 검증
  const fileName = file.name.toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    throw new Error("허용되지 않는 파일 확장자입니다.");
  }

  // 파일명 보안 검증 (경로 순회 공격 방지)
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    throw new Error("유효하지 않은 파일명입니다.");
  }

  // 안전한 파일명 생성 (특수문자 제거)
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const uniqueFileName = `${safeFileName}-${timestamp}`;

  try {
    const storageRef = ref(storage, `noteImages/${uniqueFileName}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("이미지 업로드 실패:", error);
    
    // 사용자 친화적인 오류 메시지
    if (error.code === 'storage/unauthorized') {
      throw new Error("이미지 업로드 권한이 없습니다. 로그인 상태를 확인해주세요.");
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error("저장 공간이 부족합니다.");
    } else if (error.code === 'storage/invalid-format') {
      throw new Error("지원하지 않는 이미지 형식입니다.");
    }
    
    throw new Error("이미지 업로드에 실패했습니다.");
  }
};

// 프로필 이미지 업로드 함수 추가
export const uploadProfileImageToFirebase = async (file, userId) => {
  if (!file) throw new Error("파일이 없습니다.");
  
  // 사용자 인증 확인
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  
  // 본인의 프로필만 업데이트 가능
  if (currentUser.uid !== userId) {
    throw new Error("본인의 프로필만 수정할 수 있습니다.");
  }

  // 파일 보안 검증
  // 파일 크기 검증 (5MB 제한)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("이미지 크기는 5MB를 초과할 수 없습니다.");
  }

  // 파일 타입 검증 (MIME 타입과 확장자 이중 검증)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("지원하지 않는 파일 형식입니다. (JPG, PNG, GIF, WebP만 허용)");
  }

  // 파일 확장자 검증
  const fileName = file.name.toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    throw new Error("허용되지 않는 파일 확장자입니다.");
  }

  // 파일명 보안 검증 (경로 순회 공격 방지)
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    throw new Error("유효하지 않은 파일명입니다.");
  }

  // 안전한 파일명 생성 (특수문자 제거)
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const uniqueFileName = `profile-${timestamp}-${safeFileName}`;

  try {
    // 프로필 이미지는 별도 폴더에 저장
    const storageRef = ref(storage, `profiles/${userId}/${uniqueFileName}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("프로필 이미지 업로드 실패:", error);
    
    // 사용자 친화적인 오류 메시지
    if (error.code === 'storage/unauthorized') {
      throw new Error("이미지 업로드 권한이 없습니다. 로그인 상태를 확인해주세요.");
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error("저장 공간이 부족합니다.");
    } else if (error.code === 'storage/invalid-format') {
      throw new Error("지원하지 않는 이미지 형식입니다.");
    }
    
    throw new Error("프로필 이미지 업로드에 실패했습니다.");
  }
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

// 대댓글 추가 함수
export const addReplyToComment = async (noteId, commentId, replyContent) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  if (!replyContent.trim()) throw new Error("답글 내용을 입력해주세요.");

  // 사용자 문서에서 displayName 가져오기
  const userDocRef = doc(db, "users", currentUser.uid);
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.data();

  // 노트 정보 가져오기
  const noteDocRef = doc(db, "notes", noteId);
  const noteDoc = await getDoc(noteDocRef);
  const noteData = noteDoc.data();

  if (!noteData) {
    throw new Error("노트를 찾을 수 없습니다.");
  }

  // 해당 댓글 찾기
  const comments = noteData.comment || [];
  const commentIndex = comments.findIndex(comment => comment.id === commentId);
  
  if (commentIndex === -1) {
    throw new Error("댓글을 찾을 수 없습니다.");
  }

  const targetComment = comments[commentIndex];
  
  const replyData = {
    id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 고유 ID 생성
    userUid: currentUser.uid,
    userName: userData?.displayName || currentUser.displayName || "익명",
    content: replyContent.trim(),
    createdAt: new Date(),
  };

  try {
    // 댓글 배열 업데이트
    const updatedComments = [...comments];
    if (!updatedComments[commentIndex].replies) {
      updatedComments[commentIndex].replies = [];
    }
    updatedComments[commentIndex].replies.push(replyData);
    updatedComments[commentIndex].replyCount = (updatedComments[commentIndex].replyCount || 0) + 1;

    // Firestore 업데이트
    await updateDoc(noteDocRef, {
      comment: updatedComments,
    });

    // 대댓글 알림 생성 (댓글 작성자에게)
    try {
      const { createReplyNotification } = await import('./notificationUtils');
      await createReplyNotification(
        commentId,
        targetComment.userUid, // 댓글 작성자 ID
        currentUser.uid, // 대댓글 작성자 ID
        replyContent.trim(),
        noteId // 노트 ID 추가
      );
    } catch (notificationError) {
      console.warn("대댓글 알림 생성 실패:", notificationError);
      // 알림 생성 실패해도 대댓글 작성은 성공으로 처리
    }
  } catch (error) {
    console.error("대댓글 추가 실패:", error);
    // 토스트 알림 표시
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast('답글 작성에 실패했습니다. 다시 시도해주세요.', 'error');
    }
    throw error;
  }
};
