/**
 * 드래프트(임시저장) 관련 유틸리티 함수들
 * 
 * 주요 기능:
 * - 드래프트 저장/로드/삭제
 * - 자동 저장 관리
 * - 만료된 드래프트 정리
 * - 드래프트 목록 관리
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { normalizeInput } from '@/utils/security';

/**
 * 드래프트 저장
 * @param {Object} draftData - 드래프트 데이터
 * @param {boolean} isAutoSaved - 자동 저장 여부
 * @returns {Promise<string>} 드래프트 ID
 */
export const saveDraft = async (draftData, isAutoSaved = false) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('로그인이 필요합니다.');
  }

  console.log('=== 드래프트 저장 시작 ===');
  console.log('draftData:', draftData);
  console.log('isAutoSaved:', isAutoSaved);

  try {
    // 데이터 정규화 및 정화
    const sanitizedData = {
      userUid: currentUser.uid,
      title: draftData.title ? normalizeInput(draftData.title) : '',
      content: draftData.content ? sanitizeHtml(draftData.content) : '',
      category: draftData.category ? normalizeInput(draftData.category) : '',
      thumbnail: draftData.thumbnail || null,
      images: draftData.images || [],
      isAutoSaved,
      lastSavedAt: serverTimestamp(),
      createdAt: draftData.createdAt || serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30일 후
    };

    // 기존 드래프트 업데이트 또는 새 드래프트 생성
    if (draftData.id) {
      const draftRef = doc(db, 'drafts', draftData.id);
      await updateDoc(draftRef, {
        ...sanitizedData,
        createdAt: draftData.createdAt // 생성일은 유지
      });
      console.log('드래프트 업데이트 완료:', draftData.id);
      return draftData.id;
    } else {
      const draftRef = await addDoc(collection(db, 'drafts'), sanitizedData);
      console.log('새 드래프트 생성 완료:', draftRef.id);
      return draftRef.id;
    }
  } catch (error) {
    console.error('드래프트 저장 실패:', error);
    throw new Error('임시저장에 실패했습니다.');
  }
};

/**
 * 드래프트 로드
 * @param {string} draftId - 드래프트 ID
 * @returns {Promise<Object>} 드래프트 데이터
 */
export const loadDraft = async (draftId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('로그인이 필요합니다.');
  }

  console.log('=== 드래프트 로드 시작 ===');
  console.log('draftId:', draftId);

  try {
    const draftRef = doc(db, 'drafts', draftId);
    const draftDoc = await getDoc(draftRef);

    if (!draftDoc.exists()) {
      throw new Error('드래프트를 찾을 수 없습니다.');
    }

    const draftData = draftDoc.data();

    // 권한 확인
    if (draftData.userUid !== currentUser.uid) {
      throw new Error('드래프트에 접근할 권한이 없습니다.');
    }

    // 만료 확인
    if (draftData.expiresAt && draftData.expiresAt.toDate() < new Date()) {
      await deleteDoc(draftRef);
      throw new Error('만료된 드래프트입니다.');
    }

    console.log('드래프트 로드 완료:', draftData);
    return {
      id: draftDoc.id,
      ...draftData
    };
  } catch (error) {
    console.error('드래프트 로드 실패:', error);
    throw error;
  }
};

/**
 * 드래프트 삭제
 * @param {string} draftId - 드래프트 ID
 * @returns {Promise<void>}
 */
export const deleteDraft = async (draftId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('로그인이 필요합니다.');
  }

  console.log('=== 드래프트 삭제 시작 ===');
  console.log('draftId:', draftId);

  try {
    const draftRef = doc(db, 'drafts', draftId);
    const draftDoc = await getDoc(draftRef);

    if (draftDoc.exists()) {
      const draftData = draftDoc.data();
      
      // 권한 확인
      if (draftData.userUid !== currentUser.uid) {
        throw new Error('드래프트를 삭제할 권한이 없습니다.');
      }

      await deleteDoc(draftRef);
      console.log('드래프트 삭제 완료:', draftId);
    }
  } catch (error) {
    console.error('드래프트 삭제 실패:', error);
    throw new Error('드래프트 삭제에 실패했습니다.');
  }
};

/**
 * 사용자의 드래프트 목록 조회
 * @param {number} limitCount - 조회할 개수 (기본값: 10)
 * @returns {Promise<Array>} 드래프트 목록
 */
