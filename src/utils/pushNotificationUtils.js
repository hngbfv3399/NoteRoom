/**
 * 브라우저 푸시 알림 유틸리티
 * 네이티브 브라우저 알림을 관리합니다.
 */

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

// 브라우저 푸시 알림 표시
export const showBrowserNotification = async (title, options = {}) => {
  // 권한 확인
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return null;
  }

  // 기본 옵션 설정
  const defaultOptions = {
    icon: '/favicon.ico', // 앱 아이콘
    badge: '/favicon.ico', // 배지 아이콘
    tag: 'noteroom-notification', // 알림 그룹핑
    requireInteraction: false, // 자동으로 사라짐
    silent: false, // 소리 재생
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

// 알림 타입별 아이콘 매핑
const getNotificationIcon = (type) => {
  const iconMap = {
    comment: '💬',
    reply: '↩️',
    mention: '📢',
    new_note: '📝',
    like: '❤️',
    follow: '👥'
  };
  return iconMap[type] || '🔔';
};

// 댓글 알림
export const showCommentNotification = async (authorName, noteTitle, noteId) => {
  return showBrowserNotification(
    `${authorName}님이 댓글을 달았습니다`,
    {
      body: `"${noteTitle.length > 30 ? noteTitle.substring(0, 30) + '...' : noteTitle}"`,
      icon: '/favicon.ico',
      tag: `comment-${noteId}`,
      onClick: () => {
        window.location.href = `/note/${noteId}`;
      }
    }
  );
};

// 대댓글 알림
export const showReplyNotification = async (authorName, commentPreview, noteId) => {
  return showBrowserNotification(
    `${authorName}님이 답글을 달았습니다`,
    {
      body: commentPreview.length > 50 ? commentPreview.substring(0, 50) + '...' : commentPreview,
      icon: '/favicon.ico',
      tag: `reply-${noteId}`,
      onClick: () => {
        window.location.href = `/note/${noteId}`;
      }
    }
  );
};

// 멘션 알림
export const showMentionNotification = async (authorName, content, noteId) => {
  return showBrowserNotification(
    `${authorName}님이 회원님을 언급했습니다`,
    {
      body: content.length > 50 ? content.substring(0, 50) + '...' : content,
      icon: '/favicon.ico',
      tag: `mention-${noteId}`,
      onClick: () => {
        window.location.href = `/note/${noteId}`;
      }
    }
  );
};

// 새 노트 알림
export const showNewNoteNotification = async (authorName, noteTitle, noteId) => {
  return showBrowserNotification(
    `${authorName}님이 새로운 노트를 작성했습니다`,
    {
      body: noteTitle.length > 50 ? noteTitle.substring(0, 50) + '...' : noteTitle,
      icon: '/favicon.ico',
      tag: `new-note-${noteId}`,
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
  const permission = getNotificationPermission();
  
  if (permission === 'default') {
    // 사용자에게 알림 권한 요청 여부 묻기
    const shouldRequest = window.confirm(
      'NoteRoom에서 새로운 알림을 받으시겠습니까?\n댓글, 멘션, 새 노트 등의 알림을 실시간으로 받을 수 있습니다.'
    );
    
    if (shouldRequest) {
      await requestNotificationPermission();
    }
  }
  
  return getNotificationPermission();
}; 