import { collection, getDocs, doc } from "firebase/firestore";
import { db } from "../services/firebase";

// 전체 사용자 데이터 가져오기
export const fetchAllUsers = async () => {
  try {
    const usersCollection = collection(db, "users");
    const userSnapshot = await getDocs(usersCollection);
    const users = [];
    
    userSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log("=== 전체 사용자 데이터 ===");
    console.log(JSON.stringify(users, null, 2));
    return users;
  } catch (error) {
    console.error("사용자 데이터 가져오기 실패:", error);
    throw error;
  }
};

// 전체 노트 데이터 가져오기
export const fetchAllNotes = async () => {
  try {
    const notesCollection = collection(db, "notes");
    const noteSnapshot = await getDocs(notesCollection);
    const notes = [];
    
    noteSnapshot.forEach((doc) => {
      const data = doc.data();
      // Timestamp를 Date 객체로 변환
      if (data.createdAt) {
        data.createdAt = data.createdAt.toDate();
      }
      notes.push({
        id: doc.id,
        ...data
      });
    });

    console.log("=== 전체 노트 데이터 ===");
    console.log(JSON.stringify(notes, null, 2));
    return notes;
  } catch (error) {
    console.error("노트 데이터 가져오기 실패:", error);
    throw error;
  }
};

// 모든 데이터 한번에 가져오기
export const fetchAllData = async () => {
  try {
    const users = await fetchAllUsers();
    const notes = await fetchAllNotes();
    
    return {
      users,
      notes,
      summary: {
        totalUsers: users.length,
        totalNotes: notes.length
      }
    };
  } catch (error) {
    console.error("데이터 가져오기 실패:", error);
    throw error;
  }
};

// 특정 노트의 하위 컬렉션 데이터 가져오기
export const fetchNoteSubCollections = async (noteId) => {
  try {
    // comments 하위 컬렉션 가져오기
    const commentsCollection = collection(db, "notes", noteId, "comments");
    const commentsSnapshot = await getDocs(commentsCollection);
    const comments = [];
    
    commentsSnapshot.forEach((doc) => {
      const data = doc.data();
      // Timestamp 변환
      if (data.createdAt) {
        data.createdAt = data.createdAt.toDate();
      }
      comments.push({
        id: doc.id,
        ...data
      });
    });

    // likesUsers 하위 컬렉션 가져오기
    const likesCollection = collection(db, "notes", noteId, "likesUsers");
    const likesSnapshot = await getDocs(likesCollection);
    const likes = [];
    
    likesSnapshot.forEach((doc) => {
      const data = doc.data();
      // Timestamp 변환
      if (data.createdAt) {
        data.createdAt = data.createdAt.toDate();
      }
      likes.push({
        id: doc.id,
        ...data
      });
    });

    console.log(`=== 노트 ${noteId}의 하위 컬렉션 데이터 ===`);
    console.log("Comments:", JSON.stringify(comments, null, 2));
    console.log("Likes Users:", JSON.stringify(likes, null, 2));

    return {
      comments,
      likes
    };
  } catch (error) {
    console.error("하위 컬렉션 데이터 가져오기 실패:", error);
    throw error;
  }
};

// 모든 노트의 하위 컬렉션 데이터 가져오기
export const fetchAllNotesWithSubCollections = async () => {
  try {
    const notes = await fetchAllNotes();
    const notesWithSubCollections = [];

    for (const note of notes) {
      const subCollections = await fetchNoteSubCollections(note.id);
      notesWithSubCollections.push({
        ...note,
        subCollections
      });
    }

    console.log("=== 전체 노트 데이터 (하위 컬렉션 포함) ===");
    console.log(JSON.stringify(notesWithSubCollections, null, 2));
    
    return notesWithSubCollections;
  } catch (error) {
    console.error("전체 데이터 가져오기 실패:", error);
    throw error;
  }
}; 