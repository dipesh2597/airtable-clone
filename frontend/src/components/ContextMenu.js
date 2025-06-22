import React, { useEffect, useRef } from 'react';

function ContextMenu({ 
  isVisible, 
  position, 
  type, // 'row' or 'column'
  index, // row or column index
  onClose, 
  onInsertBefore,
  onInsertAfter,
  onDelete
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const menuItems = type === 'row' ? [
    { label: 'Insert row above', action: () => onInsertBefore(index) },
    { label: 'Insert row below', action: () => onInsertAfter(index) },
    { label: 'Delete row', action: () => onDelete(index), destructive: true }
  ] : [
    { label: 'Insert column left', action: () => onInsertBefore(index) },
    { label: 'Insert column right', action: () => onInsertAfter(index) },
    { label: 'Delete column', action: () => onDelete(index), destructive: true }
  ];

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-300 rounded-md shadow-lg py-1 z-50 min-w-40"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {menuItems.map((item, idx) => (
        <button
          key={idx}
          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
            item.destructive ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
          }`}
          onClick={() => {
            item.action();
            onClose();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default ContextMenu; 