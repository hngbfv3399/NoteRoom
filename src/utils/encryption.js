/**
 * 감정 일기 암호화/복호화 유틸리티
 * 
 * 주요 기능:
 * - AES-GCM 암호화 사용
 * - 사용자별 고유 키 생성
 * - 안전한 일기 내용 보호
 */

// 사용자 UID를 기반으로 암호화 키 생성
const generateKey = async (userUid) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(userUid + 'noteroom_emotion_diary_key_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  return await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * 감정 일기 내용 암호화
 * @param {string} text - 암호화할 텍스트
 * @param {string} userUid - 사용자 UID
 * @returns {Promise<string>} 암호화된 데이터 (Base64)
 */
export const encryptEmotionNote = async (text, userUid) => {
  try {
    if (!text || !userUid) return text;
    
    const key = await generateKey(userUid);
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // 랜덤 IV 생성
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // 암호화
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );
    
    // IV + 암호화된 데이터를 결합하여 Base64로 인코딩
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('암호화 실패:', error);
    return text; // 암호화 실패 시 원본 반환
  }
};

/**
 * 감정 일기 내용 복호화
 * @param {string} encryptedText - 암호화된 텍스트 (Base64)
 * @param {string} userUid - 사용자 UID
 * @returns {Promise<string>} 복호화된 텍스트
 */
export const decryptEmotionNote = async (encryptedText, userUid) => {
  try {
    if (!encryptedText || !userUid) return encryptedText;
    
    // Base64 디코딩이 가능한지 확인 (암호화된 데이터인지 체크)
    try {
      atob(encryptedText);
    } catch {
      // Base64가 아니면 평문으로 간주
      return encryptedText;
    }
    
    const key = await generateKey(userUid);
    
    // Base64 디코딩
    const combined = new Uint8Array(
      atob(encryptedText).split('').map(char => char.charCodeAt(0))
    );
    
    // IV와 암호화된 데이터 분리
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // 복호화
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('복호화 실패:', error);
    return encryptedText; // 복호화 실패 시 원본 반환
  }
};

/**
 * 감정 일기 배열 암호화
 * @param {Array} emotions - 감정 기록 배열
 * @param {string} userUid - 사용자 UID
 * @returns {Promise<Array>} 암호화된 감정 기록 배열
 */
export const encryptEmotionArray = async (emotions, userUid) => {
  if (!Array.isArray(emotions) || !userUid) return emotions;
  
  const encryptedEmotions = await Promise.all(
    emotions.map(async (emotion) => {
      if (emotion.note) {
        return {
          ...emotion,
          note: await encryptEmotionNote(emotion.note, userUid),
          encrypted: true // 암호화 플래그
        };
      }
      return emotion;
    })
  );
  
  return encryptedEmotions;
};

/**
 * 감정 일기 배열 복호화
 * @param {Array} emotions - 암호화된 감정 기록 배열
 * @param {string} userUid - 사용자 UID
 * @returns {Promise<Array>} 복호화된 감정 기록 배열
 */
export const decryptEmotionArray = async (emotions, userUid) => {
  if (!Array.isArray(emotions) || !userUid) return emotions;
  
  const decryptedEmotions = await Promise.all(
    emotions.map(async (emotion) => {
      // 감정 일기의 content 필드 복호화
      if (emotion.content && emotion.encrypted) {
        console.log('🔓 [복호화] 시도:', emotion.content);
        const decryptedContent = await decryptEmotionNote(emotion.content, userUid);
        console.log('✅ [복호화] 완료:', decryptedContent);
        return {
          ...emotion,
          content: decryptedContent,
          encrypted: false // 복호화 플래그
        };
      }
      // 기존 note 필드도 지원 (하위 호환성)
      if (emotion.note && emotion.encrypted) {
        return {
          ...emotion,
          note: await decryptEmotionNote(emotion.note, userUid),
          encrypted: false // 복호화 플래그
        };
      }
      return emotion;
    })
  );
  
  return decryptedEmotions;
};

/**
 * 브라우저 암호화 지원 여부 확인
 * @returns {boolean} 지원 여부
 */
export const isCryptoSupported = () => {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.getRandomValues !== 'undefined';
};

/**
 * 암호화 테스트
 * @param {string} userUid - 사용자 UID
 * @returns {Promise<boolean>} 테스트 성공 여부
 */
export const testEncryption = async (userUid) => {
  try {
    const testText = '테스트 감정 일기 내용';
    const encrypted = await encryptEmotionNote(testText, userUid);
    const decrypted = await decryptEmotionNote(encrypted, userUid);
    
    return testText === decrypted;
  } catch (error) {
    console.error('암호화 테스트 실패:', error);
    return false;
  }
}; 