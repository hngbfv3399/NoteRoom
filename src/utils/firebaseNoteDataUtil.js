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
  deleteDoc,
  where
} from "firebase/firestore";
import { auth, db, storage } from "../services/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createEmotionDistribution, createEmotionTracking } from "./emotionConstants";
import { createCommentNotification, createNewNoteNotification, extractMentions, createMentionNotification } from "./notificationUtils";

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

    // 멘션 처리
    try {
      const mentions = extractMentions(commentContent.trim());
      if (mentions.length > 0) {
        // 멘션된 사용자들의 ID 찾기
        for (const mentionedUsername of mentions) {
          try {
            // 사용자명으로 사용자 찾기
            const usersQuery = query(
              collection(db, 'users'),
              where('displayName', '==', mentionedUsername),
              limit(1)
            );
            const usersSnapshot = await getDocs(usersQuery);
            
            if (!usersSnapshot.empty) {
              const mentionedUserDoc = usersSnapshot.docs[0];
              const mentionedUserId = mentionedUserDoc.id;
              
              // 자신을 멘션한 경우나 노트 작성자를 멘션한 경우는 제외 (이미 다른 알림이 있음)
              if (mentionedUserId !== currentUser.uid && mentionedUserId !== (noteData.userUid || noteData.userId)) {
                await createMentionNotification(
                  noteId,
                  'note',
                  mentionedUserId,
                  currentUser.uid,
                  commentContent.trim()
                );
              }
            }
          } catch (mentionError) {
            console.warn(`멘션 처리 실패 (@${mentionedUsername}):`, mentionError);
          }
        }
      }
    } catch (mentionError) {
      console.warn("멘션 처리 실패:", mentionError);
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
    userUid: currentUser.uid,
    author: userData?.displayName || currentUser.displayName || "닉네임 없음",
    createdAt: serverTimestamp(),
    views: 0,
    likes: 0,
    comment: [], // 댓글 배열 초기화
    commentCount: 0, // 댓글 수 초기화
  };

  // 디버깅: 실제 저장될 데이터 로그
  console.log("=== 저장될 노트 데이터 ===");
  console.log("noteWithUserId:", JSON.stringify(noteWithUserId, null, 2));
  console.log("필드 목록:", Object.keys(noteWithUserId));
  console.log("필수 필드 확인:");
  console.log("- userUid:", noteWithUserId.userUid);
  console.log("- title:", noteWithUserId.title);
  console.log("- content:", noteWithUserId.content);
  console.log("- category:", noteWithUserId.category);
  console.log("- likes:", noteWithUserId.likes);
  console.log("- views:", noteWithUserId.views);
  console.log("- commentCount:", noteWithUserId.commentCount);

  try {
    // 노트 저장
    const docRef = await addDoc(collection(db, "notes"), noteWithUserId);
    
    // 사용자의 noteCount 증가
    await updateDoc(userDocRef, {
      noteCount: increment(1)
    });
    
    // 새 노트 알림 생성 (구독자들에게)
    try {
      await createNewNoteNotification(
        docRef.id,
        currentUser.uid,
        noteWithUserId.title,
        noteWithUserId.content
      );
    } catch (notificationError) {
      console.warn("새 노트 알림 생성 실패:", notificationError);
      // 알림 생성 실패해도 노트 작성은 성공으로 처리
    }

    // 멘션 처리 (노트 내용에서)
    try {
      const mentions = extractMentions(noteWithUserId.content);
      if (mentions.length > 0) {
        // 멘션된 사용자들의 ID 찾기
        for (const mentionedUsername of mentions) {
          try {
            // 사용자명으로 사용자 찾기
            const usersQuery = query(
              collection(db, 'users'),
              where('displayName', '==', mentionedUsername),
              limit(1)
            );
            const usersSnapshot = await getDocs(usersQuery);
            
            if (!usersSnapshot.empty) {
              const mentionedUserDoc = usersSnapshot.docs[0];
              const mentionedUserId = mentionedUserDoc.id;
              
              // 자신을 멘션한 경우는 제외
              if (mentionedUserId !== currentUser.uid) {
                await createMentionNotification(
                  docRef.id,
                  'note',
                  mentionedUserId,
                  currentUser.uid,
                  noteWithUserId.content
                );
              }
            }
          } catch (mentionError) {
            console.warn(`멘션 처리 실패 (@${mentionedUsername}):`, mentionError);
          }
        }
      }
    } catch (mentionError) {
      console.warn("멘션 처리 실패:", mentionError);
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
      notes = notes.filter(note => note.userUid === userId || note.userId === userId); // 기존 데이터 호환성을 위해 둘 다 확인
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

// 조회수 증가 함수 (누락된 필드 자동 보완 포함)
export const incrementNoteViews = async (noteId) => {
  const docRef = doc(db, "notes", noteId);
  
  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`문서가 존재하지 않습니다: ${noteId}`);
    }

    const data = docSnap.data();
    const updates = {};

    // 누락된 필드들 자동 보완
    if (typeof data.views !== 'number') {
      updates.views = 1; // 첫 조회
      console.log(`노트 ${noteId}: views 필드 초기화`);
    } else {
      updates.views = increment(1);
    }

    // 다른 필수 필드들도 누락되어 있으면 보완
    if (typeof data.likes !== 'number') {
      updates.likes = 0;
      console.log(`노트 ${noteId}: likes 필드 초기화`);
    }

    if (typeof data.commentCount !== 'number') {
      // 기존 comment 배열이 있으면 그 길이를, 없으면 0
      const commentCount = Array.isArray(data.comment) ? data.comment.length : 0;
      updates.commentCount = commentCount;
      console.log(`노트 ${noteId}: commentCount 필드 초기화 (${commentCount})`);
    }

    // userUid 필드 통일 (userId가 있고 userUid가 없는 경우)
    if (!data.userUid && data.userId) {
      updates.userUid = data.userId;
      console.log(`노트 ${noteId}: userUid 필드 추가`);
    }

    await updateDoc(docRef, updates);
    console.log(`노트 ${noteId} 조회수 증가 및 필드 보완 완료`);
    
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

  // 파일 보안 검증 강화
  // 1. 파일 크기 검증 (5MB 제한)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("이미지 크기는 5MB를 초과할 수 없습니다.");
  }

  // 2. 파일 타입 검증 (MIME 타입과 확장자 이중 검증)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("지원하지 않는 파일 형식입니다. (JPG, PNG, GIF, WebP만 허용)");
  }

  // 3. 파일 확장자 검증
  const fileName = file.name.toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    throw new Error("허용되지 않는 파일 확장자입니다.");
  }

  // 4. 파일명 보안 검증 (경로 순회 공격 방지)
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    throw new Error("유효하지 않은 파일명입니다.");
  }

  // 5. 파일 헤더 검증 (매직 넘버 확인)
  const fileHeader = await readFileHeader(file);
  if (!isValidImageHeader(fileHeader, file.type)) {
    throw new Error("파일 형식이 올바르지 않습니다. 실제 이미지 파일을 업로드해주세요.");
  }

  // 6. 파일 내용 크기 검증 (빈 파일 방지)
  if (file.size < 100) { // 100바이트 미만은 유효한 이미지가 아님
    throw new Error("파일이 너무 작습니다. 유효한 이미지를 업로드해주세요.");
  }

  // 7. 안전한 파일명 생성 (특수문자 제거 및 정규화)
  const safeFileName = sanitizeFileName(file.name);
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const uniqueFileName = `${timestamp}_${randomString}_${safeFileName}`;

  try {
    const storageRef = ref(storage, `notes/${currentUser.uid}/${uniqueFileName}`);
    
    // 메타데이터 설정 (보안 강화)
    const metadata = {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000', // 1년 캐시
      customMetadata: {
        uploadedBy: currentUser.uid,
        uploadedAt: new Date().toISOString(),
        originalName: file.name.substring(0, 100) // 원본 파일명 길이 제한
      }
    };

    await uploadBytes(storageRef, file, metadata);
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
    } else if (error.code === 'storage/retry-limit-exceeded') {
      throw new Error("업로드 재시도 한도를 초과했습니다. 잠시 후 다시 시도해주세요.");
    }
    
    throw new Error("이미지 업로드에 실패했습니다.");
  }
};

