/**
 * 구독 시스템 유틸리티
 * 사용자 간 구독/구독 취소 기능을 관리합니다.
 */

import { 
  collection, 
  doc, 
  query, 
  where, 
  getDocs,
  increment,
  serverTimestamp,
  runTransaction,
  getDoc
} from 'firebase/firestore';
import { db } from '@/services/firebase';

// 토스트 알림 표시 헬퍼 함수
const showToastNotification = (message, type = 'info') => {
  if (typeof window !== 'undefined' && window.showToast) {
    window.showToast(message, type, 4000); // 4초간 표시
  }
};

// 구독하기
export const subscribeToUser = async (subscriberId, targetUserId) => {
  try {
    // 이미 구독 중인지 확인
    const existingSubscription = await checkSubscriptionStatus(subscriberId, targetUserId);
    if (existingSubscription) {
      showToastNotification('이미 구독 중입니다.', 'warning');
      throw new Error('이미 구독 중입니다.');
    }

    // 대상 사용자 정보 가져오기
    const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
    const targetUserData = targetUserDoc.data();
    const targetUserName = targetUserData?.displayName || '사용자';

    // 트랜잭션으로 구독 생성 및 카운트 업데이트
    await runTransaction(db, async (transaction) => {
      // 구독 문서 생성
      const subscriptionRef = doc(collection(db, 'subscriptions'));
      transaction.set(subscriptionRef, {
        subscriber: subscriberId,
        target: targetUserId,
        type: 'user',
        createdAt: serverTimestamp()
      });

      // 구독자의 구독 수 증가
      const subscriberRef = doc(db, 'users', subscriberId);
      transaction.update(subscriberRef, {
        subscriptionCount: increment(1)
      });

      // 대상 사용자의 구독자 수 증가
      const targetRef = doc(db, 'users', targetUserId);
      transaction.update(targetRef, {
        subscriberCount: increment(1)
      });
    });

    // 성공 토스트 알림
    showToastNotification(`${targetUserName}님을 구독했습니다! 🎉`, 'success');

    return { success: true };
  } catch (error) {
    console.error('구독 실패:', error);
    if (!error.message.includes('이미 구독')) {
      showToastNotification('구독에 실패했습니다. 다시 시도해주세요.', 'error');
    }
    throw error;
  }
};

// 구독 취소
export const unsubscribeFromUser = async (subscriberId, targetUserId) => {
  try {
    // 구독 문서 찾기
    const subscriptionsRef = collection(db, 'subscriptions');
    const q = query(
      subscriptionsRef,
      where('subscriber', '==', subscriberId),
      where('target', '==', targetUserId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      showToastNotification('구독 정보를 찾을 수 없습니다.', 'warning');
      throw new Error('구독 정보를 찾을 수 없습니다.');
    }

    // 대상 사용자 정보 가져오기
    const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
    const targetUserData = targetUserDoc.data();
    const targetUserName = targetUserData?.displayName || '사용자';

    // 트랜잭션으로 구독 삭제 및 카운트 업데이트
    await runTransaction(db, async (transaction) => {
      // 구독 문서 삭제
      snapshot.docs.forEach((docSnapshot) => {
        transaction.delete(docSnapshot.ref);
      });

      // 구독자의 구독 수 감소
      const subscriberRef = doc(db, 'users', subscriberId);
      transaction.update(subscriberRef, {
        subscriptionCount: increment(-1)
      });

      // 대상 사용자의 구독자 수 감소
      const targetRef = doc(db, 'users', targetUserId);
      transaction.update(targetRef, {
        subscriberCount: increment(-1)
      });
    });

    // 성공 토스트 알림
    showToastNotification(`${targetUserName}님 구독을 취소했습니다.`, 'info');

    return { success: true };
  } catch (error) {
    console.error('구독 취소 실패:', error);
    if (!error.message.includes('구독 정보를 찾을 수 없습니다')) {
      showToastNotification('구독 취소에 실패했습니다. 다시 시도해주세요.', 'error');
    }
    throw error;
  }
};

// 구독 상태 확인
export const checkSubscriptionStatus = async (subscriberId, targetUserId) => {
  try {
    const subscriptionsRef = collection(db, 'subscriptions');
    const q = query(
      subscriptionsRef,
      where('subscriber', '==', subscriberId),
      where('target', '==', targetUserId)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('구독 상태 확인 실패:', error);
    return false;
  }
};

// 사용자의 구독 목록 가져오기
export const getUserSubscriptions = async (userId) => {
  try {
    const subscriptionsRef = collection(db, 'subscriptions');
    const q = query(
      subscriptionsRef,
      where('subscriber', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('구독 목록 조회 실패:', error);
    return [];
  }
};

// 사용자의 구독자 목록 가져오기
export const getUserSubscribers = async (userId) => {
  try {
    const subscriptionsRef = collection(db, 'subscriptions');
    const q = query(
      subscriptionsRef,
      where('target', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('구독자 목록 조회 실패:', error);
    return [];
  }
}; 