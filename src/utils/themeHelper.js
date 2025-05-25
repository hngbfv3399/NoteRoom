//src/utils/themeHelper.js


export function getThemeClass(theme) {
    return `${theme.bgColor} ${theme.textColor} ${theme.fontStyle}`;
  }
  
  export function getModalThemeClass(theme) {
    return theme.modalBgColor || "bg-white";
  }
  