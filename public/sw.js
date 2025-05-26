/**
 * NoteRoom Service Worker
 * PWA 푸시 알림 및 오프라인 기능을 제공합니다.
 */

const CACHE_NAME = 'noteroom-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('Service Worker 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('캐시 열기 성공');
        return cache.addAll(urlsToCache);
      })
  );
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('Service Worker 활성화됨');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('오래된 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 네트워크 요청 가로채기 (오프라인 지원)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 있으면 캐시에서 반환
        if (response) {
          return response;
        }
        // 없으면 네트워크에서 가져오기
        return fetch(event.request);
      }
    )
  );
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  console.log('푸시 알림 수신:', event);
  
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
  console.log('알림 클릭됨:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // 알림 데이터에서 URL 추출
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // 이미 열린 탭이 있는지 확인
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      
      // 열린 탭이 없으면 새 탭 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', (event) => {
  console.log('백그라운드 동기화:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 백그라운드에서 수행할 작업
      console.log('백그라운드 동기화 수행')
    );
  }
});

// 메시지 수신 (앱에서 Service Worker로 메시지 전송 시)
self.addEventListener('message', (event) => {
  console.log('Service Worker 메시지 수신:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 