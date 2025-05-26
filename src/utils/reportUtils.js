/**
 * 신고 시스템 유틸리티
 * 콘텐츠 신고, 신고 내역 조회 등의 기능을 제공합니다.
 */

import { collection, addDoc, query, where, getDocs, doc, getDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { REPORT_TYPES, REPORT_REASONS, REPORT_STATUS } from '@/constants/adminConstants';

// 콘텐츠 신고하기
export const reportContent = async (contentType, contentId, reason, description, reportedBy) => {
  try {
    // 이미 신고한 콘텐츠인지 확인
    const existingReportQuery = query(
      collection(db, 'reports'),
      where('contentType', '==', contentType),
      where('contentId', '==', contentId),
      where('reportedBy', '==', reportedBy)
    );
    
    const existingReports = await getDocs(existingReportQuery);
    
    if (!existingReports.empty) {
      throw new Error('이미 신고한 콘텐츠입니다.');
    }

    // 신고 데이터 생성
    const reportData = {
      contentType,
      contentId,
      reason,
      description: description || '',
      reportedBy,
      status: REPORT_STATUS.PENDING,
      createdAt: Timestamp.now(),
      processedAt: null,
      adminNote: ''
    };

    // 신고 저장
    const reportRef = await addDoc(collection(db, 'reports'), reportData);

    // 신고 통계 업데이트 (선택적)
    await updateReportStats(contentType, contentId);

    return {
      success: true,
      reportId: reportRef.id,
      message: '신고가 접수되었습니다. 검토 후 조치하겠습니다.'
    };

  } catch (error) {
    console.error('콘텐츠 신고 실패:', error);
    return {
      success: false,
      message: error.message || '신고 접수 중 오류가 발생했습니다.'
    };
  }
};

// 사용자 신고 내역 조회
export const getUserReports = async (userId) => {
  try {
    const reportsQuery = query(
      collection(db, 'reports'),
      where('reportedBy', '==', userId)
    );

    const reportsSnapshot = await getDocs(reportsQuery);
    const reports = [];

    for (const reportDoc of reportsSnapshot.docs) {
      const reportData = reportDoc.data();
      
      // 신고된 콘텐츠 정보 가져오기
      let contentData = null;
      try {
        if (reportData.contentType === REPORT_TYPES.NOTE) {
          const noteDoc = await getDoc(doc(db, 'notes', reportData.contentId));
          contentData = noteDoc.exists() ? {
            title: noteDoc.data().title,
            author: noteDoc.data().author
          } : null;
        } else if (reportData.contentType === REPORT_TYPES.COMMENT) {
          const commentDoc = await getDoc(doc(db, 'comments', reportData.contentId));
          contentData = commentDoc.exists() ? {
            content: commentDoc.data().content?.substring(0, 100) + '...',
            author: commentDoc.data().author
          } : null;
        }
      } catch (error) {
        console.warn('콘텐츠 정보 조회 실패:', error);
      }

      reports.push({
        id: reportDoc.id,
        ...reportData,
        contentData,
        createdAt: reportData.createdAt?.toDate?.() || new Date(),
        processedAt: reportData.processedAt?.toDate?.() || null
      });
    }

    // 최신순으로 정렬
    reports.sort((a, b) => b.createdAt - a.createdAt);

    return reports;

  } catch (error) {
    console.error('사용자 신고 내역 조회 실패:', error);
    return [];
  }
};

// 특정 콘텐츠의 신고 수 조회
export const getContentReportCount = async (contentType, contentId) => {
  try {
    const reportsQuery = query(
      collection(db, 'reports'),
      where('contentType', '==', contentType),
      where('contentId', '==', contentId)
    );

    const reportsSnapshot = await getDocs(reportsQuery);
    return reportsSnapshot.size;

  } catch (error) {
    console.error('콘텐츠 신고 수 조회 실패:', error);
    return 0;
  }
};

// 신고 통계 업데이트 (내부 함수)
const updateReportStats = async (contentType, contentId) => {
  try {
    // 해당 콘텐츠의 총 신고 수 계산
    const reportCount = await getContentReportCount(contentType, contentId);
    
    // 신고 수가 일정 수준 이상이면 자동으로 검토 대상으로 표시
    if (reportCount >= 5) {
      console.log(`콘텐츠 ${contentId}가 ${reportCount}회 신고되어 우선 검토 대상입니다.`);
      // 여기에 자동 검토 로직 추가 가능
    }

  } catch (error) {
    console.error('신고 통계 업데이트 실패:', error);
  }
};

// 신고 사유 검증
export const validateReportReason = (reason) => {
  return Object.values(REPORT_REASONS).includes(reason);
};

// 신고 가능한 콘텐츠 타입 검증
export const validateContentType = (contentType) => {
  return Object.values(REPORT_TYPES).includes(contentType);
};

// 신고 취소 (아직 처리되지 않은 경우만)
export const cancelReport = async (reportId, userId) => {
  try {
    const reportDoc = await getDoc(doc(db, 'reports', reportId));
    
    if (!reportDoc.exists()) {
      throw new Error('신고를 찾을 수 없습니다.');
    }

    const reportData = reportDoc.data();
    
    // 신고자 본인인지 확인
    if (reportData.reportedBy !== userId) {
      throw new Error('본인이 신고한 내용만 취소할 수 있습니다.');
    }

    // 이미 처리된 신고인지 확인
    if (reportData.status !== REPORT_STATUS.PENDING) {
      throw new Error('이미 처리된 신고는 취소할 수 없습니다.');
    }

    // 신고 취소 (삭제)
    await deleteDoc(doc(db, 'reports', reportId));

    return {
      success: true,
      message: '신고가 취소되었습니다.'
    };

  } catch (error) {
    console.error('신고 취소 실패:', error);
    return {
      success: false,
      message: error.message || '신고 취소 중 오류가 발생했습니다.'
    };
  }
}; 