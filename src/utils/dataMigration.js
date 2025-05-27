/**
 * 데이터 마이그레이션 유틸리티
 * 
 * 기존 노트 데이터를 새로운 구조로 마이그레이션합니다.
 * - 누락된 필드 추가 (views, likes, commentCount, isPublic)
 * - userUid 필드 통일
 * - 데이터 구조 정규화
 */

import { 
  collection, 
  getDocs, 
  doc, 
  writeBatch,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/services/firebase';

// 기존 노트 데이터 구조 분석
export const analyzeExistingNotes = async () => {
  console.log('=== 기존 노트 데이터 구조 분석 시작 ===');
  
  try {
    const notesQuery = query(
      collection(db, 'notes'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const querySnapshot = await getDocs(notesQuery);
    const analysis = {
      totalChecked: querySnapshot.size,
      missingFields: {
        views: 0,
        likes: 0,
        commentCount: 0,
        isPublic: 0,
        userUid: 0
      },
      fieldTypes: {},
      sampleData: []
    };
    
    querySnapshot.docs.forEach((docSnapshot, index) => {
      const data = docSnapshot.data();
      const fields = Object.keys(data);
      
      // 누락된 필드 체크
      if (!Object.prototype.hasOwnProperty.call(data, 'views')) analysis.missingFields.views++;
      if (!Object.prototype.hasOwnProperty.call(data, 'likes')) analysis.missingFields.likes++;
      if (!Object.prototype.hasOwnProperty.call(data, 'commentCount')) analysis.missingFields.commentCount++;
      if (!Object.prototype.hasOwnProperty.call(data, 'isPublic')) analysis.missingFields.isPublic++;
      if (!Object.prototype.hasOwnProperty.call(data, 'userUid') && !Object.prototype.hasOwnProperty.call(data, 'userId')) analysis.missingFields.userUid++;
      
      // 필드 타입 분석
      fields.forEach(field => {
        if (!analysis.fieldTypes[field]) {
          analysis.fieldTypes[field] = typeof data[field];
        }
      });
      
      // 샘플 데이터 저장 (처음 3개만)
      if (index < 3) {
        analysis.sampleData.push({
          id: docSnapshot.id,
          fields: fields,
          hasViews: Object.prototype.hasOwnProperty.call(data, 'views'),
          hasLikes: Object.prototype.hasOwnProperty.call(data, 'likes'),
          hasCommentCount: Object.prototype.hasOwnProperty.call(data, 'commentCount'),
          hasIsPublic: Object.prototype.hasOwnProperty.call(data, 'isPublic'),
          hasUserUid: Object.prototype.hasOwnProperty.call(data, 'userUid'),
          hasUserId: Object.prototype.hasOwnProperty.call(data, 'userId'),
          userIdentifier: data.userUid || data.userId || 'MISSING'
        });
      }
    });
    
    console.log('분석 결과:', analysis);
    return analysis;
    
  } catch (error) {
    console.error('데이터 분석 실패:', error);
    throw error;
  }
};

// 노트 데이터 마이그레이션 실행
export const migrateNoteData = async (dryRun = true) => {
  console.log(`=== 노트 데이터 마이그레이션 ${dryRun ? '(시뮬레이션)' : '(실제 실행)'} ===`);
  
  try {
    const notesQuery = query(collection(db, 'notes'));
    const querySnapshot = await getDocs(notesQuery);
    
    const migrationStats = {
      totalNotes: querySnapshot.size,
      needsMigration: 0,
      migrated: 0,
      errors: 0,
      changes: []
    };
    
    // 배치 작업 준비
    const batch = writeBatch(db);
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore 배치 제한
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const noteId = docSnapshot.id;
      const updates = {};
      let needsUpdate = false;
      
      // 1. views 필드 추가
      if (!Object.prototype.hasOwnProperty.call(data, 'views')) {
        updates.views = 0;
        needsUpdate = true;
        migrationStats.changes.push(`${noteId}: views 필드 추가`);
      }
      
      // 2. likes 필드 추가
      if (!Object.prototype.hasOwnProperty.call(data, 'likes')) {
        updates.likes = 0;
        needsUpdate = true;
        migrationStats.changes.push(`${noteId}: likes 필드 추가`);
      }
      
      // 3. commentCount 필드 추가
      if (!Object.prototype.hasOwnProperty.call(data, 'commentCount')) {
        // 기존 comment 배열이 있으면 그 길이를, 없으면 0
        const commentCount = Array.isArray(data.comment) ? data.comment.length : 0;
        updates.commentCount = commentCount;
        needsUpdate = true;
        migrationStats.changes.push(`${noteId}: commentCount 필드 추가 (${commentCount})`);
      }
      
      // 4. isPublic 필드 추가 (기본값: true)
      if (!Object.prototype.hasOwnProperty.call(data, 'isPublic')) {
        updates.isPublic = true;
        needsUpdate = true;
        migrationStats.changes.push(`${noteId}: isPublic 필드 추가`);
      }
      
      // 5. userUid 필드 통일
      if (!data.hasOwnProperty('userUid') && data.hasOwnProperty('userId')) {
        updates.userUid = data.userId;
        needsUpdate = true;
        migrationStats.changes.push(`${noteId}: userId를 userUid로 복사`);
      }
      
      // 6. 마이그레이션 타임스탬프 추가
      if (needsUpdate) {
        updates.migratedAt = serverTimestamp();
        migrationStats.needsMigration++;
        
        if (!dryRun) {
          const noteRef = doc(db, 'notes', noteId);
          batch.update(noteRef, updates);
          batchCount++;
          
          // 배치 크기 제한 확인
          if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            console.log(`배치 ${Math.ceil(migrationStats.migrated / BATCH_SIZE)} 완료`);
            batchCount = 0;
          }
        }
        
        migrationStats.migrated++;
      }
    }
    
    // 남은 배치 커밋
    if (!dryRun && batchCount > 0) {
      await batch.commit();
      console.log('최종 배치 완료');
    }
    
    console.log('마이그레이션 통계:', migrationStats);
    return migrationStats;
    
  } catch (error) {
    console.error('마이그레이션 실패:', error);
    throw error;
  }
};

// 마이그레이션 검증
export const verifyMigration = async () => {
  console.log('=== 마이그레이션 검증 ===');
  
  try {
    const notesQuery = query(collection(db, 'notes'), limit(10));
    const querySnapshot = await getDocs(notesQuery);
    
    const verification = {
      totalChecked: querySnapshot.size,
      allHaveRequiredFields: true,
      missingFields: [],
      sampleData: []
    };
    
    const requiredFields = ['views', 'likes', 'commentCount', 'isPublic', 'userUid'];
    
    querySnapshot.docs.forEach((docSnapshot, index) => {
      const data = docSnapshot.data();
      const missing = [];
      
      requiredFields.forEach(field => {
        if (!data.hasOwnProperty(field)) {
          missing.push(field);
          verification.allHaveRequiredFields = false;
        }
      });
      
      if (missing.length > 0) {
        verification.missingFields.push({
          noteId: docSnapshot.id,
          missing: missing
        });
      }
      
      if (index < 3) {
        verification.sampleData.push({
          id: docSnapshot.id,
          views: data.views,
          likes: data.likes,
          commentCount: data.commentCount,
          isPublic: data.isPublic,
          userUid: data.userUid,
          migratedAt: data.migratedAt
        });
      }
    });
    
    console.log('검증 결과:', verification);
    return verification;
    
  } catch (error) {
    console.error('검증 실패:', error);
    throw error;
  }
};

// 전체 마이그레이션 프로세스
export const runFullMigration = async () => {
  console.log('=== 전체 마이그레이션 프로세스 시작 ===');
  
  try {
    // 1. 현재 상태 분석
    console.log('1단계: 현재 데이터 분석...');
    const analysis = await analyzeExistingNotes();
    
    // 2. 시뮬레이션 실행
    console.log('2단계: 마이그레이션 시뮬레이션...');
    const simulation = await migrateNoteData(true);
    
    // 3. 사용자 확인 (콘솔에서 수동으로 확인)
    console.log('3단계: 실제 마이그레이션 실행 여부를 확인하세요.');
    console.log('실행하려면: runActualMigration() 함수를 호출하세요.');
    
    return {
      analysis,
      simulation,
      readyForMigration: simulation.needsMigration > 0
    };
    
  } catch (error) {
    console.error('마이그레이션 프로세스 실패:', error);
    throw error;
  }
};

// 실제 마이그레이션 실행
export const runActualMigration = async () => {
  console.log('=== 실제 마이그레이션 실행 ===');
  
  try {
    // 실제 마이그레이션 실행
    const result = await migrateNoteData(false);
    
    // 검증
    console.log('마이그레이션 완료. 검증 중...');
    const verification = await verifyMigration();
    
    return {
      migration: result,
      verification: verification,
      success: verification.allHaveRequiredFields
    };
    
  } catch (error) {
    console.error('실제 마이그레이션 실패:', error);
    throw error;
  }
};

// 브라우저 콘솔에서 사용할 수 있도록 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.analyzeExistingNotes = analyzeExistingNotes;
  window.runFullMigration = runFullMigration;
  window.runActualMigration = runActualMigration;
  window.verifyMigration = verifyMigration;
} 