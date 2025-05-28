// 🚀 에디터 확장들을 동적으로 로드
export const loadEditorExtensions = async () => {
  try {
    console.log('에디터 확장 로드 시작...');
    const { createEditorExtensions } = await import('../editorExtensions');
    const extensions = createEditorExtensions();
    
    // 확장이 제대로 로드되었는지 확인
    if (!extensions || extensions.length === 0) {
      throw new Error('에디터 확장이 비어있습니다');
    }
    
    console.log('에디터 확장 로드 성공:', extensions.length, '개');
    return extensions;
  } catch (error) {
    console.error('에디터 확장 로드 실패:', error);
    
    // 폴백: 기본 StarterKit만 사용
    console.log('폴백: 기본 StarterKit 사용');
    const StarterKit = await import('@tiptap/starter-kit');
    return [StarterKit.default];
  }
};

// 카테고리 목록
export const categories = [
  "일상",
  "기술",
  "여행",
  "음식",
  "영화/드라마",
  "음악",
  "독서",
  "취미",
  "기타",
]; 