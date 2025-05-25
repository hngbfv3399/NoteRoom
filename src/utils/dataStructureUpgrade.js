import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteField, 
  addDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../services/firebase";

// 댓글을 하위 컬렉션으로 이전
export const migrateCommentsToSubcollection = async (noteId, comments) => {
  try {
    const commentsCollection = collection(db, "notes", noteId, "comments");
    
    // 기존 배열의 댓글들을 하위 컬렉션으로 이전
    for (const comment of comments) {
      await addDoc(commentsCollection, {
        content: comment.content,
        userUid: comment.userUid,
        userName: comment.userName,
        createdAt: comment.createdAt || serverTimestamp()
      });
    }

    // 원본 문서에서 comment 배열 필드 제거
    const noteRef = doc(db, "notes", noteId);
    await updateDoc(noteRef, {
      comment: deleteField()
    });

    console.log(`노트 ${noteId}의 댓글이 성공적으로 이전되었습니다.`);
  } catch (error) {
    console.error("댓글 이전 중 오류 발생:", error);
    throw error;
  }
};

// userId를 userUid로 통일
export const normalizeUserIdentifier = async (noteId) => {
  try {
    const noteRef = doc(db, "notes", noteId);
    await updateDoc(noteRef, {
      userId: deleteField()
    });
    
    console.log(`노트 ${noteId}의 사용자 식별자가 통일되었습니다.`);
  } catch (error) {
    console.error("사용자 식별자 통일 중 오류 발생:", error);
    throw error;
  }
};

// 날짜 형식 통일 (date 필드 제거, createdAt만 사용)
export const normalizeDateFormat = async (noteId) => {
  try {
    const noteRef = doc(db, "notes", noteId);
    await updateDoc(noteRef, {
      date: deleteField()
    });
    
    console.log(`노트 ${noteId}의 날짜 형식이 통일되었습니다.`);
  } catch (error) {
    console.error("날짜 형식 통일 중 오류 발생:", error);
    throw error;
  }
};

// userName을 displayName으로 마이그레이션 (안전하게)
export const migrateUserNameToDisplayName = async () => {
  try {
    console.log("마이그레이션 시작: userName -> displayName");
    
    const usersCollection = collection(db, "users");
    const userSnapshot = await getDocs(usersCollection);
    let migratedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // 1단계: 현재 상태 확인
    console.log(`총 ${userSnapshot.docs.length}명의 사용자 확인 중...`);
    
    for (const userDoc of userSnapshot.docs) {
      const userData = userDoc.data();
      try {
        // 이미 마이그레이션된 경우 스킵
        if (userData.displayName) {
          console.log(`사용자 ${userDoc.id}: 이미 displayName이 있음 (${userData.displayName})`);
          continue;
        }
        
        // userName이 없는 경우 기본값 사용
        if (!userData.userName) {
          console.log(`사용자 ${userDoc.id}: userName이 없음, 기본값 사용`);
          await updateDoc(doc(db, "users", userDoc.id), {
            displayName: "닉네임 없음"
          });
          migratedCount++;
          continue;
        }

        // 실제 마이그레이션 수행
        await updateDoc(doc(db, "users", userDoc.id), {
          displayName: userData.userName,
          userName: deleteField()
        });
        console.log(`사용자 ${userDoc.id}: userName(${userData.userName})을 displayName으로 변환 완료`);
        migratedCount++;
        
      } catch (error) {
        console.error(`사용자 ${userDoc.id} 처리 중 오류:`, error);
        errorCount++;
        errors.push({ userId: userDoc.id, error: error.message });
      }
    }
    
    // 결과 리포트
    console.log("\n=== 마이그레이션 결과 ===");
    console.log(`총 사용자 수: ${userSnapshot.docs.length}`);
    console.log(`성공적으로 마이그레이션된 사용자: ${migratedCount}`);
    console.log(`오류 발생 사용자: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log("\n오류 목록:");
      errors.forEach(({ userId, error }) => {
        console.log(`- 사용자 ${userId}: ${error}`);
      });
    }

    return {
      total: userSnapshot.docs.length,
      migrated: migratedCount,
      errors: errorCount,
      errorDetails: errors
    };
    
  } catch (error) {
    console.error("마이그레이션 중 치명적 오류 발생:", error);
    throw error;
  }
};

// 전체 구조 개선 실행
export const upgradeDataStructure = async () => {
  try {
    // 모든 노트 가져오기
    const notesSnapshot = await getDocs(collection(db, "notes"));
    
    for (const noteDoc of notesSnapshot.docs) {
      const noteData = noteDoc.data();
      const noteId = noteDoc.id;
      
      // 1. 댓글 이전 (comment 배열이 있는 경우에만)
      if (noteData.comment && Array.isArray(noteData.comment)) {
        await migrateCommentsToSubcollection(noteId, noteData.comment);
      }
      
      // 2. 사용자 식별자 통일
      if (noteData.userId) {
        await normalizeUserIdentifier(noteId);
      }
      
      // 3. 날짜 형식 통일
      if (noteData.date) {
        await normalizeDateFormat(noteId);
      }
    }
    
    console.log("모든 데이터 구조 개선이 완료되었습니다.");
  } catch (error) {
    console.error("데이터 구조 개선 중 오류 발생:", error);
    throw error;
  }
}; 