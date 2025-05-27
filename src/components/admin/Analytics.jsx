/**
 * 통계 및 분석 컴포넌트
 * 실제 Firestore 데이터를 기반으로 한 시스템 사용량 및 트렌드 분석을 제공합니다.
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiBarChart2, 
  FiTrendingUp, 
  FiTrendingDown,
  FiUsers, 
  FiFileText,
  FiActivity,
  FiCalendar,
  FiImage,
  FiRefreshCw,
  FiInfo
} from 'react-icons/fi';
import { getRealAnalyticsData } from '@/utils/adminUtils';

function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');

  // 현재 테마 가져오기
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getRealAnalyticsData(timeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Analytics 데이터 로드 실패:', error);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  // 성장률 표시 컴포넌트
  const GrowthIndicator = ({ rate, label }) => {
    const isPositive = rate > 0;
    const isNeutral = rate === 0;
    
    return (
      <div className={`flex items-center text-xs mt-1 ${
        isNeutral ? 'text-gray-500' : 
        isPositive ? 'text-green-500' : 'text-red-500'
      }`}>
        {!isNeutral && (
          isPositive ? 
            <FiTrendingUp className="w-3 h-3 mr-1" /> : 
            <FiTrendingDown className="w-3 h-3 mr-1" />
        )}
        <span>
          {isNeutral ? '변화 없음' : 
           isPositive ? `+${rate}%` : `${rate}%`} {label}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={`text-lg ${currentTheme?.textColor || 'text-gray-600'}`}>
            실제 데이터를 분석하는 중...
          </p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <FiBarChart2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className={`text-lg font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
          데이터를 불러올 수 없습니다
        </p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FiBarChart2 className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className={`text-xl font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
              실시간 시스템 분석
            </h2>
            <p className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'}`}>
              Firestore 데이터 기반 실제 통계
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-300'} ${currentTheme?.textColor || 'text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="1d">오늘</option>
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
            <option value="90d">최근 90일</option>
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-2 rounded-lg ${currentTheme?.hoverBg || 'hover:bg-gray-100'} transition-colors`}
            title="새로고침"
          >
            <FiRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''} ${currentTheme?.textColor || 'text-gray-600'}`} />
          </button>
        </div>
      </div>

      {/* 실제 데이터 알림 */}
      <div className={`p-4 rounded-xl border-l-4 border-blue-500 ${currentTheme?.modalBgColor || 'bg-blue-50'}`}>
        <div className="flex items-center space-x-2">
          <FiInfo className="w-5 h-5 text-blue-500" />
          <span className={`text-sm font-medium ${currentTheme?.textColor || 'text-blue-800'}`}>
            실제 데이터 기반 분석
          </span>
        </div>
        <p className={`text-sm mt-1 ${currentTheme?.textColor || 'text-blue-700'}`}>
          모든 통계는 Firestore 데이터베이스에서 실시간으로 계산된 정확한 수치입니다.
        </p>
      </div>

      {/* 오늘의 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                오늘 신규 사용자
              </p>
              <p className={`text-2xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                {analyticsData.today.users}
              </p>
              <GrowthIndicator 
                rate={analyticsData.growthRates.users} 
                label="vs 어제" 
              />
            </div>
            <FiUsers className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                오늘 작성된 노트
              </p>
              <p className={`text-2xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                {analyticsData.today.notes}
              </p>
              <GrowthIndicator 
                rate={analyticsData.growthRates.notes} 
                label="vs 어제" 
              />
            </div>
            <FiFileText className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                오늘 작성된 댓글
              </p>
              <p className={`text-2xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                {analyticsData.today.comments}
              </p>
              <GrowthIndicator 
                rate={analyticsData.growthRates.comments} 
                label="vs 어제" 
              />
            </div>
            <FiActivity className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                전체 사용자
              </p>
              <p className={`text-2xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                {analyticsData.totals.users.toLocaleString()}
              </p>
              <div className={`text-xs mt-1 ${currentTheme?.textSecondary || 'text-gray-500'} flex items-center`}>
                <FiCalendar className="w-3 h-3 mr-1" />
                누적 데이터
              </div>
            </div>
            <FiUsers className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* 상세 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 실제 사용자 활동 트렌드 */}
        <div className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-6 ${currentTheme?.textColor || 'text-gray-900'}`}>
            실제 사용자 활동 분석
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                일일 활성 사용자
              </span>
              <span className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                {analyticsData.activeUsers.daily.toLocaleString()}명
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ 
                  width: `${Math.min((analyticsData.activeUsers.daily / analyticsData.totals.users) * 100, 100)}%` 
                }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                주간 활성 사용자
              </span>
              <span className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                {analyticsData.activeUsers.weekly.toLocaleString()}명
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ 
                  width: `${Math.min((analyticsData.activeUsers.weekly / analyticsData.totals.users) * 100, 100)}%` 
                }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                월간 활성 사용자
              </span>
              <span className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                {analyticsData.activeUsers.monthly.toLocaleString()}명
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full" 
                style={{ 
                  width: `${Math.min((analyticsData.activeUsers.monthly / analyticsData.totals.users) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* 실제 콘텐츠 통계 */}
        <div className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-6 ${currentTheme?.textColor || 'text-gray-900'}`}>
            실제 콘텐츠 통계
          </h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                  전체 노트
                </span>
                <span className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {analyticsData.totals.notes.toLocaleString()}개
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                  전체 댓글
                </span>
                <span className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {analyticsData.totals.comments.toLocaleString()}개
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min((analyticsData.totals.comments / Math.max(analyticsData.totals.notes * 3, 1)) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'}`}>
                  이미지 업로드
                </span>
                <span className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {analyticsData.totals.imageUploads.toLocaleString()}개
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min((analyticsData.totals.imageUploads / Math.max(analyticsData.totals.notes, 1)) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 실제 성장 지표 */}
      <div className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-6 ${currentTheme?.textColor || 'text-gray-900'}`}>
          실제 성장 지표 (어제 대비)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${
              analyticsData.growthRates.users > 0 ? 'text-green-600' :
              analyticsData.growthRates.users < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {analyticsData.growthRates.users > 0 ? '+' : ''}{analyticsData.growthRates.users}%
            </div>
            <div className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'} mb-1`}>
              사용자 증가율
            </div>
            <div className="text-xs text-blue-500">
              어제: {analyticsData.yesterday.users}명
            </div>
          </div>

          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${
              analyticsData.growthRates.notes > 0 ? 'text-green-600' :
              analyticsData.growthRates.notes < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {analyticsData.growthRates.notes > 0 ? '+' : ''}{analyticsData.growthRates.notes}%
            </div>
            <div className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'} mb-1`}>
              노트 증가율
            </div>
            <div className="text-xs text-blue-500">
              어제: {analyticsData.yesterday.notes}개
            </div>
          </div>

          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${
              analyticsData.growthRates.comments > 0 ? 'text-green-600' :
              analyticsData.growthRates.comments < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {analyticsData.growthRates.comments > 0 ? '+' : ''}{analyticsData.growthRates.comments}%
            </div>
            <div className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'} mb-1`}>
              댓글 증가율
            </div>
            <div className="text-xs text-blue-500">
              어제: {analyticsData.yesterday.comments}개
            </div>
          </div>

          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${currentTheme?.textColor || 'text-gray-900'}`}>
              {analyticsData.retentionRate}%
            </div>
            <div className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'} mb-1`}>
              사용자 유지율
            </div>
            <div className="text-xs text-blue-500">
              30일 기준
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics; 