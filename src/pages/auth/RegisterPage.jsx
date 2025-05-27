/**
 * 회원가입 페이지 컴포넌트
 * 
 * 주요 기능:
 * - Firebase Auth 로그인 후 추가 정보 입력
 * - 프로필 이미지 업로드 또는 기본 아바타 선택
 * - 사용자 프로필 정보 Firestore에 저장
 * - 기존 가입자 체크 및 리다이렉트
 * 
 * NOTE: Firebase Auth 인증 후 사용자 정보 완성 단계
 * IMPROVED: 유효성 검사 강화, 중복 닉네임 체크, 에러 처리 개선, 로딩 상태 추가
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { auth, db } from '@/services/firebase';
import { doc, setDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { uploadProfileImageToFirebase } from '@/utils/firebaseNoteDataUtil';
import { getThemeClass } from '@/utils/themeHelper';
import { showToast } from '@/store/toast/slice';
import LoadingSpinner from '@/components/LoadingSpinner';

function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // 테마 상태
  const { current, themes } = useSelector((state) => state.theme);
  const currentTheme = themes[current];
  const themeClass = currentTheme ? getThemeClass(currentTheme) : "";
  
  // 사용자 입력 데이터 상태
  const [userData, setUserData] = useState({
    displayName: '',
    birthDate: '',
  });
  
  // 프로필 이미지 관련 상태
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  
  // UI 상태
  const [isLoading, setIsLoading] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState(null);
  
  // 에러 상태
  const [errors, setErrors] = useState({});
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRY_COUNT = 3;

  // 기본 아바타 옵션들 - 저작권 걱정 없는 이미지들
  const defaultAvatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&backgroundColor=ffd93d',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=ffb3ba',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan&backgroundColor=bae1ff',
  ];

  // 닉네임 중복 체크 함수
  const checkNicknameAvailability = useCallback(async (nickname) => {
    if (!nickname.trim()) {
      setNicknameAvailable(null);
      return;
    }

    setNicknameChecking(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('displayName', '==', nickname.trim())
      );
      const querySnapshot = await getDocs(q);
      const isAvailable = querySnapshot.empty;
      
      setNicknameAvailable(isAvailable);
      
      if (!isAvailable) {
        setErrors(prev => ({
          ...prev,
          displayName: '이미 사용 중인 닉네임입니다.'
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.displayName;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('닉네임 중복 체크 실패:', error);
      dispatch(showToast({
        type: 'error',
        message: '닉네임 중복 체크 중 오류가 발생했습니다.'
      }));
    } finally {
      setNicknameChecking(false);
    }
  }, [dispatch]);

  // 입력 유효성 검사 함수
  const validateForm = useCallback(() => {
    const newErrors = {};

    // 닉네임 검사
    if (!userData.displayName.trim()) {
      newErrors.displayName = '닉네임을 입력해주세요.';
    } else if (userData.displayName.trim().length < 2) {
      newErrors.displayName = '닉네임은 2자 이상이어야 합니다.';
    } else if (userData.displayName.trim().length > 20) {
      newErrors.displayName = '닉네임은 20자 이하여야 합니다.';
    } else if (!/^[가-힣a-zA-Z0-9_]+$/.test(userData.displayName.trim())) {
      newErrors.displayName = '닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다.';
    }

    // 생년월일 검사
    if (!userData.birthDate) {
      newErrors.birthDate = '생년월일을 입력해주세요.';
    } else {
      const birthDate = new Date(userData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 13) {
        newErrors.birthDate = '13세 이상만 가입 가능합니다.';
      } else if (age > 120) {
        newErrors.birthDate = '올바른 생년월일을 입력해주세요.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [userData]);

  // 사용자 인증 상태 및 기존 가입 여부 확인
  useEffect(() => {
    const checkUserAndSetData = async () => {
      const user = auth.currentUser;
      if (!user) {
        // 인증되지 않은 사용자는 로그인 페이지로
        navigate('/auth/login');
        return;
      }

      try {
        // 이미 가입된 사용자인지 확인
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          // 이미 가입된 사용자는 메인 페이지로 리다이렉트
          navigate('/');
          return;
        }

        // Firebase Auth에서 가져온 기본 정보로 초기화
        setUserData(prev => ({
          ...prev,
          displayName: user.displayName || '', // Google 로그인 시 자동 설정
        }));

        // Google 프로필 이미지가 있으면 미리보기로 설정
        if (user.photoURL) {
          setProfileImagePreview(user.photoURL);
        }
      } catch (error) {
        console.error('사용자 정보 확인 실패:', error);
      }
    };

    checkUserAndSetData();
  }, [navigate]);

  // 입력 필드 변경 핸들러 (개선된 유효성 검사 포함)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));

    // 실시간 유효성 검사
    if (name === 'displayName') {
      // 닉네임 중복 체크 (디바운싱)
      const timeoutId = setTimeout(() => {
        checkNicknameAvailability(value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  // 프로필 이미지 파일 선택 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        dispatch(showToast({
          type: 'error',
          message: '파일 크기는 5MB 이하여야 합니다.'
        }));
        return;
      }

      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        dispatch(showToast({
          type: 'error',
          message: '이미지 파일만 업로드 가능합니다.'
        }));
        return;
      }

      setProfileImage(file);
      setSelectedAvatar(''); // 기본 아바타 선택 해제
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 기본 아바타 선택 핸들러
  const handleAvatarSelect = (avatarUrl) => {
    setSelectedAvatar(avatarUrl);
    setProfileImage(null); // 업로드된 파일 초기화
    setProfileImagePreview(avatarUrl);
  };

  // 폼 제출 핸들러 (개선된 에러 처리 및 토스트 알림)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!validateForm()) {
      dispatch(showToast({
        type: 'error',
        message: '입력 정보를 확인해주세요.'
      }));
      return;
    }

    // 닉네임 중복 체크 확인
    if (nicknameAvailable === false) {
      dispatch(showToast({
        type: 'error',
        message: '사용할 수 없는 닉네임입니다.'
      }));
      return;
    }

    setIsLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('로그인이 필요합니다.');
        navigate('/auth/login');
        return;
      }

      let finalProfileImageUrl = '';

      // 프로필 이미지 처리
      if (profileImage) {
        // 사용자가 업로드한 이미지
        setImageUploadLoading(true);
        try {
          finalProfileImageUrl = await uploadProfileImageToFirebase(profileImage, user.uid);
        } catch (error) {
          console.error('이미지 업로드 실패:', error);
          dispatch(showToast({
            type: 'error',
            message: '이미지 업로드 중 오류가 발생했습니다.'
          }));
          return;
        } finally {
          setImageUploadLoading(false);
        }
      } else if (selectedAvatar) {
        // 선택된 기본 아바타
        finalProfileImageUrl = selectedAvatar;
      } else if (user.photoURL) {
        // Google 프로필 이미지
        finalProfileImageUrl = user.photoURL;
      }

      // Firestore에 사용자 정보 저장
      // NOTE: 사용자 프로필의 기본값들을 설정
      await setDoc(doc(db, 'users', user.uid), {
        displayName: userData.displayName.trim(),
        birthDate: userData.birthDate,
        email: user.email,
        profileImage: finalProfileImageUrl, // 프로필 이미지 URL 저장
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // 기본 프로필 정보
        noteCount: 0,
        favorites: '',
        favoriteQuote: '',
        hobbies: '',
        
        // 감정 분포 데이터
        emotionDistribution: {
          joy: 0,        // 기쁨
          sadness: 0,    // 슬픔
          anger: 0,      // 화남
          excited: 0,    // 신남
          calm: 0,       // 평온
          stressed: 0,   // 스트레스
          grateful: 0,   // 감사
          anxious: 0,    // 불안
          confident: 0,  // 자신감
          lonely: 0,     // 외로움
          hopeful: 0,    // 희망적
          tired: 0,      // 피곤함
        },
        
        // 감정 추적 시스템
        emotionTracking: {
          dailyEmotions: [], // 일일 감정 기록 배열
          monthlyStats: {}, // 월간 통계
          settings: {
            reminderTime: "21:00", // 기본 알림 시간
            reminderEnabled: true,
            lastReminder: null,
            monthlyResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0]
          }
        },
      });

      // 회원가입 완료 후 메인 페이지로 이동
      dispatch(showToast({
        type: 'success',
        message: '회원가입이 완료되었습니다! 환영합니다!'
      }));
      navigate('/');
    } catch (error) {
      console.error('회원가입 실패:', error);
      
      // 재시도 로직
      if (retryCount < MAX_RETRY_COUNT) {
        setRetryCount(prev => prev + 1);
        dispatch(showToast({
          type: 'warning',
          message: `회원가입 중 오류가 발생했습니다. 재시도 중... (${retryCount + 1}/${MAX_RETRY_COUNT})`
        }));
        
        // 잠시 후 재시도
        setTimeout(() => {
          handleSubmit(e);
        }, 2000);
      } else {
        const errorMessage = error.code === 'permission-denied'
          ? '권한이 없습니다. 다시 로그인해주세요.'
          : error.code === 'unavailable'
          ? '네트워크 연결을 확인해주세요.'
          : '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.';
        
        dispatch(showToast({
          type: 'error',
          message: errorMessage
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-6 py-12 ${themeClass}`}>
      <div className={`max-w-md w-full space-y-8 p-8 rounded-2xl shadow-xl ${currentTheme?.cardBg || 'bg-white'}`}>
        <div className="text-center">
          <h2 className={`text-3xl font-bold ${currentTheme?.textPrimary || 'text-gray-900'}`}>
            회원가입
          </h2>
          <p className={`mt-2 text-sm ${currentTheme?.textSecondary || 'text-gray-600'}`}>
            기본 정보를 입력하고 NoteRoom에 가입하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 프로필 이미지 섹션 */}
          <div className="text-center">
            <label className={`block text-sm font-medium mb-4 ${currentTheme?.textPrimary || 'text-gray-700'}`}>
              프로필 이미지
            </label>
            
            {/* 현재 선택된 이미지 미리보기 */}
            <div className="mb-4">
              {profileImagePreview ? (
                <img
                  src={profileImagePreview}
                  alt="프로필 미리보기"
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center border-2 border-dashed ${currentTheme?.borderColor || 'border-gray-300'}`}>
                  <span className={`text-sm ${currentTheme?.textSecondary || 'text-gray-500'}`}>
                    이미지 없음
                  </span>
                </div>
              )}
            </div>

            {/* 파일 업로드 버튼 */}
            <div className="mb-4">
              <label className={`cursor-pointer inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'} hover:opacity-90`}>
                📷 이미지 업로드
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* 기본 아바타 선택 */}
            <div>
              <p className={`text-xs mb-3 ${currentTheme?.textSecondary || 'text-gray-500'}`}>
                또는 기본 아바타를 선택하세요
              </p>
              <div className="grid grid-cols-3 gap-2">
                {defaultAvatars.map((avatar, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAvatarSelect(avatar)}
                    className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                      selectedAvatar === avatar 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={avatar}
                      alt={`아바타 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 닉네임 입력 */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${currentTheme?.textPrimary || 'text-gray-700'}`}>
              닉네임 *
            </label>
            <div className="relative">
              <input
                type="text"
                name="displayName"
                value={userData.displayName}
                onChange={handleInputChange}
                placeholder="사용하실 닉네임을 입력해주세요"
                className={`w-full px-3 py-2 pr-10 rounded-md transition-colors ${
                  errors.displayName 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-300' 
                    : `${currentTheme?.inputBorder || 'border border-gray-300'} ${currentTheme?.inputFocus || 'focus:border-blue-500 focus:ring-blue-300'}`
                } ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputText || 'text-gray-900'}`}
                required
              />
              {/* 닉네임 체크 상태 표시 */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {nicknameChecking && (
                  <LoadingSpinner />
                )}
                {!nicknameChecking && nicknameAvailable === true && (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {!nicknameChecking && nicknameAvailable === false && (
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            {/* 에러 메시지 표시 */}
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
            )}
          </div>

          {/* 생년월일 입력 */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${currentTheme?.textPrimary || 'text-gray-700'}`}>
              생년월일 *
            </label>
            <input
              type="date"
              name="birthDate"
              value={userData.birthDate}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded-md transition-colors ${
                errors.birthDate 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-300' 
                  : `${currentTheme?.inputBorder || 'border border-gray-300'} ${currentTheme?.inputFocus || 'focus:border-blue-500 focus:ring-blue-300'}`
              } ${currentTheme?.inputBg || 'bg-white'} ${currentTheme?.inputText || 'text-gray-900'}`}
              required
            />
            {/* 에러 메시지 표시 */}
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>
            )}
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isLoading || imageUploadLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              isLoading || imageUploadLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-lg'
            } ${currentTheme?.buttonBg || 'bg-blue-500'} ${currentTheme?.buttonText || 'text-white'}`}
          >
            {isLoading ? (
              imageUploadLoading ? '이미지 업로드 중...' : '회원가입 중...'
            ) : (
              '회원가입 완료'
            )}
          </button>
        </form>

        {/* 안내 텍스트 */}
        <p className={`text-xs text-center ${currentTheme?.textSecondary || 'text-gray-500'}`}>
          * 필수 입력 항목입니다<br />
          이미지는 5MB 이하의 JPG, PNG 파일만 업로드 가능합니다
        </p>
      </div>
    </div>
  );
}

export default RegisterPage; 