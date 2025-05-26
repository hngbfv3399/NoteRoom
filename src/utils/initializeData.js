/**
 * 첫 배포 시 기본 데이터를 Firebase에 초기화하는 유틸리티
 */
import { addUpdate } from '@/services/announcementService';

/**
 * 첫 배포 업데이트 내역을 Firebase에 추가
 */
export const initializeFirstRelease = async () => {
  try {
    const firstReleaseData = {
      version: "v1.0.0",
      title: "NoteRoom 첫 번째 출시! 🎉",
      changes: [
        "개인 노트 작성 및 관리 기능",
        "카테고리별 노트 분류 시스템",
        "감정 추적 및 분석 기능",
        "스마트 검색 및 필터링",
        "다양한 테마 지원",
        "반응형 디자인으로 모든 기기 지원",
        "사용자 프로필 및 설정 관리",
        "실시간 데이터 동기화"
      ],
      type: "major",
      releaseDate: new Date("2025-05-26")
    };

    await addUpdate(firstReleaseData);
    console.log("첫 배포 업데이트 내역이 성공적으로 추가되었습니다!");
    return true;
  } catch (error) {
    console.error("첫 배포 데이터 초기화 실패:", error);
    return false;
  }
};

/**
 * 관리자 페이지에서 호출할 수 있는 초기화 함수
 */
export const initializeAppData = async () => {
  const result = await initializeFirstRelease();
  if (result) {
    alert("첫 배포 데이터가 성공적으로 초기화되었습니다!");
  } else {
    alert("데이터 초기화 중 오류가 발생했습니다.");
  }
  return result;
}; 