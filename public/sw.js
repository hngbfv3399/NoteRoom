/**
 * NoteRoom Service Worker
 * PWA 푸시 알림 및 오프라인 기능을 제공합니다.
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Workbox 사전 캐싱 설정
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 캐시 이름
const CACHE_NAME = 'noteroom-v1';

// 정적 리소스 캐싱 (이미지, 폰트 등)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30일
      }),
    ],
  })
);

// Google Fonts 캐싱
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1년
      }),
    ],
  })
);

// Firestore 요청 처리 - 실시간 리스너는 완전히 제외
registerRoute(
  ({ url, request }) => {
    // Firestore 도메인이 아니면 처리하지 않음
    if (url.hostname !== 'firestore.googleapis.com') {
      return false;
    }
    
    // 실시간 리스너 관련 요청들은 Service Worker가 처리하지 않음
    const isRealtimeRequest = 
      url.pathname.includes('/Listen/') ||
      url.pathname.includes('/channel') ||
      url.search.includes('Listen') ||
      url.search.includes('channel') ||
      request.method === 'POST' && url.pathname.includes('/Firestore/');
    
    if (isRealtimeRequest) {
      return false; // Service Worker가 처리하지 않음
    }
    
    // 일반 Firestore 요청만 처리
    return true;
  },
  async ({ request }) => {
    try {
      // 네트워크 우선, 실패 시 오류 반환
      const response = await fetch(request);
      
      if (!response.ok) {
        console.warn('Firestore 응답 오류:', response.status, response.statusText);
      }
      
      return response;
    } catch (error) {
      console.warn('Firestore 요청 실패:', error);
      
      // 일반 Firestore 요청 실패
      return new Response(
        JSON.stringify({ 
          error: 'Network unavailable',
          message: 'Please check your internet connection'
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
  }
);

// Service Worker 설치
self.addEventListener('install', () => {
  // 즉시 활성화
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  // 모든 클라이언트 제어
  event.waitUntil(self.clients.claim());
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      console.error('푸시 데이터 파싱 실패:', error);
      notificationData = {
        title: 'NoteRoom',
        body: event.data.text() || '새로운 알림이 있습니다.',
        icon: '/notes.svg',
        badge: '/notes.svg'
      };
    }
  } else {
    notificationData = {
      title: 'NoteRoom',
      body: '새로운 알림이 있습니다.',
      icon: '/notes.svg',
      badge: '/notes.svg'
    };
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/notes.svg',
    badge: notificationData.badge || '/notes.svg',
    tag: notificationData.tag || 'noteroom-notification',
    data: notificationData.data || {},
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: '열기',
        icon: '/notes.svg'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
 
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // 알림 데이터에서 URL 추출
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // 이미 열린 탭이 있는지 확인
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (client.navigate) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      
      // 열린 탭이 없으면 새 탭 열기
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', (event) => {
 
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 백그라운드에서 수행할 작업
     
    );
  }
});

// 메시지 수신 (앱에서 Service Worker로 메시지 전송 시)
self.addEventListener('message', (event) => {
 
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 