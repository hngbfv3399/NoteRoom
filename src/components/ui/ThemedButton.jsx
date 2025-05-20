import React from "react";
import { useSelector } from "react-redux";

function ThemedButton({ children, className = "", ...props }) {
  const theme = useSelector((state) => {
    const current = state.theme.current;
    return state.theme.themes[current];
  });

  return (
    <button
      className={`
        ${theme.buttonBg} ${theme.buttonText} ${theme.buttonHover}
        px-4 py-2 rounded transition-colors duration-200
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}


export default ThemedButton;
