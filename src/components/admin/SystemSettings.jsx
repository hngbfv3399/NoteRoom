/**
 * 시스템 설정 컴포넌트
 * 보안 정책, IP 차단, 키워드 필터 등의 시스템 설정을 관리합니다.
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiSettings, 
  FiShield, 
  FiFilter,
  FiGlobe,
  FiPlus,
  FiTrash2,
  FiSave,
  FiX,
  FiTool,
  FiClock
} from 'react-icons/fi';
import { 
  manageBlockedIPs, 
  manageKeywordFilters, 
  manageSystemSettings,
  dataMigration,
  maintenanceMode
} from '@/utils/adminUtils';

function SystemSettings() {
  const [activeTab, setActiveTab] = useState('security');
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [newIP, setNewIP] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [saving, setSaving] = useState(false);

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // 차단된 IP 목록 로드
      const ips = await manageBlockedIPs.getBlockedIPs();
      setBlockedIPs(ips);

      // 키워드 필터 로드
      const keywordList = await manageKeywordFilters.getKeywords();
      setKeywords(keywordList);

      // 시스템 설정 로드
      const systemSettings = await manageSystemSettings.getSettings();
      setSettings(systemSettings);

    } catch (error) {
      console.error('설정 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIP = async () => {
    if (!newIP.trim()) return;
    
    try {
      await manageBlockedIPs.blockIP(newIP, '관리자에 의한 수동 차단');
      setNewIP('');
      await loadSettings();
    } catch (error) {
      console.error('IP 차단 실패:', error);
    }
  };

  const handleUnblockIP = async (blockId) => {
    try {
      await manageBlockedIPs.unblockIP(blockId);
      await loadSettings();
    } catch (error) {
      console.error('IP 차단 해제 실패:', error);
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    
    try {
      await manageKeywordFilters.addKeyword(newKeyword, 'medium');
      setNewKeyword('');
      await loadSettings();
    } catch (error) {
      console.error('키워드 추가 실패:', error);
    }
  };

  const handleRemoveKeyword = async (keywordId) => {
    try {
      await manageKeywordFilters.removeKeyword(keywordId);
      await loadSettings();
    } catch (error) {
      console.error('키워드 삭제 실패:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await manageSystemSettings.updateSettings(settings);
    } catch (error) {
      console.error('설정 저장 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  // 서비스 점검 모드 토글
  const handleMaintenanceToggle = async (enabled) => {
    try {
      setSaving(true);
      
      if (enabled) {
        await maintenanceMode.enableMaintenance(
          settings.maintenanceMode?.message || '서비스 점검 중입니다. 잠시 후 다시 이용해주세요.',
          settings.maintenanceMode?.estimatedEndTime
        );
      } else {
        await maintenanceMode.disableMaintenance();
      }
      
      // 설정 다시 로드
      await loadSettings();
      
      if (enabled) {
        alert('서비스 점검 모드가 활성화되었습니다.');
      } else {
        alert('서비스 점검 모드가 비활성화되었습니다.');
      }
    } catch (error) {
      console.error('점검 모드 토글 실패:', error);
      alert(`점검 모드 설정 실패: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 점검 메시지 업데이트
  const handleMaintenanceMessageUpdate = async (message) => {
    try {
      setSaving(true);
      const updatedSettings = {
        ...settings,
        maintenanceMode: {
          ...settings.maintenanceMode,
          message: message
        }
      };
      
      await manageSystemSettings.updateSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('점검 메시지 업데이트 실패:', error);
      alert(`점검 메시지 업데이트 실패: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 구독 시스템 마이그레이션
  const handleSubscriptionMigration = async () => {
    if (!confirm('구독 시스템 마이그레이션을 실행하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      setSaving(true);
      
      const result = await dataMigration.migrateSubscriptionSystem();
      
      if (result.success) {
        alert(`구독 시스템 마이그레이션 완료! ${result.updatedCount}명의 사용자 데이터가 업데이트되었습니다.`);
      }
      
    } catch (error) {
      console.error('구독 시스템 마이그레이션 실패:', error);
      alert('마이그레이션 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // 알림 시스템 초기화
  const handleNotificationMigration = async () => {
    if (!confirm('알림 시스템을 초기화하시겠습니까?')) {
      return;
    }

    try {
      setSaving(true);
      
      const result = await dataMigration.initializeNotificationSystem();
      
      if (result.success) {
        alert('알림 시스템 초기화가 완료되었습니다!');
      }
      
    } catch (error) {
      console.error('알림 시스템 초기화 실패:', error);
      alert('초기화 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // 댓글 시스템 마이그레이션
  const handleCommentMigration = async () => {
    if (!confirm('댓글 시스템 마이그레이션을 실행하시겠습니까? 기존 댓글들에 ID와 대댓글 필드가 추가됩니다.')) {
      return;
    }

    setSaving(true);
    try {
      const result = await dataMigration.migrateCommentSystem();
      alert(`댓글 시스템 마이그레이션 완료! ${result.updatedNotesCount}개의 노트에서 ${result.updatedCommentsCount}개의 댓글이 업데이트되었습니다.`);
    } catch (error) {
      console.error('댓글 시스템 마이그레이션 실패:', error);
      alert('마이그레이션 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // 썸네일 시스템 마이그레이션
  const handleThumbnailMigration = async () => {
    if (!confirm('썸네일 시스템 마이그레이션을 실행하시겠습니까? 기존 노트의 image 필드가 thumbnail 필드로 복사됩니다.')) {
      return;
    }

    setSaving(true);
    try {
      const result = await dataMigration.migrateThumbnailSystem();
      alert(`썸네일 시스템 마이그레이션 완료!\n총 노트: ${result.totalNotes}개\n업데이트: ${result.updatedNotesCount}개\n건너뛴 노트: ${result.skippedNotesCount}개\n오류: ${result.errorCount}개`);
    } catch (error) {
      console.error('썸네일 시스템 마이그레이션 실패:', error);
      alert('마이그레이션 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'security', title: '보안 정책', icon: FiShield },
    { id: 'maintenance', title: '서비스 점검', icon: FiSettings },
    { id: 'ip', title: 'IP 차단', icon: FiGlobe },
    { id: 'keywords', title: '키워드 필터', icon: FiFilter },
    { id: 'migration', title: '데이터 마이그레이션', icon: FiSettings }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={`text-lg ${currentTheme?.textColor || 'text-gray-600'}`}>
            설정을 로드하는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="flex space-x-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? `${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'}`
                : `${currentTheme?.inputBg || 'bg-gray-100'} ${currentTheme?.textColor || 'text-gray-700'} hover:bg-gray-200`
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.title}</span>
          </button>
        ))}
      </div>

      {/* 보안 정책 탭 */}
      {activeTab === 'security' && (
        <div
          className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
              보안 정책 설정
            </h3>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90 disabled:opacity-50`}
            >
              <FiSave className="w-4 h-4" />
              <span>{saving ? '저장 중...' : '설정 저장'}</span>
            </button>
          </div>

          <div className="space-y-6">
            {/* Rate Limiting 설정 */}
            <div>
              <h4 className={`font-medium mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                Rate Limiting
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
                    시간당 최대 요청 수
                  </label>
                  <input
                    type="number"
                    value={settings.rateLimitPerHour || 100}
                    onChange={(e) => setSettings({...settings, rateLimitPerHour: parseInt(e.target.value)})}
                    className={`w-full px-3 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
                    일일 최대 요청 수
                  </label>
                  <input
                    type="number"
                    value={settings.rateLimitPerDay || 1000}
                    onChange={(e) => setSettings({...settings, rateLimitPerDay: parseInt(e.target.value)})}
                    className={`w-full px-3 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>
            </div>

            {/* 파일 업로드 설정 */}
            <div>
              <h4 className={`font-medium mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                파일 업로드
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
                    최대 파일 크기 (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.maxFileSize || 5}
                    onChange={(e) => setSettings({...settings, maxFileSize: parseInt(e.target.value)})}
                    className={`w-full px-3 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
                    허용된 파일 형식
                  </label>
                  <input
                    type="text"
                    value={settings.allowedFileTypes || 'jpg,jpeg,png,gif,webp'}
                    onChange={(e) => setSettings({...settings, allowedFileTypes: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="jpg,jpeg,png,gif,webp"
                  />
                </div>
              </div>
            </div>

            {/* 콘텐츠 제한 */}
            <div>
              <h4 className={`font-medium mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                콘텐츠 제한
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
                    최대 제목 길이
                  </label>
                  <input
                    type="number"
                    value={settings.maxTitleLength || 100}
                    onChange={(e) => setSettings({...settings, maxTitleLength: parseInt(e.target.value)})}
                    className={`w-full px-3 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${currentTheme?.textColor || 'text-gray-700'}`}>
                    최대 내용 길이
                  </label>
                  <input
                    type="number"
                    value={settings.maxContentLength || 50000}
                    onChange={(e) => setSettings({...settings, maxContentLength: parseInt(e.target.value)})}
                    className={`w-full px-3 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 서비스 점검 탭 */}
      {activeTab === 'maintenance' && (
        <div
          className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
              서비스 점검 관리
            </h3>
            <div className="flex items-center space-x-3">
              <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                현재 상태:
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                settings.maintenanceMode?.enabled 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {settings.maintenanceMode?.enabled ? '점검 중' : '정상 운영'}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {/* 점검 모드 토글 */}
            <div className={`p-4 rounded-lg border ${currentTheme?.inputBg || 'bg-gray-50'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                    <FiTool className="inline w-5 h-5 mr-2" />
                    서비스 점검 모드
                  </h4>
                  <p className={`text-sm mt-1 ${currentTheme?.textColor || 'text-gray-600'}`}>
                    점검 모드 활성화 시 모든 사용자에게 점검 페이지가 표시됩니다.
                  </p>
                </div>
                <button
                  onClick={() => handleMaintenanceToggle(!settings.maintenanceMode?.enabled)}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    settings.maintenanceMode?.enabled ? 'bg-red-600' : 'bg-gray-200'
                  } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.maintenanceMode?.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* 점검 시작 시간 표시 */}
              {settings.maintenanceMode?.enabled && settings.maintenanceMode?.startTime && (
                <div className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                  <FiClock className="inline w-4 h-4 mr-1" />
                  점검 시작: {new Date(settings.maintenanceMode.startTime).toLocaleString()}
                </div>
              )}
            </div>

            {/* 점검 메시지 설정 */}
            <div className={`p-4 rounded-lg border ${currentTheme?.inputBg || 'bg-gray-50'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
              <h4 className={`font-medium mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                점검 안내 메시지
              </h4>
              <textarea
                value={settings.maintenanceMode?.message || '서비스 점검 중입니다. 잠시 후 다시 이용해주세요.'}
                onChange={(e) => {
                  const newSettings = {
                    ...settings,
                    maintenanceMode: {
                      ...settings.maintenanceMode,
                      message: e.target.value
                    }
                  };
                  setSettings(newSettings);
                }}
                onBlur={(e) => handleMaintenanceMessageUpdate(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border resize-none ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="사용자에게 표시될 점검 안내 메시지를 입력하세요"
              />
              <p className={`text-xs mt-2 ${currentTheme?.textColor || 'text-gray-500'}`}>
                이 메시지는 점검 페이지에서 사용자에게 표시됩니다.
              </p>
            </div>

            {/* 점검 예상 종료 시간 설정 */}
            <div className={`p-4 rounded-lg border ${currentTheme?.inputBg || 'bg-gray-50'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
              <h4 className={`font-medium mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                예상 종료 시간 (선택사항)
              </h4>
              <input
                type="datetime-local"
                value={settings.maintenanceMode?.estimatedEndTime ? 
                  new Date(settings.maintenanceMode.estimatedEndTime).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  const newSettings = {
                    ...settings,
                    maintenanceMode: {
                      ...settings.maintenanceMode,
                      estimatedEndTime: e.target.value ? new Date(e.target.value) : null
                    }
                  };
                  setSettings(newSettings);
                  handleMaintenanceMessageUpdate(newSettings.maintenanceMode.message);
                }}
                className={`w-full px-3 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              <p className={`text-xs mt-2 ${currentTheme?.textColor || 'text-gray-500'}`}>
                사용자에게 점검 종료 예상 시간을 안내할 수 있습니다.
              </p>
            </div>

            {/* 주의사항 */}
            <div className={`p-4 rounded-lg ${currentTheme?.inputBg || 'bg-yellow-50'} border ${currentTheme?.inputBorder || 'border-yellow-200'}`}>
              <h4 className={`font-medium mb-2 ${currentTheme?.textColor || 'text-yellow-800'}`}>
                ⚠️ 주의사항
              </h4>
              <ul className={`text-sm space-y-1 ${currentTheme?.textColor || 'text-yellow-700'}`}>
                <li>• 점검 모드 활성화 시 관리자를 제외한 모든 사용자가 서비스를 이용할 수 없습니다.</li>
                <li>• 점검 중에도 관리자는 모든 기능에 접근할 수 있습니다.</li>
                <li>• 점검 모드는 즉시 적용되며, 현재 접속 중인 사용자들도 영향을 받습니다.</li>
                <li>• 점검 완료 후 반드시 점검 모드를 비활성화해주세요.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* IP 차단 탭 */}
      {activeTab === 'ip' && (
        <div
          className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
        >
          <h3 className={`text-lg font-semibold mb-6 ${currentTheme?.textColor || 'text-gray-900'}`}>
            IP 차단 관리
          </h3>

          {/* IP 추가 */}
          <div className="flex space-x-3 mb-6">
            <input
              type="text"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
              placeholder="차단할 IP 주소 입력"
              className={`flex-1 px-3 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            <button
              onClick={handleBlockIP}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90`}
            >
              <FiPlus className="w-4 h-4" />
              <span>차단</span>
            </button>
          </div>

          {/* 차단된 IP 목록 */}
          <div className="space-y-3">
            {blockedIPs.filter(ip => ip.isActive).map((ip) => (
              <div
                key={ip.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${currentTheme?.inputBg || 'bg-gray-50'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
              >
                <div>
                  <div className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                    {ip.ip}
                  </div>
                  <div className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                    차단 사유: {ip.reason}
                  </div>
                  <div className={`text-xs ${currentTheme?.textColor || 'text-gray-500'}`}>
                    차단일: {ip.blockedAt?.toDate?.()?.toLocaleDateString() || '알 수 없음'}
                  </div>
                </div>
                <button
                  onClick={() => handleUnblockIP(ip.id)}
                  className="flex items-center space-x-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiX className="w-4 h-4" />
                  <span>해제</span>
                </button>
              </div>
            ))}

            {blockedIPs.filter(ip => ip.isActive).length === 0 && (
              <div className="text-center py-8">
                <FiGlobe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className={`text-lg font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                  차단된 IP가 없습니다
                </p>
                <p className={`text-sm mt-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
                  위험한 IP 주소를 차단하여 시스템을 보호하세요.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 키워드 필터 탭 */}
      {activeTab === 'keywords' && (
        <div
          className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
        >
          <h3 className={`text-lg font-semibold mb-6 ${currentTheme?.textColor || 'text-gray-900'}`}>
            키워드 필터 관리
          </h3>

          {/* 키워드 추가 */}
          <div className="flex space-x-3 mb-6">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="필터링할 키워드 입력"
              className={`flex-1 px-3 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            <button
              onClick={handleAddKeyword}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90`}
            >
              <FiPlus className="w-4 h-4" />
              <span>추가</span>
            </button>
          </div>

          {/* 키워드 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {keywords.filter(keyword => keyword.isActive).map((keyword) => (
              <div
                key={keyword.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${currentTheme?.inputBg || 'bg-gray-50'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
              >
                <div>
                  <div className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                    {keyword.keyword}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    keyword.severity === 'high' ? 'bg-red-100 text-red-700' :
                    keyword.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {keyword.severity}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveKeyword(keyword.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {keywords.filter(keyword => keyword.isActive).length === 0 && (
            <div className="text-center py-8">
              <FiFilter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className={`text-lg font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                필터링 키워드가 없습니다
              </p>
              <p className={`text-sm mt-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
                부적절한 키워드를 추가하여 콘텐츠를 필터링하세요.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 데이터 마이그레이션 탭 */}
      {activeTab === 'migration' && (
        <div
          className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
        >
          <h3 className={`text-lg font-semibold mb-6 ${currentTheme?.textColor || 'text-gray-900'}`}>
            데이터 마이그레이션
          </h3>

          <div className="space-y-6">
            {/* 구독 시스템 마이그레이션 */}
            <div className={`p-4 rounded-lg border ${currentTheme?.inputBg || 'bg-gray-50'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
              <h4 className={`font-medium mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                구독 시스템 마이그레이션
              </h4>
              <p className={`text-sm mb-4 ${currentTheme?.textColor || 'text-gray-600'}`}>
                기존 사용자 데이터에 구독 시스템 필드를 추가합니다. (subscriberCount, subscriptionCount)
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSubscriptionMigration}
                  disabled={saving}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90 disabled:opacity-50`}
                >
                  <FiSettings className="w-4 h-4" />
                  <span>{saving ? '마이그레이션 중...' : '구독 시스템 마이그레이션 실행'}</span>
                </button>
                <span className={`text-sm ${currentTheme?.textColor || 'text-gray-500'}`}>
                  ⚠️ 이 작업은 되돌릴 수 없습니다.
                </span>
              </div>
            </div>

            {/* 알림 시스템 마이그레이션 */}
            <div className={`p-4 rounded-lg border ${currentTheme?.inputBg || 'bg-gray-50'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
              <h4 className={`font-medium mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                알림 시스템 초기화
              </h4>
              <p className={`text-sm mb-4 ${currentTheme?.textColor || 'text-gray-600'}`}>
                알림 컬렉션을 초기화하고 기본 설정을 적용합니다.
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleNotificationMigration}
                  disabled={saving}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-green-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90 disabled:opacity-50`}
                >
                  <FiSettings className="w-4 h-4" />
                  <span>{saving ? '초기화 중...' : '알림 시스템 초기화'}</span>
                </button>
                <span className={`text-sm ${currentTheme?.textColor || 'text-gray-500'}`}>
                  💡 안전한 작업입니다.
                </span>
              </div>
            </div>

            {/* 댓글 시스템 마이그레이션 */}
            <div className={`p-4 rounded-lg border ${currentTheme?.inputBg || 'bg-gray-50'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
              <h4 className={`font-medium mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                댓글 시스템 마이그레이션
              </h4>
              <p className={`text-sm mb-4 ${currentTheme?.textColor || 'text-gray-600'}`}>
                기존 댓글들에 고유 ID와 대댓글 필드를 추가합니다. (id, replies, replyCount)
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCommentMigration}
                  disabled={saving}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-purple-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90 disabled:opacity-50`}
                >
                  <FiSettings className="w-4 h-4" />
                  <span>{saving ? '마이그레이션 중...' : '댓글 시스템 마이그레이션 실행'}</span>
                </button>
                <span className={`text-sm ${currentTheme?.textColor || 'text-gray-500'}`}>
                  ⚠️ 이 작업은 되돌릴 수 없습니다.
                </span>
              </div>
            </div>

            {/* 썸네일 시스템 마이그레이션 */}
            <div className={`p-4 rounded-lg border ${currentTheme?.inputBg || 'bg-gray-50'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
              <h4 className={`font-medium mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                썸네일 시스템 마이그레이션
              </h4>
              <p className={`text-sm mb-4 ${currentTheme?.textColor || 'text-gray-600'}`}>
                기존 노트의 image 필드가 thumbnail 필드로 복사됩니다.
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleThumbnailMigration}
                  disabled={saving}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-pink-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90 disabled:opacity-50`}
                >
                  <FiSettings className="w-4 h-4" />
                  <span>{saving ? '마이그레이션 중...' : '썸네일 시스템 마이그레이션 실행'}</span>
                </button>
                <span className={`text-sm ${currentTheme?.textColor || 'text-gray-500'}`}>
                  ⚠️ 이 작업은 되돌릴 수 없습니다.
                </span>
              </div>
            </div>

            {/* 마이그레이션 상태 */}
            <div className={`p-4 rounded-lg border ${currentTheme?.inputBg || 'bg-blue-50'} ${currentTheme?.inputBorder || 'border-blue-200'}`}>
              <h4 className={`font-medium mb-3 ${currentTheme?.textColor || 'text-blue-900'}`}>
                마이그레이션 가이드
              </h4>
              <ul className={`text-sm space-y-2 ${currentTheme?.textColor || 'text-blue-800'}`}>
                <li>• 구독 시스템: 모든 사용자에게 subscriberCount: 0, subscriptionCount: 0 추가</li>
                <li>• 알림 시스템: notifications 컬렉션 생성 및 기본 설정</li>
                <li>• 댓글 시스템: 기존 댓글에 id, replies, replyCount 필드 추가</li>
                <li>• 썸네일 시스템: 기존 노트의 image 필드를 thumbnail 필드로 복사</li>
                <li>• 마이그레이션 전 데이터베이스 백업을 권장합니다</li>
                <li>• 마이그레이션 중에는 서비스 이용이 제한될 수 있습니다</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SystemSettings; 