import React from "react";
import { useSelector } from "react-redux";

function ThemedButton({ children, className = "", variant = "primary", loading = false, disabled = false, ...props }) {
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

  // loading이나 disabled 상태일 때 버튼 비활성화
  const isDisabled = loading || disabled;

  return (
    <button
      className={`
        ${getVariantStyles()}
        px-4 py-2 rounded transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>{children}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

export default ThemedButton;
