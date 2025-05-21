// firebaseUtils.js
import { collection, addDoc,getDocs } from "firebase/firestore";
import { db } from '../services/firebase'

export const saveNoteToFirestore = async (noteData) => {
  try {
    const docRef = await addDoc(collection(db, "notes"), noteData); 
    console.log("저장 성공! 문서 ID:", docRef.id);
  } catch (error) {
    console.error("Firestore 저장 실패:", error);
  }
};

export const loadNoteToFirebase = async () => {
  const querySnapshot = await getDocs(collection(db, "notes"));
  const notes = [];
  querySnapshot.forEach((doc) => {
    notes.push({ id: doc.id, ...doc.data() });
  });
  return notes;
};