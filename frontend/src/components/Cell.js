import React, { useRef, useEffect, useState } from 'react';
import { validateValue, getTypeIcon, getValidationColor } from '../utils/dataValidation';

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
  const [validationResult, setValidationResult] = useState(null);
  const isNavigatingWithTabRef = useRef(false);
  const editHandledByTabRef = useRef(false);

  // Validate the current cell value
  useEffect(() => {
    // Always validate, even for empty/null/undefined values
    const result = validateValue(value || '');
    setValidationResult(result);
  }, [value, cellId]);

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
      // Validate before saving
      const validation = validateValue(editValue);
      if (validation.isValid) {
        onEdit(validation.formattedValue);
      } else {
        // Show validation error but still save (user choice)
        console.warn(`Validation error in ${cellId}:`, validation.errors);
        onEdit(editValue); // Save anyway, but show error
      }
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
      
      // Validate before saving
      const validation = validateValue(editValue);
      if (validation.isValid) {
        onTabEdit(validation.formattedValue);
      } else {
        console.warn(`Validation error in ${cellId}:`, validation.errors);
        onTabEdit(editValue); // Save anyway, but show error
      }
    }
  };

  const handleBlur = () => {
    console.log(`🔧 Cell ${cellId}: Blur event, isNavigatingWithTab: ${isNavigatingWithTabRef.current}, editHandledByTab: ${editHandledByTabRef.current}`);
    // Only call onEdit if we're not navigating with Tab and Tab hasn't already handled the edit
    if (!isNavigatingWithTabRef.current && !editHandledByTabRef.current) {
      console.log(`🔧 Cell ${cellId}: Calling onEdit from blur`);
      // Validate before saving
      const validation = validateValue(editValue);
      if (validation.isValid) {
        onEdit(validation.formattedValue);
      } else {
        console.warn(`Validation error in ${cellId}:`, validation.errors);
        onEdit(editValue); // Save anyway, but show error
      }
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

  const displayValue = isEditing ? editValue : (validationResult?.formattedValue || (typeof value === 'string' ? value : ''));

  // Check if this cell is in the first row (row 1)
  const isFirstRow = cellId.match(/\d+/)[0] === '1';

  // Determine cell styling based on selection state and validation
  const getCellClassName = () => {
    let baseClass = 'relative w-16 sm:w-20 lg:w-24 h-8 border-r border-b border-gray-300 cursor-pointer touch-manipulation';
    
    if (isSelected) {
      baseClass += ' ring-2 ring-blue-500 ring-inset bg-blue-50';
    } else if (isInRange) {
      baseClass += ' bg-blue-100 border-blue-300';
    } else {
      baseClass += ' bg-white hover:bg-gray-50';
    }
    
    // Add validation styling
    if (validationResult && !validationResult.isValid) {
      baseClass += ' border-red-300 bg-red-50';
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
      title={validationResult && !validationResult.isValid ? validationResult.errors.join(', ') : ''}
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
        <div className="w-full h-full px-1 text-xs sm:text-sm flex items-center overflow-hidden relative">
          <span className={validationResult && !validationResult.isValid ? 'text-red-600' : ''}>
            {displayValue}
          </span>
          {/* Data type indicator */}
          {validationResult && validationResult.detectedType !== 'empty' && (
            <span 
              className={`absolute top-0 right-0 text-xs opacity-60 ${getValidationColor(validationResult.isValid)}`}
              title={`Type: ${validationResult.detectedType}`}
            >
              {getTypeIcon(validationResult.detectedType)}
            </span>
          )}
          {/* Validation error indicator */}
          {validationResult && !validationResult.isValid && (
            <span 
              className="absolute top-0 left-0 text-red-500 text-xs"
              title={validationResult.errors.join(', ')}
            >
              ⚠
            </span>
          )}
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