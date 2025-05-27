import { createSlice } from "@reduxjs/toolkit";


const initialState = {
  current: "modern",  
  themes: {

    modern: {
      bgColor: "bg-gray-50",
      modalBgColor: "bg-white",
      cardBg: "bg-white",
      textColor: "text-gray-800",
      textSecondary: "text-gray-500",
      textPrimary: "text-gray-900",
      linkColor: "text-blue-600",
      fontStyle: "font-sans",
      buttonBg: "bg-sky-200",
      buttonText: "text-gray-800",
      buttonHover: "hover:bg-sky-300",
      hoverBg: "hover:bg-gray-100",

      inputBg: "bg-white",
      inputText: "text-gray-800",
      inputBorder: "border border-gray-300",
      inputFocus: "focus:border-sky-500 focus:ring-sky-300",
      
      borderColor: "border-gray-200",
      dividerColor: "border-gray-200",
      shadowColor: "shadow-lg",
      
      // 새로운 UI 컴포넌트용 색상
      successColor: "text-green-600",
      errorColor: "text-red-600",
      warningColor: "text-yellow-600",
      infoColor: "text-blue-600",
      
      // 그라데이션
      gradientBg: "bg-gradient-to-r from-blue-50 to-indigo-50",
      gradientText: "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent",
      
      // 상태별 배경색
      successBg: "bg-green-50",
      errorBg: "bg-red-50",
      warningBg: "bg-yellow-50",
      infoBg: "bg-blue-50",
      
      // 추가 UI 스타일
      disabledBg: "bg-gray-100",
      disabledText: "text-gray-400",
      disabledBorder: "border-gray-200",
      
      // 선택 영역
      selectionBg: "selection:bg-blue-200",
      selectionText: "selection:text-blue-900",
      
      // 포커스 링
      focusRing: "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
      
      // 스크롤바 (Webkit)
      scrollbarTrack: "scrollbar-track-gray-100",
      scrollbarThumb: "scrollbar-thumb-gray-300",
      scrollbarThumbHover: "scrollbar-thumb-gray-400",
      
      // 로딩/스켈레톤
      skeletonBg: "bg-gray-200",
      skeletonShimmer: "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200",
      
      // 오버레이
      overlayBg: "bg-black/50",
      backdropBlur: "backdrop-blur-sm",
      
      // 상태 표시
      activeBg: "bg-blue-100",
      activeText: "text-blue-700",
      activeBorder: "border-blue-300",
    },

    retro: {
      bgColor: "bg-yellow-100",
      modalBgColor: "bg-yellow-50",
      cardBg: "bg-yellow-50",
      textColor: "text-green-800",
      textSecondary: "text-green-600",
      textPrimary: "text-green-900",
      linkColor: "text-green-700",
      fontStyle: "font-mono",
      buttonBg: "bg-green-700",
      buttonText: "text-yellow-100",
      buttonHover: "hover:bg-green-800",
      hoverBg: "hover:bg-yellow-200",

      inputBg: "bg-yellow-50",
      inputText: "text-green-900",
      inputBorder: "border border-green-700",
      inputFocus: "focus:border-green-500 focus:ring-green-300",
      
      borderColor: "border-green-300",
      dividerColor: "border-green-300",
      shadowColor: "shadow-lg",
      
      // 새로운 UI 컴포넌트용 색상
      successColor: "text-green-700",
      errorColor: "text-red-700",
      warningColor: "text-orange-700",
      infoColor: "text-blue-700",
      
      // 그라데이션
      gradientBg: "bg-gradient-to-r from-yellow-100 to-green-100",
      gradientText: "bg-gradient-to-r from-green-700 to-green-800 bg-clip-text text-transparent",
      
      // 상태별 배경색
      successBg: "bg-green-100",
      errorBg: "bg-red-100",
      warningBg: "bg-orange-100",
      infoBg: "bg-blue-100",
      
      // 추가 UI 스타일
      disabledBg: "bg-yellow-200",
      disabledText: "text-green-400",
      disabledBorder: "border-green-200",
      
      // 선택 영역
      selectionBg: "selection:bg-green-200",
      selectionText: "selection:text-green-900",
      
      // 포커스 링
      focusRing: "focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
      
      // 스크롤바 (Webkit)
      scrollbarTrack: "scrollbar-track-yellow-100",
      scrollbarThumb: "scrollbar-thumb-green-300",
      scrollbarThumbHover: "scrollbar-thumb-green-400",
      
      // 로딩/스켈레톤
      skeletonBg: "bg-yellow-200",
      skeletonShimmer: "bg-gradient-to-r from-yellow-200 via-green-200 to-yellow-200",
      
      // 오버레이
      overlayBg: "bg-green-900/50",
      backdropBlur: "backdrop-blur-sm",
      
      // 상태 표시
      activeBg: "bg-green-100",
      activeText: "text-green-800",
      activeBorder: "border-green-400",
    },

    dark: {
      bgColor: "bg-zinc-900",
      modalBgColor: "bg-zinc-800",
      cardBg: "bg-zinc-800",
      textColor: "text-white",
      textSecondary: "text-gray-400",
      textPrimary: "text-gray-100",
      linkColor: "text-blue-400",
      fontStyle: "font-sans",
      buttonBg: "bg-gray-700",
      buttonText: "text-gray-100",
      buttonHover: "hover:bg-gray-600",
      hoverBg: "hover:bg-zinc-700",

      inputBg: "bg-zinc-800",
      inputText: "text-gray-100",
      inputBorder: "border border-zinc-700",
      inputFocus: "focus:border-gray-400 focus:ring-gray-600",
      
      borderColor: "border-zinc-700",
      dividerColor: "border-zinc-700",
      shadowColor: "shadow-lg",
      
      // 새로운 UI 컴포넌트용 색상
      successColor: "text-green-400",
      errorColor: "text-red-400",
      warningColor: "text-yellow-400",
      infoColor: "text-blue-400",
      
      // 그라데이션
      gradientBg: "bg-gradient-to-r from-zinc-800 to-gray-800",
      gradientText: "bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent",
      
      // 상태별 배경색
      successBg: "bg-green-900/20",
      errorBg: "bg-red-900/20",
      warningBg: "bg-yellow-900/20",
      infoBg: "bg-blue-900/20",
    },

    dreamy: {
      bgColor: "bg-purple-100",
      modalBgColor: "bg-purple-50",
      cardBg: "bg-purple-50",
      textColor: "text-purple-800",
      textSecondary: "text-purple-600",
      textPrimary: "text-purple-900",
      linkColor: "text-pink-600",
      fontStyle: "font-serif",
      buttonBg: "bg-pink-400",
      buttonText: "text-white",
      buttonHover: "hover:bg-pink-500",
      hoverBg: "hover:bg-purple-200",

      inputBg: "bg-purple-50",
      inputText: "text-purple-900",
      inputBorder: "border border-purple-300",
      inputFocus: "focus:border-pink-400 focus:ring-pink-300",
      
      borderColor: "border-purple-200",
      dividerColor: "border-purple-200",
      shadowColor: "shadow-lg",
      
      // 새로운 UI 컴포넌트용 색상
      successColor: "text-green-700",
      errorColor: "text-red-700",
      warningColor: "text-orange-700",
      infoColor: "text-blue-700",
      
      // 그라데이션
      gradientBg: "bg-gradient-to-r from-purple-100 to-pink-100",
      gradientText: "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent",
      
      // 상태별 배경색
      successBg: "bg-green-100",
      errorBg: "bg-red-100",
      warningBg: "bg-orange-100",
      infoBg: "bg-blue-100",
    },

    ocean: {
      bgColor: "bg-cyan-100",
      modalBgColor: "bg-cyan-50",
      cardBg: "bg-cyan-50",
      textColor: "text-blue-900",
      textSecondary: "text-blue-600",
      textPrimary: "text-blue-950",
      linkColor: "text-blue-700",
      fontStyle: "font-sans",
      buttonBg: "bg-blue-400",
      buttonText: "text-white",
      buttonHover: "hover:bg-blue-500",
      hoverBg: "hover:bg-cyan-200",

      inputBg: "bg-cyan-50",
      inputText: "text-blue-900",
      inputBorder: "border border-blue-300",
      inputFocus: "focus:border-blue-500 focus:ring-blue-300",
      
      borderColor: "border-blue-200",
      dividerColor: "border-blue-200",
      shadowColor: "shadow-lg",
      
      // 새로운 UI 컴포넌트용 색상
      successColor: "text-green-700",
      errorColor: "text-red-700",
      warningColor: "text-yellow-700",
      infoColor: "text-blue-700",
      
      // 그라데이션
      gradientBg: "bg-gradient-to-r from-cyan-100 to-blue-100",
      gradientText: "bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent",
      
      // 상태별 배경색
      successBg: "bg-green-100",
      errorBg: "bg-red-100",
      warningBg: "bg-yellow-100",
      infoBg: "bg-blue-100",
    },

    forest: {
      bgColor: "bg-green-100",
      modalBgColor: "bg-green-50",
      cardBg: "bg-green-50",
      textColor: "text-emerald-900",
      textSecondary: "text-emerald-600",
      textPrimary: "text-emerald-950",
      linkColor: "text-emerald-700",
      fontStyle: "font-serif",
      buttonBg: "bg-emerald-600",
      buttonText: "text-white",
      buttonHover: "hover:bg-emerald-700",
      hoverBg: "hover:bg-green-200",

      inputBg: "bg-green-50",
      inputText: "text-emerald-900",
      inputBorder: "border border-emerald-500",
      inputFocus: "focus:border-emerald-600 focus:ring-emerald-400",
      
      borderColor: "border-emerald-300",
      dividerColor: "border-emerald-300",
      shadowColor: "shadow-lg",
      
      // 새로운 UI 컴포넌트용 색상
      successColor: "text-green-700",
      errorColor: "text-red-700",
      warningColor: "text-yellow-700",
      infoColor: "text-blue-700",
      
      // 그라데이션
      gradientBg: "bg-gradient-to-r from-green-100 to-emerald-100",
      gradientText: "bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent",
      
      // 상태별 배경색
      successBg: "bg-green-100",
      errorBg: "bg-red-100",
      warningBg: "bg-yellow-100",
      infoBg: "bg-blue-100",
    },

    // 새로운 테마들
    sunset: {
      bgColor: "bg-orange-100",
      modalBgColor: "bg-orange-50",
      cardBg: "bg-orange-50",
      textColor: "text-orange-900",
      textSecondary: "text-orange-600",
      textPrimary: "text-orange-950",
      linkColor: "text-red-600",
      fontStyle: "font-sans",
      buttonBg: "bg-red-500",
      buttonText: "text-white",
      buttonHover: "hover:bg-red-600",
      hoverBg: "hover:bg-orange-200",

      inputBg: "bg-orange-50",
      inputText: "text-orange-900",
      inputBorder: "border border-orange-300",
      inputFocus: "focus:border-red-500 focus:ring-red-300",
      
      borderColor: "border-orange-200",
      dividerColor: "border-orange-200",
      shadowColor: "shadow-lg",
      
      successColor: "text-green-700",
      errorColor: "text-red-700",
      warningColor: "text-yellow-700",
      infoColor: "text-blue-700",
      
      gradientBg: "bg-gradient-to-r from-orange-100 to-red-100",
      gradientText: "bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent",
      
      successBg: "bg-green-100",
      errorBg: "bg-red-100",
      warningBg: "bg-yellow-100",
      infoBg: "bg-blue-100",
    },

    midnight: {
      bgColor: "bg-slate-900",
      modalBgColor: "bg-slate-800",
      cardBg: "bg-slate-800",
      textColor: "text-slate-100",
      textSecondary: "text-slate-400",
      textPrimary: "text-white",
      linkColor: "text-indigo-400",
      fontStyle: "font-sans",
      buttonBg: "bg-indigo-600",
      buttonText: "text-white",
      buttonHover: "hover:bg-indigo-700",
      hoverBg: "hover:bg-slate-700",

      inputBg: "bg-slate-800",
      inputText: "text-slate-100",
      inputBorder: "border border-slate-600",
      inputFocus: "focus:border-indigo-500 focus:ring-indigo-400",
      
      borderColor: "border-slate-600",
      dividerColor: "border-slate-600",
      shadowColor: "shadow-lg",
      
      successColor: "text-green-400",
      errorColor: "text-red-400",
      warningColor: "text-yellow-400",
      infoColor: "text-blue-400",
      
      gradientBg: "bg-gradient-to-r from-slate-900 to-indigo-900",
      gradientText: "bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent",
      
      successBg: "bg-green-900/20",
      errorBg: "bg-red-900/20",
      warningBg: "bg-yellow-900/20",
      infoBg: "bg-blue-900/20",
    },

    nature: {
      bgColor: "bg-lime-100",
      modalBgColor: "bg-lime-50",
      cardBg: "bg-lime-50",
      textColor: "text-green-900",
      textSecondary: "text-green-600",
      textPrimary: "text-green-950",
      linkColor: "text-teal-700",
      fontStyle: "font-serif",
      buttonBg: "bg-teal-600",
      buttonText: "text-white",
      buttonHover: "hover:bg-teal-700",
      hoverBg: "hover:bg-lime-200",

      inputBg: "bg-lime-50",
      inputText: "text-green-900",
      inputBorder: "border border-green-400",
      inputFocus: "focus:border-teal-500 focus:ring-teal-300",
      
      borderColor: "border-green-300",
      dividerColor: "border-green-300",
      shadowColor: "shadow-lg",
      
      successColor: "text-green-700",
      errorColor: "text-red-700",
      warningColor: "text-yellow-700",
      infoColor: "text-blue-700",
      
      gradientBg: "bg-gradient-to-r from-lime-100 to-green-100",
      gradientText: "bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent",
      
      successBg: "bg-green-100",
      errorBg: "bg-red-100",
      warningBg: "bg-yellow-100",
      infoBg: "bg-blue-100",
    },

    elegant: {
      bgColor: "bg-stone-100",
      modalBgColor: "bg-stone-50",
      cardBg: "bg-stone-50",
      textColor: "text-stone-800",
      textSecondary: "text-stone-600",
      textPrimary: "text-stone-900",
      linkColor: "text-amber-700",
      fontStyle: "font-serif",
      buttonBg: "bg-amber-600",
      buttonText: "text-white",
      buttonHover: "hover:bg-amber-700",
      hoverBg: "hover:bg-stone-200",

      inputBg: "bg-stone-50",
      inputText: "text-stone-900",
      inputBorder: "border border-stone-300",
      inputFocus: "focus:border-amber-500 focus:ring-amber-300",
      
      borderColor: "border-stone-200",
      dividerColor: "border-stone-200",
      shadowColor: "shadow-lg",
      
      successColor: "text-green-700",
      errorColor: "text-red-700",
      warningColor: "text-yellow-700",
      infoColor: "text-blue-700",
      
      gradientBg: "bg-gradient-to-r from-stone-100 to-amber-100",
      gradientText: "bg-gradient-to-r from-stone-600 to-amber-600 bg-clip-text text-transparent",
      
      successBg: "bg-green-100",
      errorBg: "bg-red-100",
      warningBg: "bg-yellow-100",
      infoBg: "bg-blue-100",
    },
  },
};


const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {

    setTheme: (state, action) => {
      state.current = action.payload;      
    },
  },
});

  
export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
