import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  current: "modern",
  themes: {
    modern: {
      bgColor: "bg-gray-50",
      textColor: "text-gray-800", 
      fontStyle: "font-sans", 

      buttonBg: "bg-sky-200",
      buttonText: "text-gray-800",
      buttonHover: "hover:bg-sky-300",
    },
    retro: {
      bgColor: "bg-yellow-100",
      textColor: "text-green-800",
      fontStyle: "font-mono",
      buttonBg: "bg-green-700",
      buttonText: "text-yellow-100",
      buttonHover: "hover:bg-green-800",
    },
    dark: {
      bgColor: "bg-zinc-900",
      textColor: "text-white",
      fontStyle: "font-sans",
      buttonBg: "bg-gray-700",
      buttonText: "text-gray-100",
      buttonHover: "hover:bg-gray-600",
    },
    dreamy: {
      bgColor: "bg-purple-100",
      textColor: "text-purple-800",
      fontStyle: "font-serif",
      buttonBg: "bg-pink-400",
      buttonText: "text-white",
      buttonHover: "hover:bg-pink-500",
    },
    ocean: {
      bgColor: "bg-cyan-100",
      textColor: "text-blue-900",
      fontStyle: "font-sans",
      buttonBg: "bg-blue-400",
      buttonText: "text-white",
      buttonHover: "hover:bg-blue-500",
    },
    forest: {
      bgColor: "bg-green-100",
      textColor: "text-emerald-900",
      fontStyle: "font-serif",
      buttonBg: "bg-emerald-600",
      buttonText: "text-white",
      buttonHover: "hover:bg-emerald-700",
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
