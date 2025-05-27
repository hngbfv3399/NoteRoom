/**
 * 알림 시스템 유틸리티
 * 댓글, 대댓글, 멘션 알림을 관리합니다.
 * 
 * IMPROVED: Redux 토스트 시스템 통합, 에러 처리 강화, 재시도 로직 추가
 */

import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  orderBy,
  limit,
  getDocs,
  updateDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { 
  showCommentNotification, 
  showReplyNotification, 
  showMentionNotification, 
  showNewNoteNotification 
} from './pushNotificationUtils';
import store from '@/store/store';
import { showToast } from '@/store/toast/slice';

// 알림 타입 정의
export const NOTIFICATION_TYPES = {
  COMMENT: 'comment',
  REPLY: 'reply', 
  MENTION: 'mention',
  NEW_NOTE: 'new_note'
};

// 토스트 알림 표시 헬퍼 함수 (Redux 기반)
const showToastNotification = (message, type = 'info') => {
  try {
    store.dispatch(showToast({
      message,
      type,
      duration: 4000
    }));
  } catch (error) {
    console.error('토스트 알림 표시 실패:', error);
    // 폴백: 기존 window.showToast 사용
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(message, type, 4000);
    }
  }
};

// 재시도 로직을 포함한 안전한 Firestore 작업
const safeFirestoreOperation = async (operation, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // 네트워크 오류나 일시적 오류인 경우 재시도
      if (
        error.code === 'unavailable' || 
        error.code === 'deadline-exceeded' ||
        error.code === 'internal' ||
        error.message.includes('network')
      ) {
        if (attempt < maxRetries) {
          console.warn(`Firestore 작업 재시도 ${attempt}/${maxRetries}:`, error.message);
          // 지수 백오프
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
      }
      
      // 재시도하지 않을 오류이거나 최대 재시도 횟수 도달
      throw error;
    }
  }
  
  throw lastError;
};

// 댓글 알림 생성 (개선된 에러 처리 및 재시도 로직)
export const createCommentNotification = async (noteId, noteAuthorId, commentAuthorId, commentContent) => {
  try {
    // 자신의 글에 자신이 댓글을 단 경우 알림 생성하지 않음
    if (noteAuthorId === commentAuthorId) {
      return { success: true };
    }

    // 안전한 Firestore 작업으로 사용자 정보 가져오기
    const [commentAuthorData, noteData] = await Promise.all([
      safeFirestoreOperation(async () => {
        const userDoc = await getDoc(doc(db, 'users', commentAuthorId));
        return userDoc.data();
      }),
      safeFirestoreOperation(async () => {
        const noteDoc = await getDoc(doc(db, 'notes', noteId));
        return noteDoc.data();
      })
    ]);

    const commentAuthorName = commentAuthorData?.displayName || '익명';
    const noteTitle = noteData?.title || '제목 없음';

    // 알림 생성
    await safeFirestoreOperation(async () => {
      return await addDoc(collection(db, 'notifications'), {
        type: NOTIFICATION_TYPES.COMMENT,
        targetUser: noteAuthorId,
        fromUser: commentAuthorId,
        contentId: noteId,
        contentType: 'note',
        message: `${commentAuthorName}님이 회원님의 글에 댓글을 달았습니다.`,
        preview: commentContent.substring(0, 50) + (commentContent.length > 50 ? '...' : ''),
        isRead: false,
        createdAt: serverTimestamp()
      });
    });

    // 브라우저 푸시 알림 표시
    try {
      await showCommentNotification(commentAuthorName, noteTitle, noteId);
    } catch (pushError) {
      console.warn('브라우저 푸시 알림 실패:', pushError);
    }

    // 토스트 알림 표시 (댓글 작성자에게)
    showToastNotification(`댓글이 성공적으로 작성되었습니다.`, 'success');

    return { success: true };
  } catch (error) {
    console.error('댓글 알림 생성 실패:', error);
    
    const errorMessage = error.code === 'permission-denied'
      ? '댓글 알림 권한이 없습니다.'
      : error.code === 'unavailable'
      ? '네트워크 연결을 확인해주세요.'
      : '댓글 알림 생성에 실패했습니다.';
    
    showToastNotification(errorMessage, 'error');
    throw error;
  }
};

