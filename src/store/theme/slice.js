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
    },

    retro: {
      bgColor: "bg-yellow-100",
      modalBgColor: "bg-yellow-50",
      cardBg: "bg-yellow-50",
      textColor: "text-green-800",
      textSecondary: "text-green-600",
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
    },

    dark: {
      bgColor: "bg-zinc-900",
      modalBgColor: "bg-zinc-800",
      cardBg: "bg-zinc-800",
      textColor: "text-white",
      textSecondary: "text-gray-400",
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
    },

    dreamy: {
      bgColor: "bg-purple-100",
      modalBgColor: "bg-purple-50",
      cardBg: "bg-purple-50",
      textColor: "text-purple-800",
      textSecondary: "text-purple-600",
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
    },

    ocean: {
      bgColor: "bg-cyan-100",
      modalBgColor: "bg-cyan-50",
      cardBg: "bg-cyan-50",
      textColor: "text-blue-900",
      textSecondary: "text-blue-600",
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
    },

    forest: {
      bgColor: "bg-green-100",
      modalBgColor: "bg-green-50",
      cardBg: "bg-green-50",
      textColor: "text-emerald-900",
      textSecondary: "text-emerald-600",
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