// 파일 헤더 읽기 함수
const readFileHeader = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const uint8Array = new Uint8Array(arrayBuffer);
      resolve(uint8Array);
    };
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsArrayBuffer(file.slice(0, 12)); // 처음 12바이트만 읽기
  });
};

// 이미지 헤더 검증 함수 (매직 넘버 확인)
const isValidImageHeader = (header, mimeType) => {
  const headerHex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join('');
  
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return headerHex.startsWith('ffd8ff'); // JPEG 매직 넘버
    case 'image/png':
      return headerHex.startsWith('89504e47'); // PNG 매직 넘버
    case 'image/gif':
      return headerHex.startsWith('474946'); // GIF 매직 넘버
    case 'image/webp':
      return headerHex.includes('57454250'); // WebP 매직 넘버 (RIFF 컨테이너 내)
    default:
      return false;
  }
};

// 파일명 정규화 함수
const sanitizeFileName = (fileName) => {
  // 1. 확장자 분리
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
  
  // 2. 파일명 정규화 (특수문자 제거, 공백을 언더스코어로 변경)
  const sanitizedName = name
    .replace(/[^a-zA-Z0-9가-힣\s.-]/g, '') // 허용된 문자만 유지
    .replace(/\s+/g, '_') // 공백을 언더스코어로 변경
    .replace(/_{2,}/g, '_') // 연속된 언더스코어 제거
    .substring(0, 50); // 파일명 길이 제한
  
  // 3. 빈 파일명 방지
  const finalName = sanitizedName || 'image';
  
  return finalName + extension.toLowerCase();
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

  // 파일 보안 검증 강화
  // 1. 파일 크기 검증 (5MB 제한)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("이미지 크기는 5MB를 초과할 수 없습니다.");
  }

  // 2. 파일 타입 검증 (MIME 타입과 확장자 이중 검증)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("지원하지 않는 파일 형식입니다. (JPG, PNG, GIF, WebP만 허용)");
  }

  // 3. 파일 확장자 검증
  const fileName = file.name.toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    throw new Error("허용되지 않는 파일 확장자입니다.");
  }

  // 4. 파일명 보안 검증 (경로 순회 공격 방지)
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    throw new Error("유효하지 않은 파일명입니다.");
  }

  // 5. 파일 헤더 검증 (매직 넘버 확인)
  const fileHeader = await readFileHeader(file);
  if (!isValidImageHeader(fileHeader, file.type)) {
    throw new Error("파일 형식이 올바르지 않습니다. 실제 이미지 파일을 업로드해주세요.");
  }

  // 6. 파일 내용 크기 검증 (빈 파일 방지)
  if (file.size < 100) { // 100바이트 미만은 유효한 이미지가 아님
    throw new Error("파일이 너무 작습니다. 유효한 이미지를 업로드해주세요.");
  }

  // 7. 안전한 파일명 생성 (특수문자 제거 및 정규화)
  const safeFileName = sanitizeFileName(file.name);
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const uniqueFileName = `profile-${timestamp}-${randomString}-${safeFileName}`;

  try {
    // 프로필 이미지는 별도 폴더에 저장
    const storageRef = ref(storage, `profiles/${userId}/${uniqueFileName}`);
    
    // 메타데이터 설정 (보안 강화)
    const metadata = {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000', // 1년 캐시
      customMetadata: {
        uploadedBy: currentUser.uid,
        uploadedAt: new Date().toISOString(),
        originalName: file.name.substring(0, 100), // 원본 파일명 길이 제한
        imageType: 'profile'
      }
    };

    await uploadBytes(storageRef, file, metadata);
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
    } else if (error.code === 'storage/retry-limit-exceeded') {
      throw new Error("업로드 재시도 한도를 초과했습니다. 잠시 후 다시 시도해주세요.");
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
    const userNotes = querySnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.userUid === userId || data.userId === userId; // 기존 데이터 호환성을 위해 둘 다 확인
    });
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

  console.log("=== 노트 업데이트 디버깅 ===");
  console.log("noteId:", noteId);
  console.log("currentUser.uid:", currentUser.uid);
  console.log("원본 updateData:", JSON.stringify(updateData, null, 2));
  
  // content 필드 특별 디버깅
  if (updateData.content) {
    console.log("=== CONTENT 디버깅 ===");
    console.log("content 타입:", typeof updateData.content);
    console.log("content 길이:", updateData.content.length);
    console.log("content 내용:", updateData.content);
    console.log("content가 빈 문자열인가?", updateData.content === "");
    console.log("content가 <p></p>인가?", updateData.content === "<p></p>");
    console.log("content 트림 후:", updateData.content.trim());
  }

  try {
    // 먼저 노트가 존재하고 현재 사용자의 노트인지 확인
    const noteDocRef = doc(db, "notes", noteId);
    const noteDoc = await getDoc(noteDocRef);
    
    if (!noteDoc.exists()) {
      throw new Error("노트를 찾을 수 없습니다.");
    }
    
    const noteData = noteDoc.data();
    console.log("기존 노트 데이터:", JSON.stringify(noteData, null, 2));
    console.log("기존 노트의 userUid:", noteData.userUid);
    console.log("기존 노트의 userId:", noteData.userId);
    console.log("기존 노트의 content:", noteData.content);
    
    // userUid 필드로 확인 (Firestore 규칙과 일치)
    if (noteData.userUid !== currentUser.uid && noteData.userId !== currentUser.uid) {
      console.error("권한 오류: 노트 소유자가 아님");
      console.error("노트의 userUid:", noteData.userUid);
      console.error("노트의 userId:", noteData.userId);
      console.error("현재 사용자 uid:", currentUser.uid);
      throw new Error("본인의 노트만 수정할 수 있습니다.");
    }
    
    // 금지된 필드들 제거 (Firestore 규칙에서 허용하지 않는 필드들)
    const forbiddenFields = ['userUid', 'userId', 'author', 'createdAt', 'views', 'likes', 'commentCount', 'comment'];
    const cleanUpdateData = {};
    
    Object.keys(updateData).forEach(key => {
      if (!forbiddenFields.includes(key)) {
        cleanUpdateData[key] = updateData[key];
      } else {
        console.warn(`금지된 필드 제거됨: ${key}`);
      }
    });
    
    // 수정 시간 추가
    const updateDataWithTimestamp = {
      ...cleanUpdateData,
      updatedAt: serverTimestamp()
    };
    
    console.log("정리된 업데이트 데이터:", JSON.stringify(updateDataWithTimestamp, null, 2));
    console.log("업데이트할 필드 목록:", Object.keys(updateDataWithTimestamp));
    
    // content 필드 최종 확인
    if (updateDataWithTimestamp.content) {
      console.log("=== 최종 CONTENT 확인 ===");
      console.log("최종 content:", updateDataWithTimestamp.content);
      console.log("최종 content 길이:", updateDataWithTimestamp.content.length);
    }
    
    await updateDoc(noteDocRef, updateDataWithTimestamp);
    console.log("노트 업데이트 완료:", noteId);
    
    // 업데이트 후 다시 확인
    const updatedDoc = await getDoc(noteDocRef);
    const updatedData = updatedDoc.data();
    console.log("=== 업데이트 후 확인 ===");
    console.log("업데이트된 content:", updatedData.content);
    console.log("업데이트된 title:", updatedData.title);
    
    return true;
  } catch (error) {
    console.error("노트 업데이트 실패:", error);
    console.error("에러 코드:", error.code);
    console.error("에러 메시지:", error.message);
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

    // 멘션 처리
    try {
      const mentions = extractMentions(replyContent.trim());
      if (mentions.length > 0) {
        // 멘션된 사용자들의 ID 찾기
        for (const mentionedUsername of mentions) {
          try {
            // 사용자명으로 사용자 찾기
            const usersQuery = query(
              collection(db, 'users'),
              where('displayName', '==', mentionedUsername),
              limit(1)
            );
            const usersSnapshot = await getDocs(usersQuery);
            
            if (!usersSnapshot.empty) {
              const mentionedUserDoc = usersSnapshot.docs[0];
              const mentionedUserId = mentionedUserDoc.id;
              
              // 자신을 멘션한 경우나 댓글 작성자를 멘션한 경우는 제외 (이미 다른 알림이 있음)
              if (mentionedUserId !== currentUser.uid && mentionedUserId !== targetComment.userUid) {
                await createMentionNotification(
                  noteId,
                  'note',
                  mentionedUserId,
                  currentUser.uid,
                  replyContent.trim()
                );
              }
            }
          } catch (mentionError) {
            console.warn(`멘션 처리 실패 (@${mentionedUsername}):`, mentionError);
          }
        }
      }
    } catch (mentionError) {
      console.warn("멘션 처리 실패:", mentionError);
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

// 디버깅용 테스트 함수
export const testFirestorePermissions = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("사용자가 로그인되어 있지 않습니다.");
    return;
  }

  console.log("=== Firestore 권한 테스트 시작 ===");
  console.log("현재 사용자:", {
    uid: currentUser.uid,
    email: currentUser.email,
    displayName: currentUser.displayName
  });

  // 테스트 노트 데이터
  const testNoteData = {
    userUid: currentUser.uid,
    title: "테스트 노트",
    content: "테스트 내용",
    category: "기타",
    likes: 0,
    views: 0,
    commentCount: 0,
    comment: [],
    author: "테스트 사용자",
    createdAt: serverTimestamp()
  };

  console.log("테스트 노트 데이터:", JSON.stringify(testNoteData, null, 2));

  try {
    // 노트 생성 테스트
    console.log("노트 생성 테스트 시작...");
    const docRef = await addDoc(collection(db, "notes"), testNoteData);
    console.log("✅ 노트 생성 성공:", docRef.id);

    // 노트 업데이트 테스트
    console.log("노트 업데이트 테스트 시작...");
    await updateDoc(docRef, {
      title: "업데이트된 테스트 노트",
      updatedAt: serverTimestamp()
    });
    console.log("✅ 노트 업데이트 성공");

    // 노트 삭제 테스트
    console.log("노트 삭제 테스트 시작...");
    await deleteDoc(docRef);
    console.log("✅ 노트 삭제 성공");

    console.log("=== 모든 테스트 통과! ===");
  } catch (error) {
    console.error("❌ 테스트 실패:", error);
    console.error("에러 코드:", error.code);
    console.error("에러 메시지:", error.message);
  }
};