// 대댓글 알림 생성
export const createReplyNotification = async (commentId, commentAuthorId, replyAuthorId, replyContent, noteId = null) => {
  try {
    // 자신의 댓글에 자신이 대댓글을 단 경우 알림 생성하지 않음
    if (commentAuthorId === replyAuthorId) {
      return { success: true };
    }

    // 대댓글 작성자 정보 가져오기
    const replyAuthorDoc = await getDoc(doc(db, 'users', replyAuthorId));
    const replyAuthorData = replyAuthorDoc.data();
    const replyAuthorName = replyAuthorData?.displayName || '익명';

    await addDoc(collection(db, 'notifications'), {
      type: NOTIFICATION_TYPES.REPLY,
      targetUser: commentAuthorId,
      fromUser: replyAuthorId,
      contentId: commentId,
      contentType: 'comment',
      noteId: noteId,
      message: `${replyAuthorName}님이 회원님의 댓글에 답글을 달았습니다.`,
      preview: replyContent.substring(0, 50) + (replyContent.length > 50 ? '...' : ''),
      isRead: false,
      createdAt: serverTimestamp()
    });

    // 브라우저 푸시 알림 표시
    try {
      await showReplyNotification(replyAuthorName, replyContent, noteId || commentId);
    } catch (pushError) {
      console.warn('브라우저 푸시 알림 실패:', pushError);
    }

    // 토스트 알림 표시 (대댓글 작성자에게)
    showToastNotification(`답글이 성공적으로 작성되었습니다.`, 'success');

    return { success: true };
  } catch (error) {
    console.error('대댓글 알림 생성 실패:', error);
    showToastNotification('답글 알림 생성에 실패했습니다.', 'error');
    throw error;
  }
};

// 멘션 알림 생성
export const createMentionNotification = async (contentId, contentType, mentionedUserId, mentionAuthorId, content) => {
  try {
    // 자신을 멘션한 경우 알림 생성하지 않음
    if (mentionedUserId === mentionAuthorId) {
      return { success: true };
    }

    // 멘션 작성자 정보 가져오기
    const mentionAuthorDoc = await getDoc(doc(db, 'users', mentionAuthorId));
    const mentionAuthorData = mentionAuthorDoc.data();
    const mentionAuthorName = mentionAuthorData?.displayName || '익명';

    await addDoc(collection(db, 'notifications'), {
      type: NOTIFICATION_TYPES.MENTION,
      targetUser: mentionedUserId,
      fromUser: mentionAuthorId,
      contentId: contentId,
      contentType: contentType,
      message: `${mentionAuthorName}님이 회원님을 언급했습니다.`,
      preview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      isRead: false,
      createdAt: serverTimestamp()
    });

    // 브라우저 푸시 알림 표시
    try {
      await showMentionNotification(mentionAuthorName, content, contentId);
    } catch (pushError) {
      console.warn('브라우저 푸시 알림 실패:', pushError);
    }

    return { success: true };
  } catch (error) {
    console.error('멘션 알림 생성 실패:', error);
    throw error;
  }
};

// 사용자의 알림 목록 가져오기
export const getUserNotifications = async (userId, limitCount = 20) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('targetUser', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('알림 목록 조회 실패:', error);
    
    // 인덱스 빌드 중인 경우 사용자에게 알림
    if (error.code === 'failed-precondition' || error.message.includes('index is currently building')) {
      showToastNotification('알림 시스템을 준비 중입니다. 잠시 후 다시 시도해주세요.', 'info');
    }
    
    return [];
  }
};

// 읽지 않은 알림 개수 가져오기
export const getUnreadNotificationCount = async (userId) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('targetUser', '==', userId),
      where('isRead', '==', false)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('읽지 않은 알림 개수 조회 실패:', error);
    
    // 인덱스 빌드 중인 경우 조용히 0 반환
    if (error.code === 'failed-precondition' || error.message.includes('index is currently building')) {
      console.log('인덱스 빌드 중 - 알림 개수를 0으로 반환');
    }
    
    return 0;
  }
};

