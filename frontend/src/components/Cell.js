import React, { useRef, useEffect, useState } from 'react';

function Cell({ 
  cellId, 
  value, 
  isSelected, 
  isInRange,
  isEditing, 
  userSelection, 
  onClick, 
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  onDoubleClick, 
  onEdit, 
  onTabEdit
}) {
  const inputRef = useRef(null);
  const [editValue, setEditValue] = useState(value || '');
  const isNavigatingWithTabRef = useRef(false);
  const editHandledByTabRef = useRef(false);

  // When entering edit mode, initialize editValue from value prop
  useEffect(() => {
    if (isEditing) {
      setEditValue(value || '');
      editHandledByTabRef.current = false; // Reset flag when entering edit mode
    }
  }, [isEditing, value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      // Prevent scroll when focusing input in edit mode
      inputRef.current.focus({ preventScroll: true });
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      onEdit(editValue);
      // Exit edit mode - parent will handle navigation
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditValue(value);
      onEdit(value);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      console.log(`🔧 Cell ${cellId}: Tab pressed, setting navigation flag`);
      isNavigatingWithTabRef.current = true; // Set flag to prevent blur from triggering
      editHandledByTabRef.current = true; // Mark that Tab will handle the edit
      onTabEdit(editValue); // Save current value and navigate right
      // The Tab handler will handle both edit and navigation, so we don't need blur to do anything
    }
  };

  const handleBlur = () => {
    console.log(`🔧 Cell ${cellId}: Blur event, isNavigatingWithTab: ${isNavigatingWithTabRef.current}, editHandledByTab: ${editHandledByTabRef.current}`);
    // Only call onEdit if we're not navigating with Tab and Tab hasn't already handled the edit
    if (!isNavigatingWithTabRef.current && !editHandledByTabRef.current) {
      console.log(`🔧 Cell ${cellId}: Calling onEdit from blur`);
      onEdit(editValue);
    } else {
      console.log(`🔧 Cell ${cellId}: Skipping onEdit from blur due to Tab navigation`);
    }
    // Reset the flags after a longer delay to prevent multiple blur events
    setTimeout(() => {
      isNavigatingWithTabRef.current = false;
      editHandledByTabRef.current = false;
      console.log(`🔧 Cell ${cellId}: Reset navigation flags`);
    }, 100); // Increased from 10ms to 100ms
  };

  const displayValue = isEditing ? editValue : (typeof value === 'string' ? value : '');

  // Check if this cell is in the first row (row 1)
  const isFirstRow = cellId.match(/\d+/)[0] === '1';

  // Determine cell styling based on selection state
  const getCellClassName = () => {
    let baseClass = 'relative w-16 sm:w-20 lg:w-24 h-8 border-r border-b border-gray-300 cursor-pointer touch-manipulation';
    
    if (isSelected) {
      baseClass += ' ring-2 ring-blue-500 ring-inset bg-blue-50';
    } else if (isInRange) {
      baseClass += ' bg-blue-100 border-blue-300';
    } else {
      baseClass += ' bg-white hover:bg-gray-50';
    }
    
    return baseClass;
  };

  return (
    <div
      id={`cell-${cellId}`}
      className={getCellClassName()}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
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
          className="w-full h-full px-1 text-xs sm:text-sm border-none outline-none bg-transparent"
        />
      ) : (
        <div className="w-full h-full px-1 text-xs sm:text-sm flex items-center overflow-hidden">
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
            className="absolute left-0 px-1 sm:px-2 py-1 text-xs text-white rounded-md shadow-lg font-medium z-10 max-w-[80%] truncate"
            style={{ 
              backgroundColor: userSelection.user_color,
              top: isFirstRow ? '100%' : '-28px',
              transform: isFirstRow ? 'translateY(2px)' : 'none'
            }}
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