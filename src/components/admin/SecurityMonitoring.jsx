/**
 * 보안 모니터링 컴포넌트
 * 의심스러운 활동 감지, Rate Limiting 통계, 보안 이벤트 로그 등을 표시합니다.
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiAlertTriangle, 
  FiShield, 
  FiActivity, 
  FiClock,
  FiUser,
  FiGlobe,
  FiRefreshCw,
  FiEye,
  FiBarChart2
} from 'react-icons/fi';
import { detectSuspiciousActivity, getRateLimitStats, getSecurityLogs } from '@/utils/adminUtils';
import { 
  TIME_RANGE_OPTIONS,
  SUSPICIOUS_ACTIVITY_TYPES,
  SEVERITY_LEVELS
} from '@/constants/adminConstants';

function SecurityMonitoring() {
  const [suspiciousActivities, setSuspiciousActivities] = useState([]);
  const [rateLimitStats, setRateLimitStats] = useState(null);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState(24);

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  useEffect(() => {
    loadSecurityData();
  }, [timeRange]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // 의심스러운 활동 감지 - 실제 데이터 사용
      try {
        const activities = await detectSuspiciousActivity(timeRange);
        setSuspiciousActivities(activities);
      } catch (error) {
        console.warn('의심스러운 활동 감지 실패:', error);
        setSuspiciousActivities([]);
      }

      // Rate Limiting 통계 - 실제 데이터 사용
      try {
        const stats = await getRateLimitStats();
        setRateLimitStats(stats);
      } catch (error) {
        console.warn('Rate Limit 통계 조회 실패:', error);
        setRateLimitStats({
          totalRequests: 0,
          blockedRequests: 0,
          topUsers: [],
          requestsByType: {
            NOTE_WRITE: 0,
            COMMENT_WRITE: 0,
            IMAGE_UPLOAD: 0,
            SEARCH: 0,
            PROFILE_UPDATE: 0
          }
        });
      }

      // 최근 보안 로그 - 실제 데이터 사용
      try {
        const securityLogs = await getSecurityLogs(timeRange);
        setSecurityLogs(securityLogs);
      } catch (error) {
        console.warn('보안 로그 조회 실패:', error);
        setSecurityLogs([]);
      }

    } catch (error) {
      console.error('보안 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case SEVERITY_LEVELS.HIGH:
        return 'text-red-500 bg-red-50 border-red-200';
      case SEVERITY_LEVELS.MEDIUM:
        return 'text-orange-500 bg-orange-50 border-orange-200';
      case SEVERITY_LEVELS.LOW:
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getEventTypeIcon = (eventType) => {
    switch (eventType) {
      case SUSPICIOUS_ACTIVITY_TYPES.EXCESSIVE_REQUESTS:
        return <FiActivity className="w-4 h-4" />;
      case SUSPICIOUS_ACTIVITY_TYPES.LOGIN_FAILED:
        return <FiUser className="w-4 h-4" />;
      case SUSPICIOUS_ACTIVITY_TYPES.SUSPICIOUS_UPLOAD:
        return <FiAlertTriangle className="w-4 h-4" />;
      default:
        return <FiShield className="w-4 h-4" />;
    }
  };

  const getEventTypeText = (eventType) => {
    switch (eventType) {
      case SUSPICIOUS_ACTIVITY_TYPES.EXCESSIVE_REQUESTS:
        return '과도한 요청';
      case SUSPICIOUS_ACTIVITY_TYPES.LOGIN_FAILED:
        return '로그인 실패';
      case SUSPICIOUS_ACTIVITY_TYPES.SUSPICIOUS_UPLOAD:
        return '의심스러운 업로드';
      case SUSPICIOUS_ACTIVITY_TYPES.REPEATED_LOGIN_FAILURES:
        return '반복된 로그인 실패';
      case SUSPICIOUS_ACTIVITY_TYPES.EXCESSIVE_USER_ACTIVITY:
        return '과도한 사용자 활동';
      default:
        return eventType;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={`text-lg ${currentTheme?.textColor || 'text-gray-600'}`}>
            보안 데이터를 로드하는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className={`px-4 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            {TIME_RANGE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90 disabled:opacity-50`}
        >
          <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>새로고침</span>
        </button>
      </div>

      {/* 의심스러운 활동 */}
      <div
        className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FiAlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className={`text-lg font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
              의심스러운 활동
            </h3>
            {suspiciousActivities.length > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                {suspiciousActivities.length}개 감지
              </span>
            )}
          </div>
        </div>

        {suspiciousActivities.length === 0 ? (
          <div className="text-center py-8">
            <FiShield className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className={`text-lg font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
              의심스러운 활동이 감지되지 않았습니다
            </p>
            <p className={`text-sm mt-2 ${currentTheme?.textColor || 'text-gray-600'}`}>
              시스템이 정상적으로 운영되고 있습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suspiciousActivities.map((activity, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(activity.severity)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getEventTypeIcon(activity.type)}
                    <div>
                      <h4 className="font-medium">
                        {getEventTypeText(activity.type)}
                      </h4>
                      <p className="text-sm opacity-75">
                        대상: {activity.target} | 횟수: {activity.count}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    activity.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                    activity.severity === 'MEDIUM' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {activity.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rate Limiting 통계 */}
      {rateLimitStats && (
        <div
          className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
        >
          <div className="flex items-center space-x-3 mb-6">
            <FiBarChart2 className="w-6 h-6 text-blue-500" />
            <h3 className={`text-lg font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
              Rate Limiting 통계
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 전체 통계 */}
            <div className={`p-4 rounded-lg ${currentTheme?.inputBg || 'bg-gray-50'}`}>
              <h4 className={`font-medium mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                전체 요청
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                    총 요청
                  </span>
                  <span className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                    {rateLimitStats.totalRequests.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                    차단된 요청
                  </span>
                  <span className="font-medium text-red-500">
                    {rateLimitStats.blockedRequests.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                    차단율
                  </span>
                  <span className="font-medium text-red-500">
                    {((rateLimitStats.blockedRequests / rateLimitStats.totalRequests) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 요청 유형별 통계 */}
            <div className={`p-4 rounded-lg ${currentTheme?.inputBg || 'bg-gray-50'}`}>
              <h4 className={`font-medium mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                요청 유형별
              </h4>
              <div className="space-y-2">
                {Object.entries(rateLimitStats.requestsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                      {type.replace('_', ' ')}
                    </span>
                    <span className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                      {count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 상위 사용자 */}
            <div className={`p-4 rounded-lg ${currentTheme?.inputBg || 'bg-gray-50'}`}>
              <h4 className={`font-medium mb-3 ${currentTheme?.textColor || 'text-gray-900'}`}>
                상위 사용자
              </h4>
              <div className="space-y-2">
                {rateLimitStats.topUsers.map((user, index) => (
                  <div key={user.userId} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${currentTheme?.inputBorder || 'bg-gray-200'} ${currentTheme?.textColor || 'text-gray-700'}`}>
                        #{index + 1}
                      </span>
                      <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                        {user.userId}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                        {user.requests}
                      </div>
                      {user.blocked > 0 && (
                        <div className="text-xs text-red-500">
                          {user.blocked} 차단
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 최근 보안 이벤트 */}
      <div
        className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
      >
        <div className="flex items-center space-x-3 mb-6">
          <FiEye className="w-6 h-6 text-purple-500" />
          <h3 className={`text-lg font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
            최근 보안 이벤트
          </h3>
        </div>

        <div className="space-y-4">
          {securityLogs.map((log) => (
            <div
              key={log.id}
              className={`p-4 rounded-lg border ${currentTheme?.inputBg || 'bg-gray-50'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getEventTypeIcon(log.eventType)}
                  <div>
                    <h4 className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                      {getEventTypeText(log.eventType)}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1">
                        <FiClock className="w-3 h-3 text-gray-400" />
                        <span className={`text-xs ${currentTheme?.textColor || 'text-gray-600'}`}>
                          {log.timestamp.toLocaleString()}
                        </span>
                      </div>
                      {log.details.ip && (
                        <div className="flex items-center space-x-1">
                          <FiGlobe className="w-3 h-3 text-gray-400" />
                          <span className={`text-xs ${currentTheme?.textColor || 'text-gray-600'}`}>
                            {log.details.ip}
                          </span>
                        </div>
                      )}
                      {log.details.userId && (
                        <div className="flex items-center space-x-1">
                          <FiUser className="w-3 h-3 text-gray-400" />
                          <span className={`text-xs ${currentTheme?.textColor || 'text-gray-600'}`}>
                            {log.details.userId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(log.severity)}`}>
                  {log.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SecurityMonitoring; 