// 알림 읽음 처리
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('알림 읽음 처리 실패:', error);
    throw error;
  }
};

// 모든 알림 삭제 (읽음 처리 대신)
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('targetUser', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      showToastNotification('삭제할 알림이 없습니다.', 'info');
      return { success: true, deletedCount: 0 };
    }
    
    // 모든 알림 삭제
    const deletePromises = snapshot.docs.map(doc => 
      safeFirestoreOperation(async () => {
        const { deleteDoc } = await import('firebase/firestore');
        return await deleteDoc(doc.ref);
      })
    );
    
    await Promise.all(deletePromises);
    
    // 토스트 알림 표시
    showToastNotification(`${snapshot.size}개의 알림을 모두 삭제했습니다.`, 'success');
    
    return { success: true, deletedCount: snapshot.size };
  } catch (error) {
    console.error('모든 알림 삭제 실패:', error);
    showToastNotification('알림 삭제에 실패했습니다.', 'error');
    throw error;
  }
};

// 읽지 않은 알림만 삭제
export const deleteUnreadNotifications = async (userId) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('targetUser', '==', userId),
      where('isRead', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      showToastNotification('삭제할 읽지 않은 알림이 없습니다.', 'info');
      return { success: true, deletedCount: 0 };
    }
    
    // 읽지 않은 알림만 삭제
    const deletePromises = snapshot.docs.map(doc => 
      safeFirestoreOperation(async () => {
        const { deleteDoc } = await import('firebase/firestore');
        return await deleteDoc(doc.ref);
      })
    );
    
    await Promise.all(deletePromises);
    
    // 토스트 알림 표시
    showToastNotification(`${snapshot.size}개의 읽지 않은 알림을 삭제했습니다.`, 'success');
    
    return { success: true, deletedCount: snapshot.size };
  } catch (error) {
    console.error('읽지 않은 알림 삭제 실패:', error);
    showToastNotification('읽지 않은 알림 삭제에 실패했습니다.', 'error');
    throw error;
  }
};

// 텍스트에서 멘션 추출
export const extractMentions = (text) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // 중복 제거
};

// 새 노트 알림 생성 (구독자들에게)
export const createNewNoteNotification = async (noteId, authorId, noteTitle, noteContent) => {
  try {
    // 작성자의 구독자 목록 가져오기
    const { getUserSubscribers } = await import('./subscriptionUtils');
    const subscribers = await getUserSubscribers(authorId);
    
    if (subscribers.length === 0) {
      return { success: true, notificationCount: 0 };
    }

    // 작성자 정보 가져오기
    const authorDoc = await getDoc(doc(db, 'users', authorId));
    const authorData = authorDoc.data();
    const authorName = authorData?.displayName || '익명';

    // 각 구독자에게 알림 생성
    const notificationPromises = subscribers.map(subscriber => 
      addDoc(collection(db, 'notifications'), {
        type: NOTIFICATION_TYPES.NEW_NOTE,
        targetUser: subscriber.subscriber,
        fromUser: authorId,
        noteId: noteId,
        contentId: noteId,
        contentType: 'note',
        message: `${authorName}님이 새로운 노트를 작성했습니다.`,
        preview: noteTitle || noteContent.substring(0, 50) + (noteContent.length > 50 ? '...' : ''),
        read: false,
        createdAt: serverTimestamp()
      })
    );

    await Promise.all(notificationPromises);

    // 브라우저 푸시 알림 표시 (구독자들에게)
    try {
      await showNewNoteNotification(authorName, noteTitle || noteContent, noteId);
    } catch (pushError) {
      console.warn('브라우저 푸시 알림 실패:', pushError);
    }

    // 토스트 알림 표시 (노트 작성자에게)
    showToastNotification(`노트가 성공적으로 작성되었습니다. ${subscribers.length}명의 구독자에게 알림을 보냈습니다.`, 'success');

    return { success: true, notificationCount: subscribers.length };
  } catch (error) {
    console.error('새 노트 알림 생성 실패:', error);
    showToastNotification('노트 알림 생성에 실패했습니다.', 'error');
    throw error;
  }
}; 