export const getUserDrafts = async (limitCount = 10) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('로그인이 필요합니다.');
  }

  console.log('=== 사용자 드래프트 목록 조회 ===');
  console.log('userId:', currentUser.uid);
  console.log('limitCount:', limitCount);

  try {
    const draftsQuery = query(
      collection(db, 'drafts'),
      where('userUid', '==', currentUser.uid),
      orderBy('lastSavedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(draftsQuery);
    const drafts = [];

    querySnapshot.forEach((doc) => {
      const draftData = doc.data();
      
      // 만료되지 않은 드래프트만 포함
      if (!draftData.expiresAt || draftData.expiresAt.toDate() > new Date()) {
        drafts.push({
          id: doc.id,
          ...draftData
        });
      }
    });

    console.log('드래프트 목록 조회 완료:', drafts.length, '개');
    return drafts;
  } catch (error) {
    console.error('드래프트 목록 조회 실패:', error);
    throw new Error('드래프트 목록을 불러오는데 실패했습니다.');
  }
};

/**
 * 만료된 드래프트 정리
 * @returns {Promise<number>} 삭제된 드래프트 개수
 */
export const cleanupExpiredDrafts = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return 0;
  }

  console.log('=== 만료된 드래프트 정리 시작 ===');

  try {
    const draftsQuery = query(
      collection(db, 'drafts'),
      where('userUid', '==', currentUser.uid),
      where('expiresAt', '<', new Date())
    );

    const querySnapshot = await getDocs(draftsQuery);
    let deletedCount = 0;

    const deletePromises = querySnapshot.docs.map(async (doc) => {
      await deleteDoc(doc.ref);
      deletedCount++;
    });

    await Promise.all(deletePromises);

    console.log('만료된 드래프트 정리 완료:', deletedCount, '개 삭제');
    return deletedCount;
  } catch (error) {
    console.error('만료된 드래프트 정리 실패:', error);
    return 0;
  }
};

/**
 * 드래프트에서 노트로 발행
 * @param {string} draftId - 드래프트 ID
 * @param {Object} additionalData - 추가 노트 데이터
 * @returns {Promise<string>} 생성된 노트 ID
 */
export const publishDraftAsNote = async (draftId, additionalData = {}) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('로그인이 필요합니다.');
  }

  console.log('=== 드래프트 발행 시작 ===');
  console.log('draftId:', draftId);

  try {
    // 드래프트 로드
    const draft = await loadDraft(draftId);

    // 노트 데이터 생성
    const noteData = {
      title: draft.title,
      content: draft.content,
      category: draft.category,
      userUid: currentUser.uid,
      author: currentUser.displayName || '익명',
      thumbnail: draft.thumbnail,
      images: draft.images || [],
      isPublic: true,
      isDraft: false,
      tags: [],
      likes: 0,
      views: 0,
      commentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: serverTimestamp(),
      ...additionalData
    };

    // 노트 생성
    const { saveNoteToFirestore } = await import('@/utils/firebaseNoteDataUtil');
    const noteId = await saveNoteToFirestore(noteData);

    // 드래프트 삭제
    await deleteDraft(draftId);

    console.log('드래프트 발행 완료:', noteId);
    return noteId;
  } catch (error) {
    console.error('드래프트 발행 실패:', error);
    throw new Error('드래프트 발행에 실패했습니다.');
  }
};

/**
 * 드래프트 데이터 유효성 검증
 * @param {Object} draftData - 드래프트 데이터
 * @returns {Object} 검증 결과
 */
export const validateDraftData = (draftData) => {
  const errors = [];

  // 제목 검증 (선택사항)
  if (draftData.title && draftData.title.length > 200) {
    errors.push('제목은 200자를 초과할 수 없습니다.');
  }

  // 내용 검증 (선택사항)
  if (draftData.content && draftData.content.length > 50000) {
    errors.push('내용은 50,000자를 초과할 수 없습니다.');
  }

  // 카테고리 검증 (선택사항)
  if (draftData.category && draftData.category.length > 50) {
    errors.push('카테고리는 50자를 초과할 수 없습니다.');
  }

  // 이미지 개수 검증
  if (draftData.images && draftData.images.length > 20) {
    errors.push('이미지는 최대 20개까지 첨부할 수 있습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  saveDraft,
  loadDraft,
  deleteDraft,
  getUserDrafts,
  cleanupExpiredDrafts,
  publishDraftAsNote,
  validateDraftData
}; 