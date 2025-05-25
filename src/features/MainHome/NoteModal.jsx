import React, { memo } from "react";
import PropTypes from "prop-types";
import MemoDetail from "@/pages/MemoDetail";
import { useSelector } from "react-redux";
import { getModalThemeClass } from "@/utils/themeHelper";

const NoteModal = memo(function NoteModal({ note, onClose }) {
  const { current, themes } = useSelector((state) => state.theme);
  const modalBgClass = themes[current] ? getModalThemeClass(themes[current]) : "bg-white";

  if (!note) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`${modalBgClass} p-6 rounded max-w-3xl w-full max-h-[80vh] overflow-y-auto relative animate-slideUp hide-scrollbar`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-xl font-bold hover:text-gray-700 transition-colors"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <MemoDetail note={note} />
      </div>
    </div>
  );
});

NoteModal.propTypes = {
  note: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string,
    author: PropTypes.string,
    date: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

export default NoteModal;
