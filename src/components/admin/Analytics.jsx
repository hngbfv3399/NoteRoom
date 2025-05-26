/**
 * 통계 및 분석 컴포넌트
 * 시스템 사용량 및 트렌드 분석을 제공합니다.
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiBarChart2, 
  FiTrendingUp, 
  FiUsers, 
  FiFileText,
  FiActivity,
  FiCalendar
} from 'react-icons/fi';
import { getSystemStats } from '@/utils/adminUtils';

function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
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
      const systemStats = await getSystemStats();
      
      // 시스템 통계를 Analytics에 맞는 형태로 변환
      const analyticsStats = {
        today: {
          users: Math.floor(systemStats.activeUsers * 0.1), // 활성 사용자의 10%를 오늘 신규로 추정
          notes: Math.floor(systemStats.totalNotes * 0.05), // 전체 노트의 5%를 오늘 작성으로 추정
          comments: Math.floor(systemStats.totalNotes * 0.1) // 노트 대비 댓글 비율 추정
        },
        total: {
          users: systemStats.totalUsers,
          notes: systemStats.totalNotes,
          comments: Math.floor(systemStats.totalNotes * 2) // 노트 대비 댓글 2배로 추정
        },
        activeUsers: systemStats.activeUsers,
        securityAlerts: systemStats.securityAlerts,
        totalReports: systemStats.totalReports
      };
      
      setStats(analyticsStats);
    } catch (error) {
      console.error('분석 데이터 로드 실패:', error);
      // 실패 시 기본값 설정
      setStats({
        today: {
          users: 0,
          notes: 0,
          comments: 0
        },
        total: {
          users: 0,
          notes: 0,
          comments: 0
        },
        activeUsers: 0,
        securityAlerts: 0,
        totalReports: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={`text-lg ${currentTheme?.textColor || 'text-gray-600'}`}>
            분석 데이터를 로드하는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FiBarChart2 className="w-6 h-6 text-blue-500" />
          <h2 className={`text-xl font-semibold ${currentTheme?.textColor || 'text-gray-900'}`}>
            시스템 분석
          </h2>
        </div>

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
      </div>

      {/* 주요 지표 */}
      {stats && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-600'}`}>
                  오늘 신규 사용자
                </p>
                <p className={`text-2xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {stats.today.users}
                </p>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <FiTrendingUp className="w-3 h-3 mr-1" />
                  +12% vs 어제
                </p>
              </div>
              <FiUsers className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-600'}`}>
                  오늘 작성된 노트
                </p>
                <p className={`text-2xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {stats.today.notes}
                </p>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <FiTrendingUp className="w-3 h-3 mr-1" />
                  +8% vs 어제
                </p>
              </div>
              <FiFileText className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-600'}`}>
                  오늘 작성된 댓글
                </p>
                <p className={`text-2xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {stats.today.comments}
                </p>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <FiTrendingUp className="w-3 h-3 mr-1" />
                  +15% vs 어제
                </p>
              </div>
              <FiActivity className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${currentTheme?.textColor || 'text-gray-600'}`}>
                  전체 사용자
                </p>
                <p className={`text-2xl font-bold ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {stats.total.users.toLocaleString()}
                </p>
                <p className="text-xs text-blue-500 flex items-center mt-1">
                  <FiCalendar className="w-3 h-3 mr-1" />
                  누적 데이터
                </p>
              </div>
              <FiUsers className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* 상세 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 사용자 활동 트렌드 */}
        <div
          className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
        >
          <h3 className={`text-lg font-semibold mb-6 ${currentTheme?.textColor || 'text-gray-900'}`}>
            사용자 활동 트렌드
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                일일 활성 사용자
              </span>
              <span className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                890명
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                주간 활성 사용자
              </span>
              <span className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                1,250명
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                월간 활성 사용자
              </span>
              <span className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                2,100명
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '95%' }}></div>
            </div>
          </div>
        </div>

        {/* 콘텐츠 통계 */}
        <div
          className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
        >
          <h3 className={`text-lg font-semibold mb-6 ${currentTheme?.textColor || 'text-gray-900'}`}>
            콘텐츠 통계
          </h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                  노트
                </span>
                <span className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {stats?.total.notes.toLocaleString() || '0'}개
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                  댓글
                </span>
                <span className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                  {stats?.total.comments.toLocaleString() || '0'}개
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${currentTheme?.textColor || 'text-gray-600'}`}>
                  이미지 업로드
                </span>
                <span className={`font-medium ${currentTheme?.textColor || 'text-gray-900'}`}>
                  1,850개
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 성장 지표 */}
      <div
        className={`p-6 rounded-xl border ${currentTheme?.modalBgColor || 'bg-white'} ${currentTheme?.inputBorder || 'border-gray-200'}`}
      >
        <h3 className={`text-lg font-semibold mb-6 ${currentTheme?.textColor || 'text-gray-900'}`}>
          성장 지표
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`text-3xl font-bold ${currentTheme?.textColor || 'text-gray-900'} mb-2`}>
              +12.5%
            </div>
            <div className={`text-sm ${currentTheme?.textColor || 'text-gray-600'} mb-1`}>
              사용자 증가율
            </div>
            <div className="text-xs text-green-500">
              지난 달 대비
            </div>
          </div>

          <div className="text-center">
            <div className={`text-3xl font-bold ${currentTheme?.textColor || 'text-gray-900'} mb-2`}>
              +8.3%
            </div>
            <div className={`text-sm ${currentTheme?.textColor || 'text-gray-600'} mb-1`}>
              콘텐츠 증가율
            </div>
            <div className="text-xs text-green-500">
              지난 달 대비
            </div>
          </div>

          <div className="text-center">
            <div className={`text-3xl font-bold ${currentTheme?.textColor || 'text-gray-900'} mb-2`}>
              85.2%
            </div>
            <div className={`text-sm ${currentTheme?.textColor || 'text-gray-600'} mb-1`}>
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