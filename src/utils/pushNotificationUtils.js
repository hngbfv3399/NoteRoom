/**
 * 브라우저 푸시 알림 유틸리티
 * 네이티브 브라우저 알림 및 PWA 푸시 알림을 관리합니다.
 */

import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';

// VAPID 공개 키 (실제 프로덕션에서는 환경변수로 관리)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLuxazjqAKUrXKffi_7TnTTXK1qNMFwremT-jRE6RlxySJZfQOVm8E';

let swRegistration = null;

// Service Worker 등록
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('이 브라우저는 Service Worker를 지원하지 않습니다.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker 등록 성공:', registration);
    swRegistration = registration;
    return registration;
  } catch (error) {
    console.error('Service Worker 등록 실패:', error);
    return null;
  }
};

// 푸시 구독 생성
export const subscribeToPush = async () => {
  if (!swRegistration) {
    console.warn('Service Worker가 등록되지 않았습니다.');
    return null;
  }

  try {
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('푸시 구독 성공:', subscription);
    
    // Firestore에 구독 정보 저장
    const currentUser = auth.currentUser;
    if (currentUser) {
      await savePushSubscriptionToFirestore(currentUser.uid, subscription);
    }
    
    return subscription;
  } catch (error) {
    console.error('푸시 구독 실패:', error);
    return null;
  }
};

// Base64 URL을 Uint8Array로 변환
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 알림 권한 요청
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('이 브라우저는 알림을 지원하지 않습니다.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('알림 권한이 거부되었습니다.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('알림 권한 요청 실패:', error);
    return false;
  }
};

// PWA 푸시 알림 전송 (Service Worker 통해)
export const sendPWAPushNotification = async (title, options = {}) => {
  if (!swRegistration) {
    console.warn('Service Worker가 등록되지 않았습니다.');
    return null;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return null;
  }

  const defaultOptions = {
    body: options.body || '',
    icon: options.icon || '/notes.svg',
    badge: options.badge || '/notes.svg',
    tag: options.tag || 'noteroom-notification',
    data: options.data || {},
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: '열기'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ],
    ...options
  };

  try {
    await swRegistration.showNotification(title, defaultOptions);
    return true;
  } catch (error) {
    console.error('PWA 푸시 알림 전송 실패:', error);
    return false;
  }
};

// 브라우저 푸시 알림 표시 (기존 방식)
export const showBrowserNotification = async (title, options = {}) => {
  // 권한 확인
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return null;
  }

  // 기본 옵션 설정
  const defaultOptions = {
    icon: '/notes.svg',
    badge: '/notes.svg',
    tag: 'noteroom-notification',
    requireInteraction: false,
    silent: false,
    ...options
  };

  try {
    const notification = new Notification(title, defaultOptions);
    
    // 알림 클릭 이벤트
    notification.onclick = (event) => {
      event.preventDefault();
      
      // 브라우저 창 포커스
      window.focus();
      
      // 알림 닫기
      notification.close();
      
      // 콜백 함수 실행
      if (options.onClick) {
        options.onClick();
      }
    };

    // 자동으로 5초 후 닫기
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  } catch (error) {
    console.error('브라우저 알림 표시 실패:', error);
    return null;
  }
};

// 통합 알림 전송 함수 (PWA 우선, 실패 시 브라우저 알림)
export const showNotification = async (title, options = {}) => {
  // PWA 푸시 알림 시도
  const pwaResult = await sendPWAPushNotification(title, options);
  
  if (pwaResult) {
    return { type: 'pwa', success: true };
  }

  // PWA 실패 시 브라우저 알림 시도
  const browserResult = await showBrowserNotification(title, options);
  
  if (browserResult) {
    return { type: 'browser', success: true };
  }

  return { type: 'none', success: false };
};

// 댓글 알림
export const showCommentNotification = async (authorName, noteTitle, noteId) => {
  return showNotification(
    `${authorName}님이 댓글을 달았습니다`,
    {
      body: `"${noteTitle.length > 30 ? noteTitle.substring(0, 30) + '...' : noteTitle}"`,
      icon: '/notes.svg',
      tag: `comment-${noteId}`,
      data: { url: `/note/${noteId}`, type: 'comment', noteId },
      onClick: () => {
        window.location.href = `/note/${noteId}`;
      }
    }
  );
};