// 기존 노트 데이터 구조 확인 함수
export const checkExistingNotesStructure = async () => {
  console.log("=== 기존 노트 데이터 구조 확인 ===");
  
  try {
    const notesQuery = query(
      collection(db, "notes"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    
    const querySnapshot = await getDocs(notesQuery);
    
    querySnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`노트 ${index + 1} (ID: ${doc.id}):`);
      console.log("- userUid:", data.userUid);
      console.log("- userId:", data.userId);
      console.log("- title:", data.title);
      console.log("- 필드 목록:", Object.keys(data));
      console.log("---");
    });
    
  } catch (error) {
    console.error("기존 노트 확인 실패:", error);
  }
};

// likesUsers 서브컬렉션 데이터 확인 함수
export const checkLikesUsersCollection = async (noteId = null) => {
  console.log("=== likesUsers 서브컬렉션 데이터 확인 ===");
  
  try {
    if (noteId) {
      // 특정 노트의 likesUsers 확인
      console.log(`노트 ${noteId}의 likesUsers 확인:`);
      const likesUsersRef = collection(db, "notes", noteId, "likesUsers");
      const likesSnapshot = await getDocs(likesUsersRef);
      
      console.log(`총 좋아요 수: ${likesSnapshot.size}`);
      
      likesSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`좋아요 ${index + 1}:`, {
          userId: doc.id,
          data: data,
          timestamp: data.timestamp ? data.timestamp.toDate() : 'N/A'
        });
      });
    } else {
      // 모든 노트의 likesUsers 확인
      console.log("모든 노트의 likesUsers 확인:");
      
      const notesQuery = query(
        collection(db, "notes"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      
      const notesSnapshot = await getDocs(notesQuery);
      
      for (const noteDoc of notesSnapshot.docs) {
        const noteData = noteDoc.data();
        console.log(`\n--- 노트: ${noteDoc.id} (${noteData.title}) ---`);
        console.log(`메인 likes 필드: ${noteData.likes || 0}`);
        
        // 해당 노트의 likesUsers 서브컬렉션 확인
        const likesUsersRef = collection(db, "notes", noteDoc.id, "likesUsers");
        const likesSnapshot = await getDocs(likesUsersRef);
        
        console.log(`likesUsers 서브컬렉션 크기: ${likesSnapshot.size}`);
        
        if (likesSnapshot.size > 0) {
          likesSnapshot.docs.forEach((likeDoc, index) => {
            const likeData = likeDoc.data();
            console.log(`  좋아요 ${index + 1}:`, {
              userId: likeDoc.id,
              data: likeData,
              timestamp: likeData.timestamp ? likeData.timestamp.toDate() : 'N/A'
            });
          });
        } else {
          console.log("  좋아요가 없습니다.");
        }
        
        // 데이터 일치성 확인
        if (noteData.likes !== likesSnapshot.size) {
          console.warn(`⚠️ 데이터 불일치: 메인 likes(${noteData.likes}) ≠ 서브컬렉션 크기(${likesSnapshot.size})`);
        }
      }
    }
    
  } catch (error) {
    console.error("likesUsers 확인 실패:", error);
  }
};

