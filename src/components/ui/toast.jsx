import React, { useEffect } from 'react';

const Toast = ({ 
  message, 
  duration = 3000, 
  onClose,
  position = 'bottom-right'
}) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300 flex items-center space-x-2">
        <span>{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-gray-300 hover:text-white focus:outline-none"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;