// 대댓글 알림
export const showReplyNotification = async (authorName, commentPreview, noteId) => {
  return showNotification(
    `${authorName}님이 답글을 달았습니다`,
    {
      body: commentPreview.length > 50 ? commentPreview.substring(0, 50) + '...' : commentPreview,
      icon: '/notes.svg',
      tag: `reply-${noteId}`,
      data: { url: `/note/${noteId}`, type: 'reply', noteId },
      onClick: () => {
        window.location.href = `/note/${noteId}`;
      }
    }
  );
};

// 멘션 알림
export const showMentionNotification = async (authorName, content, noteId) => {
  return showNotification(
    `${authorName}님이 회원님을 언급했습니다`,
    {
      body: content.length > 50 ? content.substring(0, 50) + '...' : content,
      icon: '/notes.svg',
      tag: `mention-${noteId}`,
      data: { url: `/note/${noteId}`, type: 'mention', noteId },
      onClick: () => {
        window.location.href = `/note/${noteId}`;
      }
    }
  );
};

// 새 노트 알림
export const showNewNoteNotification = async (authorName, noteTitle, noteId) => {
  return showNotification(
    `${authorName}님이 새로운 노트를 작성했습니다`,
    {
      body: noteTitle.length > 50 ? noteTitle.substring(0, 50) + '...' : noteTitle,
      icon: '/notes.svg',
      tag: `new-note-${noteId}`,
      data: { url: `/note/${noteId}`, type: 'new_note', noteId },
      onClick: () => {
        window.location.href = `/note/${noteId}`;
      }
    }
  );
};

// 알림 권한 상태 확인
export const getNotificationPermission = () => {
  if (!('Notification' in window)) {
    return 'not-supported';
  }
  return Notification.permission;
};

// 알림 설정 초기화 (앱 시작 시 호출)
export const initializeNotifications = async () => {
  // Service Worker 등록
  await registerServiceWorker();
  
  const permission = getNotificationPermission();
  
  if (permission === 'default') {
    // 사용자에게 알림 권한 요청 여부 묻기
    const shouldRequest = window.confirm(
      'NoteRoom에서 새로운 알림을 받으시겠습니까?\n댓글, 멘션, 새 노트 등의 알림을 실시간으로 받을 수 있습니다.'
    );
    
    if (shouldRequest) {
      const granted = await requestNotificationPermission();
      if (granted) {
        // 푸시 구독 생성
        await subscribeToPush();
      }
    }
  } else if (permission === 'granted') {
    // 이미 권한이 있으면 푸시 구독 생성
    await subscribeToPush();
  }
  
  return getNotificationPermission();
};

// 푸시 구독 해제
export const unsubscribeFromPush = async () => {
  if (!swRegistration) {
    return false;
  }

  try {
    const subscription = await swRegistration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      
      // Firestore에서 구독 정보 삭제
      const currentUser = auth.currentUser;
      if (currentUser) {
        await deletePushSubscriptionFromFirestore(currentUser.uid);
      }
      
      console.log('푸시 구독 해제 성공');
      return true;
    }
  } catch (error) {
    console.error('푸시 구독 해제 실패:', error);
  }
  
  return false;
};

// Firestore에 푸시 구독 정보 저장
export const savePushSubscriptionToFirestore = async (userId, subscription) => {
  try {
    const subscriptionData = {
      userId: userId,
      subscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    await setDoc(doc(db, 'pushSubscriptions', userId), subscriptionData);
    console.log('푸시 구독 정보 Firestore 저장 성공');
    return true;
  } catch (error) {
    console.error('푸시 구독 정보 Firestore 저장 실패:', error);
    return false;
  }
};

// Firestore에서 푸시 구독 정보 삭제
export const deletePushSubscriptionFromFirestore = async (userId) => {
  try {
    await deleteDoc(doc(db, 'pushSubscriptions', userId));
    console.log('푸시 구독 정보 Firestore 삭제 성공');
    return true;
  } catch (error) {
    console.error('푸시 구독 정보 Firestore 삭제 실패:', error);
    return false;
  }
};

// Firestore에서 푸시 구독 정보 조회
export const getPushSubscriptionFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'pushSubscriptions', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log('푸시 구독 정보가 없습니다.');
      return null;
    }
  } catch (error) {
    console.error('푸시 구독 정보 조회 실패:', error);
    return null;
  }
}; 