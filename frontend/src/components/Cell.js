import React, { useRef, useEffect, useState } from 'react';
import { validateValue, getTypeIcon, getValidationColor } from '../utils/dataValidation';

function Cell({ 
  cellId, 
  value, 
  data,
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
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [autoCompleteIndex, setAutoCompleteIndex] = useState(0);
  const isNavigatingWithTabRef = useRef(false);
  const editHandledByTabRef = useRef(false);

  // Formula suggestions for auto-complete
  const formulaSuggestions = [
    '=SUM(',
    '=AVERAGE(',
    '=COUNT('
  ];

  // Validate the current cell value
  useEffect(() => {
    // Always validate, even for empty/null/undefined values
    const result = validateValue(value || '', null, data);
    setValidationResult(result);
  }, [value, cellId, data]);

  // When entering edit mode, initialize editValue from value prop
  useEffect(() => {
    if (isEditing) {
      // For formulas, show the original formula text when editing
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

  // Handle input changes and auto-complete
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    
    // Show auto-complete when typing "="
    if (newValue === '=') {
      setShowAutoComplete(true);
      setAutoCompleteIndex(0);
    } else if (newValue.startsWith('=') && newValue.length > 1) {
      // Filter suggestions based on what's typed
      const filteredSuggestions = formulaSuggestions.filter(suggestion => 
        suggestion.toLowerCase().startsWith(newValue.toLowerCase())
      );
      if (filteredSuggestions.length > 0) {
        setShowAutoComplete(true);
        setAutoCompleteIndex(0);
      } else {
        setShowAutoComplete(false);
      }
    } else {
      setShowAutoComplete(false);
    }
  };

  const handleKeyDown = (e) => {
    // Handle auto-complete navigation
    if (showAutoComplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAutoCompleteIndex(prev => (prev + 1) % formulaSuggestions.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAutoCompleteIndex(prev => (prev - 1 + formulaSuggestions.length) % formulaSuggestions.length);
        return;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        // Apply the selected suggestion
        const selectedSuggestion = formulaSuggestions[autoCompleteIndex];
        setEditValue(selectedSuggestion);
        setShowAutoComplete(false);
        
        // If it's Tab, also navigate to next cell
        if (e.key === 'Tab') {
          isNavigatingWithTabRef.current = true;
          editHandledByTabRef.current = true;
          onTabEdit(selectedSuggestion);
        }
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutoComplete(false);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      setShowAutoComplete(false);
      // For formulas, save the original formula text, not the calculated result
      const validation = validateValue(editValue, null, data);
      if (validation.detectedType === 'formula') {
        onEdit(editValue); // Save the original formula text
      } else if (validation.isValid) {
        onEdit(validation.formattedValue);
      } else {
        // Show validation error but still save (user choice)
        console.warn(`Validation error in ${cellId}:`, validation.errors);
        onEdit(editValue); // Save anyway, but show error
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditValue(value);
      setShowAutoComplete(false);
      onEdit(value);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      setShowAutoComplete(false);
      isNavigatingWithTabRef.current = true; // Set flag to prevent blur from triggering
      editHandledByTabRef.current = true; // Mark that Tab will handle the edit
      
      // For formulas, save the original formula text, not the calculated result
      const validation = validateValue(editValue, null, data);
      if (validation.detectedType === 'formula') {
        onTabEdit(editValue); // Save the original formula text
      } else if (validation.isValid) {
        onTabEdit(validation.formattedValue);
      } else {
        console.warn(`Validation error in ${cellId}:`, validation.errors);
        onTabEdit(editValue); // Save anyway, but show error
      }
    }
  };

  const handleBlur = () => {
    // Close auto-complete when losing focus
    setShowAutoComplete(false);
    
    // Only call onEdit if we're not navigating with Tab and Tab hasn't already handled the edit
    if (!isNavigatingWithTabRef.current && !editHandledByTabRef.current) {
      // For formulas, save the original formula text, not the calculated result
      const validation = validateValue(editValue, null, data);
      if (validation.detectedType === 'formula') {
        onEdit(editValue); // Save the original formula text
      } else if (validation.isValid) {
        onEdit(validation.formattedValue);
      } else {
        console.warn(`Validation error in ${cellId}:`, validation.errors);
        onEdit(editValue); // Save anyway, but show error
      }
    }
    // Reset the flags after a longer delay to prevent multiple blur events
    setTimeout(() => {
      isNavigatingWithTabRef.current = false;
      editHandledByTabRef.current = false;
    }, 100);
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
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-full h-full px-1 text-xs sm:text-sm border-none outline-none bg-transparent"
          />
          {/* Auto-complete dropdown */}
          {showAutoComplete && (
            <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg min-w-32">
              {formulaSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  className={`px-2 py-1 text-xs cursor-pointer hover:bg-blue-100 ${
                    index === autoCompleteIndex ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => {
                    setEditValue(suggestion);
                    setShowAutoComplete(false);
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
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