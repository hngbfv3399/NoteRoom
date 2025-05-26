/**
 * 시스템 설정 컴포넌트
 * 보안 정책, IP 차단, 키워드 필터 등의 시스템 설정을 관리합니다.
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  FiSettings, 
  FiShield, 
  FiFilter,
  FiGlobe,
  FiPlus,
  FiTrash2,
  FiSave,
  FiX
} from 'react-icons/fi';
import { 
  manageBlockedIPs, 
  manageKeywordFilters, 
  manageSystemSettings 
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

  const tabs = [
    { id: 'security', title: '보안 정책', icon: FiShield },
    { id: 'ip', title: 'IP 차단', icon: FiGlobe },
    { id: 'keywords', title: '키워드 필터', icon: FiFilter }
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
        </motion.div>
      )}

      {/* IP 차단 탭 */}
      {activeTab === 'ip' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
        </motion.div>
      )}

      {/* 키워드 필터 탭 */}
      {activeTab === 'keywords' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
        </motion.div>
      )}
    </div>
  );
}

export default SystemSettings; 