// 특정 사용자의 좋아요 기록 확인
export const checkUserLikesHistory = async (userId) => {
  console.log(`=== 사용자 ${userId}의 좋아요 기록 확인 ===`);
  
  try {
    const notesQuery = query(
      collection(db, "notes"),
      orderBy("createdAt", "desc")
    );
    
    const notesSnapshot = await getDocs(notesQuery);
    const userLikes = [];
    
    for (const noteDoc of notesSnapshot.docs) {
      const likesUsersRef = collection(db, "notes", noteDoc.id, "likesUsers");
      const userLikeDoc = await getDoc(doc(likesUsersRef, userId));
      
      if (userLikeDoc.exists()) {
        const noteData = noteDoc.data();
        userLikes.push({
          noteId: noteDoc.id,
          noteTitle: noteData.title,
          likeData: userLikeDoc.data(),
          timestamp: userLikeDoc.data().timestamp ? userLikeDoc.data().timestamp.toDate() : 'N/A'
        });
      }
    }
    
    console.log(`사용자가 좋아요한 노트 수: ${userLikes.length}`);
    userLikes.forEach((like, index) => {
      console.log(`좋아요 ${index + 1}:`, like);
    });
    
    return userLikes;
    
  } catch (error) {
    console.error("사용자 좋아요 기록 확인 실패:", error);
  }
};

