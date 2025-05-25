export const truncateTitle = (title, length = 15) => {
    if (title.length <= length) return title;
    return title.slice(0, length) + "...";
  };
  