import React, { useRef, useEffect } from 'react';

function Cell({ 
  cellId, 
  value, 
  isSelected, 
  isEditing, 
  userSelection, 
  onClick, 
  onDoubleClick, 
  onEdit, 
  editValue, 
  setEditValue 
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onEdit(editValue);
    } else if (e.key === 'Escape') {
      setEditValue(value);
      onEdit(value);
    }
  };

  const handleBlur = () => {
    onEdit(editValue);
  };

  const displayValue = isEditing ? editValue : value;

  return (
    <div
      className={`
        relative w-24 h-8 border-r border-b border-gray-300 
        ${isSelected ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-gray-50'}
        cursor-pointer
      `}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full h-full px-1 text-sm border-none outline-none bg-transparent"
        />
      ) : (
        <div className="w-full h-full px-1 text-sm flex items-center overflow-hidden">
          {displayValue}
        </div>
      )}
      
      {userSelection && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 border-2 rounded-sm"
            style={{ 
              borderColor: userSelection.user_color,
              boxShadow: `0 0 0 1px ${userSelection.user_color}40`
            }}
          />
          <div
            className="absolute -top-7 left-0 px-2 py-1 text-xs text-white rounded-md shadow-lg font-medium"
            style={{ backgroundColor: userSelection.user_color }}
          >
            {userSelection.user_name}
          </div>
          <div
            className="absolute top-0 right-0 w-2 h-2 rounded-full"
            style={{ backgroundColor: userSelection.user_color }}
          />
        </div>
      )}
    </div>
  );
}

export default Cell; 