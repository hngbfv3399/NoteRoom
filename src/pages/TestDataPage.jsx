import React, { useState } from 'react';
import { fetchAllUsers, fetchAllNotes, fetchAllData, fetchAllNotesWithSubCollections } from '@/utils/testDataFetch';
import { upgradeDataStructure } from '@/utils/dataStructureUpgrade';

function TestDataPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [upgradeComplete, setUpgradeComplete] = useState(false);

  const handleFetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchAllUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchAllNotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchAllData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAllWithSubCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchAllNotesWithSubCollections();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeStructure = async () => {
    if (!window.confirm('데이터 구조를 개선하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setUpgradeComplete(false);
    
    try {
      await upgradeDataStructure();
      setUpgradeComplete(true);
      // 업그레이드 후 최신 데이터 가져오기
      await fetchAllNotesWithSubCollections();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">데이터 테스트 페이지</h1>
      
      <div className="space-y-4">
        <div className="space-x-4">
          <button
            onClick={handleFetchUsers}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            사용자 데이터 가져오기
          </button>
          
          <button
            onClick={handleFetchNotes}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            노트 데이터 가져오기
          </button>
          
          <button
            onClick={handleFetchAll}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
          >
            전체 데이터 가져오기
          </button>

          <button
            onClick={handleFetchAllWithSubCollections}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
          >
            노트 하위 컬렉션 포함 가져오기
          </button>
        </div>

        <div className="border-t pt-4">
          <button
            onClick={handleUpgradeStructure}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
          >
            데이터 구조 개선하기
          </button>
          {upgradeComplete && (
            <span className="ml-4 text-green-600">
              ✓ 데이터 구조 개선이 완료되었습니다!
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="mt-4 text-gray-600">데이터를 처리하는 중...</div>
      )}

      {error && (
        <div className="mt-4 text-red-500">
          에러 발생: {error}
        </div>
      )}

      <div className="mt-4">
        <p className="text-gray-600">콘솔을 확인해주세요 (F12 또는 개발자 도구)</p>
      </div>
    </div>
  );
}

export default TestDataPage; 