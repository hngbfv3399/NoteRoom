/**
 * 브라우저 푸시 알림 유틸리티
 * 네이티브 브라우저 알림 및 PWA 푸시 알림을 관리합니다.
 */

import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';

// VAPID 공개 키 (환경변수에서 가져오기, 없으면 기본값 사용)
// 🔑 Firebase Console에서 확인한 정확한 VAPID 키
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BJNZw1mDk66nKI5Nge3jRgp5PmWOVOJy9zFZ9BRgyWLiJlZOASQVOw3vw-abPWXTg6wEDkkE9pGiXhKPE8GChWw';

// 🚨 VAPID 키 정보:
// - Firebase Console > 프로젝트 설정 > 클라우드 메시징에서 확인됨
// - 상태: 활성 (2025. 5. 27. 추가됨)
// - 환경변수로 설정하려면: VITE_VAPID_PUBLIC_KEY=위의키값

let swRegistration = null;

// Service Worker 등록 (Workbox와 충돌 방지)
export const registerServiceWorker = async () => {
  // Service Worker 지원 확인 (더 정확한 감지)
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker) {
    console.warn('이 브라우저는 Service Worker를 지원하지 않습니다.');
    return null;
  }

  // HTTPS 환경 확인 (localhost 제외)
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    console.warn('Service Worker는 HTTPS 환경에서만 작동합니다.');
    return null;
  }

  try {
    // 기존 등록된 Service Worker 확인
    let registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      // 새로운 Service Worker 등록
      registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      console.log('Service Worker 등록 성공:', registration);
    } else {
      console.log('기존 Service Worker 사용:', registration);
    }
    
    // Service Worker가 활성화될 때까지 대기
    if (registration.installing) {
      await new Promise((resolve) => {
        const worker = registration.installing;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') {
            resolve();
          }
        });
      });
    }
    
    // Service Worker 준비 상태 확인
    await navigator.serviceWorker.ready;
    
    swRegistration = registration;
    return registration;
  } catch (error) {
    console.error('Service Worker 등록 실패:', error);
    
    // 구체적인 오류 메시지 제공
    if (error.name === 'SecurityError') {
      console.error('보안 오류: HTTPS 환경에서만 Service Worker를 사용할 수 있습니다.');
    } else if (error.name === 'TypeError') {
      console.error('타입 오류: Service Worker 파일을 찾을 수 없습니다.');
    }
    
    return null;
  }
};

// 푸시 구독 생성
export const subscribeToPush = async () => {
  try {
    console.log('푸시 구독 시작...');
    
    if (!swRegistration) {
      console.log('Service Worker 재등록 시도...');
      swRegistration = await registerServiceWorker();
      if (!swRegistration) {
        console.error('Service Worker 등록 실패');
        return null;
      }
    }

    // 기존 구독 확인
    const existingSubscription = await swRegistration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('기존 푸시 구독 사용:', existingSubscription);
      return existingSubscription;
    }

    // VAPID 키 유효성 검사
    if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.length < 80) {
      console.error('VAPID 키가 올바르지 않습니다. Firebase Console에서 새로운 키를 생성해주세요.');
      throw new Error('Invalid VAPID key format');
    }

    console.log('VAPID 키 사용:', VAPID_PUBLIC_KEY.substring(0, 20) + '...');

    // 새 구독 생성
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
    
    // VAPID 키 관련 오류인지 확인
    if (error.message.includes('Invalid raw ECDSA P-256 public key') || 
        error.message.includes('Invalid VAPID key') ||
        error.name === 'InvalidStateError') {
      console.error('🔑 VAPID 키 오류 해결 방법:');
      console.error('1. Firebase Console > 프로젝트 설정 > 클라우드 메시징');
      console.error('2. 웹 구성에서 "키 쌍 생성" 클릭');
      console.error('3. 새로 생성된 키를 코드에 적용');
      console.error('4. 현재 키:', VAPID_PUBLIC_KEY.substring(0, 20) + '...');
      
      // 사용자에게 친화적인 오류 메시지 표시
      if (typeof window !== 'undefined' && window.alert) {
        alert('푸시 알림 설정 중 VAPID 키 오류가 발생했습니다.\n\n해결 방법:\n1. Firebase Console에서 새 VAPID 키 생성\n2. 개발자에게 키 업데이트 요청');
      }
    }
    
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