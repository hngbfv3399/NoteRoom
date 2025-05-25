import React, { memo } from 'react';
import PropTypes from 'prop-types';
import ThemedButton from "@/components/ui/ThemedButton";

const QuickButton = memo(function QuickButton({ buttons }) {
  return (
    <div 
      className="grid grid-cols-2 grid-rows-2 gap-2 mb-4" 
      role="toolbar" 
      aria-label="빠른 실행 버튼"
    >
      {buttons.map(({ label, action, icon }) => (
        <ThemedButton
          key={label}
          className="p-5 text-center border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          onClick={action}
          aria-label={label}
        >
          {icon && <span className="text-lg">{icon}</span>}
          <span>{label}</span>
        </ThemedButton>
      ))}
    </div>
  );
});

QuickButton.propTypes = {
  buttons: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      action: PropTypes.func.isRequired,
      icon: PropTypes.string,
    })
  ).isRequired,
};

export default QuickButton;