// 좋아요 데이터 일치성 검사
export const validateLikesConsistency = async () => {
  console.log("=== 좋아요 데이터 일치성 검사 ===");
  
  try {
    const notesQuery = query(collection(db, "notes"));
    const notesSnapshot = await getDocs(notesQuery);
    
    const inconsistencies = [];
    
    for (const noteDoc of notesSnapshot.docs) {
      const noteData = noteDoc.data();
      const likesUsersRef = collection(db, "notes", noteDoc.id, "likesUsers");
      const likesSnapshot = await getDocs(likesUsersRef);
      
      const mainLikes = noteData.likes || 0;
      const subCollectionSize = likesSnapshot.size;
      
      if (mainLikes !== subCollectionSize) {
        inconsistencies.push({
          noteId: noteDoc.id,
          title: noteData.title,
          mainLikes: mainLikes,
          subCollectionSize: subCollectionSize,
          difference: Math.abs(mainLikes - subCollectionSize)
        });
      }
    }
    
    console.log(`총 노트 수: ${notesSnapshot.size}`);
    console.log(`불일치 노트 수: ${inconsistencies.length}`);
    
    if (inconsistencies.length > 0) {
      console.log("불일치 목록:");
      inconsistencies.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title} (${item.noteId})`);
        console.log(`   메인 likes: ${item.mainLikes}, 서브컬렉션: ${item.subCollectionSize}, 차이: ${item.difference}`);
      });
    } else {
      console.log("✅ 모든 노트의 좋아요 데이터가 일치합니다!");
    }
    
    return inconsistencies;
    
  } catch (error) {
    console.error("일치성 검사 실패:", error);
  }
};

// 브라우저 콘솔에서 테스트할 수 있도록 전역으로 노출
if (typeof window !== 'undefined') {
  window.testFirestorePermissions = testFirestorePermissions;
  window.checkExistingNotesStructure = checkExistingNotesStructure;
  window.checkLikesUsersCollection = checkLikesUsersCollection;
  window.checkUserLikesHistory = checkUserLikesHistory;
  window.validateLikesConsistency = validateLikesConsistency;
}
