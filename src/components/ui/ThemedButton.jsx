import React from "react";
import { useSelector } from "react-redux";

function ThemedButton({ children, className = "", variant = "primary", ...props }) {
  const theme = useSelector((state) => {
    const current = state.theme.current;
    return state.theme.themes[current];
  });

  // variant에 따른 스타일 결정
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return "bg-red-500 text-white hover:bg-red-600 border-red-500";
      case "secondary":
        return `${theme.inputBg || 'bg-gray-100'} ${theme.textColor || 'text-gray-700'} ${theme.inputBorder || 'border-gray-300'} border hover:bg-gray-200`;
      case "primary":
      default:
        return `${theme.buttonBg} ${theme.buttonText} ${theme.buttonHover}`;
    }
  };

  return (
    <button
      className={`
        ${getVariantStyles()}
        px-4 py-2 rounded transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

export default ThemedButton;
