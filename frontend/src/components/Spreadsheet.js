import React, { useState, useEffect, useRef } from 'react';
import Cell from './Cell';

const COLUMNS = 26;
const ROWS = 100;

function Spreadsheet({ socket, user, data, setData, userSelections, setUserSelections }) {
  const [selectedCell, setSelectedCell] = useState('A1');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const gridRef = useRef(null);
  const selectedCellRef = useRef('A1'); // Ref to track current selected cell
  const editingCellRef = useRef(null); // Ref to track current editing cell

  useEffect(() => {
    if (!socket) return;

    socket.on('cell_updated', ({ cell_id, value, user_id }) => {
      setData(prev => ({
        ...prev,
        cells: {
          ...prev.cells,
          [cell_id]: {
            value,
            last_modified_by: user_id,
            last_modified_at: new Date().toISOString()
          }
        }
      }));
    });

    socket.on('cell_selected', ({ cell_id, user_id, user_name, user_color }) => {
      if (user_id !== socket.id) {
        console.log('Cell selected by other user:', { cell_id, user_id, user_name, user_color });
        setUserSelections(prev => {
          // Clear any previous selection by this user
          const newSelections = { ...prev };
          Object.keys(newSelections).forEach(cellId => {
            if (newSelections[cellId].user_id === user_id) {
              console.log('Clearing previous selection for user:', user_id, 'from cell:', cellId);
              delete newSelections[cellId];
            }
          });
          // Add the new selection
          newSelections[cell_id] = { user_id, user_name, user_color };
          console.log('Updated user selections:', newSelections);
          return newSelections;
        });
      }
    });

    return () => {
        if (socket) {
            socket.off('cell_updated');
            socket.off('cell_selected');
        }
    };
  }, [socket, setData, setUserSelections]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getColumnLabel = (index) => {
    return String.fromCharCode(65 + index);
  };

  const getCellId = (row, col) => {
    return `${getColumnLabel(col)}${row + 1}`;
  };

  const handleCellClick = (cellId) => {
    console.log(`Cell clicked: ${cellId}`);
    setSelectedCell(cellId);
    selectedCellRef.current = cellId; // Update ref immediately
    socket.emit('cell_selection', { cell_id: cellId });
  };

  const handleCellDoubleClick = (cellId) => {
    console.log(`Double-clicked cell: ${cellId}`);
    setEditingCell(cellId);
    editingCellRef.current = cellId; // Update ref immediately
    const cellData = data.cells[cellId];
    setEditValue(cellData?.value || '');
  };

  const handleCellEdit = (cellId, value) => {
    console.log(`📝 handleCellEdit called: ${cellId} = "${value}"`);
    
    setData(prev => ({
      ...prev,
      cells: {
        ...prev.cells,
        [cellId]: {
          value,
          last_modified_by: user.id,
          last_modified_at: new Date().toISOString()
        }
      }
    }));

    console.log(`📝 Sending cell_update event to server: ${cellId} = "${value}"`);
    socket.emit('cell_update', { cell_id: cellId, value });
    console.log(`📝 Setting editingCell to null`);
    setEditingCell(null);
    editingCellRef.current = null; // Update ref immediately
    setEditValue('');
    console.log(`📝 Edit mode ended, editingCell should be null`);
  };

  const handleCellEditAndNavigate = (cellId, value) => {
    console.log(`📝 handleCellEditAndNavigate called: ${cellId} = "${value}"`);
    handleCellEdit(cellId, value);
    // Navigate to cell below after editing (for Enter key)
    navigateToCellBelow(cellId);
  };

  const handleCellEditAndNavigateRight = (cellId, value) => {
    console.log(`📝 handleCellEditAndNavigateRight called: ${cellId} = "${value}"`);
    handleCellEdit(cellId, value);
    // Navigate to cell right after editing (for Tab key)
    navigateToCellRight(cellId);
  };

  const ensureGridFocus = () => {
    if (gridRef.current && document.activeElement !== gridRef.current) {
      console.log('🔍 Ensuring grid focus');
      gridRef.current.focus();
    }
  };

  const navigateToCellBelow = (currentCellId) => {
    console.log(`🔽 navigateToCellBelow called with: ${currentCellId}`);
    const [col, row] = currentCellId.match(/([A-Z]+)(\d+)/).slice(1);
    const colIndex = col.charCodeAt(0) - 65;
    const rowIndex = parseInt(row) - 1;
    
    const newRowIndex = Math.min(ROWS - 1, rowIndex + 1);
    const newCellId = getCellId(newRowIndex, colIndex);
    
    console.log(`🔽 Navigating to cell below: ${newCellId}`);
    setSelectedCell(newCellId);
    selectedCellRef.current = newCellId; // Update ref immediately
    console.log(`🔽 Updated ref to: ${selectedCellRef.current}`);
    socket.emit('cell_selection', { cell_id: newCellId });
    ensureGridFocus(); // Ensure grid has focus
  };

  const navigateToCellRight = (currentCellId) => {
    console.log(`➡️ navigateToCellRight called with: ${currentCellId}`);
    const [col, row] = currentCellId.match(/([A-Z]+)(\d+)/).slice(1);
    const colIndex = col.charCodeAt(0) - 65;
    const rowIndex = parseInt(row) - 1;
    
    const newColIndex = Math.min(COLUMNS - 1, colIndex + 1);
    const newCellId = getCellId(rowIndex, newColIndex);
    
    console.log(`➡️ Navigating to cell right: ${newCellId}`);
    setSelectedCell(newCellId);
    selectedCellRef.current = newCellId; // Update ref immediately
    console.log(`➡️ Updated ref to: ${selectedCellRef.current}`);
    socket.emit('cell_selection', { cell_id: newCellId });
    ensureGridFocus(); // Ensure grid has focus
  };

  const handleKeyDown = (e) => {
    const currentSelectedCell = selectedCellRef.current;
    const currentEditingCell = editingCellRef.current;
    console.log(`🔍 Keyboard handler - selectedCell: ${selectedCell}, ref: ${currentSelectedCell}, editingCell: ${editingCell}, ref: ${currentEditingCell}`);
    console.log(`🔍 Focus check - document.activeElement: ${document.activeElement}, gridRef.current: ${gridRef.current}`);
    
    if (!currentSelectedCell) {
      console.log('❌ No selected cell, returning');
      return;
    }
    
    // Check if grid has focus
    if (document.activeElement !== gridRef.current) {
      console.log('❌ Grid not focused, returning');
      return;
    }
    
    // Don't handle keyboard navigation if we're in edit mode
    if (currentEditingCell) {
      console.log('❌ In edit mode, keyboard navigation disabled');
      return;
    }
    
    const [col, row] = currentSelectedCell.match(/([A-Z]+)(\d+)/).slice(1);
    const colIndex = col.charCodeAt(0) - 65;
    const rowIndex = parseInt(row) - 1;

    let newColIndex = colIndex;
    let newRowIndex = rowIndex;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newRowIndex = Math.max(0, rowIndex - 1);
        console.log(`Arrow Up: Moving from ${currentSelectedCell} to row ${newRowIndex + 1}`);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newRowIndex = Math.min(ROWS - 1, rowIndex + 1);
        console.log(`Arrow Down: Moving from ${currentSelectedCell} to row ${newRowIndex + 1}`);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newColIndex = Math.max(0, colIndex - 1);
        console.log(`Arrow Left: Moving from ${currentSelectedCell} to column ${String.fromCharCode(65 + newColIndex)}`);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newColIndex = Math.min(COLUMNS - 1, colIndex + 1);
        console.log(`Arrow Right: Moving from ${currentSelectedCell} to column ${String.fromCharCode(65 + newColIndex)}`);
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          newColIndex = Math.max(0, colIndex - 1);
          console.log(`Shift+Tab: Moving from ${currentSelectedCell} to column ${String.fromCharCode(65 + newColIndex)}`);
        } else {
          newColIndex = Math.min(COLUMNS - 1, colIndex + 1);
          console.log(`Tab: Moving from ${currentSelectedCell} to column ${String.fromCharCode(65 + newColIndex)}`);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (e.shiftKey) {
          newRowIndex = Math.max(0, rowIndex - 1);
          console.log(`Shift+Enter: Moving from ${currentSelectedCell} to row ${newRowIndex + 1}`);
        } else {
          // Enter edit mode instead of moving down
          console.log(`Enter: Entering edit mode for cell ${currentSelectedCell}`);
          handleCellDoubleClick(currentSelectedCell);
          return;
        }
        break;
      case 'Backspace':
        e.preventDefault();
        console.log(`Backspace: Deleting cell data in ${currentSelectedCell}`);
        handleCellEdit(currentSelectedCell, '');
        return;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          console.log(`Typing "${e.key}" in cell ${currentSelectedCell}`);
          handleCellDoubleClick(currentSelectedCell);
          // Set the character as the initial edit value
          setEditValue(e.key);
        }
        return;
    }

    const newCellId = getCellId(newRowIndex, newColIndex);
    console.log(`✅ Navigating from ${currentSelectedCell} to ${newCellId}`);
    setSelectedCell(newCellId);
    selectedCellRef.current = newCellId; // Update ref immediately
    socket.emit('cell_selection', { cell_id: newCellId });
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (document.activeElement === gridRef.current) {
        handleKeyDown(e);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Focus the grid when component mounts
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.focus();
    }
    // Scroll to top to ensure first row is visible
    window.scrollTo(0, 0);
    // Also scroll the container to top
    const container = document.querySelector('.h-screen.overflow-auto');
    if (container) {
      container.scrollTop = 0;
    }
  }, []);

  // Update ref whenever selectedCell changes
  useEffect(() => {
    selectedCellRef.current = selectedCell;
  }, [selectedCell]);

  // Update ref whenever editingCell changes
  useEffect(() => {
    editingCellRef.current = editingCell;
  }, [editingCell]);

  const getGridStyle = () => {
    // Responsive grid layout
    const isMobile = windowSize.width < 640; // sm breakpoint
    const isTablet = windowSize.width < 1024; // lg breakpoint
    
    if (isMobile) {
      return {
        gridTemplateColumns: `48px repeat(${COLUMNS}, 64px)`,
        gridTemplateRows: `repeat(${ROWS}, 32px)`
      };
    } else if (isTablet) {
      return {
        gridTemplateColumns: `64px repeat(${COLUMNS}, 80px)`,
        gridTemplateRows: `repeat(${ROWS}, 32px)`
      };
    } else {
      return {
        gridTemplateColumns: `64px repeat(${COLUMNS}, 96px)`,
        gridTemplateRows: `repeat(${ROWS}, 32px)`
      };
    }
  };

  return (
    <div className="h-screen overflow-auto bg-white" style={{ scrollBehavior: 'smooth' }}>
      <div className="sticky top-0 bg-white z-10">
        <div className="flex border-b border-gray-300">
          <div className="w-12 sm:w-16 bg-gray-100 border-r border-gray-300 flex-shrink-0"></div>
          {Array.from({ length: COLUMNS }, (_, i) => (
            <div
              key={i}
              className="w-16 sm:w-20 lg:w-24 h-8 flex items-center justify-center bg-gray-100 border-r border-gray-300 text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0"
            >
              {getColumnLabel(i)}
            </div>
          ))}
        </div>
      </div>

      <div
        ref={gridRef}
        className="grid"
        style={getGridStyle()}
        tabIndex={0}
      >
        {Array.from({ length: ROWS }, (_, rowIndex) => (
          <React.Fragment key={rowIndex}>
            <div className="w-12 sm:w-16 h-8 flex items-center justify-center bg-gray-100 border-r border-gray-300 text-xs sm:text-sm text-gray-600 sticky left-0 flex-shrink-0">
              {rowIndex + 1}
            </div>
            {Array.from({ length: COLUMNS }, (_, colIndex) => {
              const cellId = getCellId(rowIndex, colIndex);
              const cellData = data.cells[cellId];
              const isSelected = selectedCell === cellId;
              const isEditing = editingCell === cellId;
              const userSelection = userSelections[cellId];

              return (
                <Cell
                  key={cellId}
                  cellId={cellId}
                  value={cellData?.value || ''}
                  isSelected={isSelected}
                  isEditing={isEditing}
                  userSelection={userSelection}
                  onClick={() => handleCellClick(cellId)}
                  onDoubleClick={() => handleCellDoubleClick(cellId)}
                  onEdit={(value) => handleCellEditAndNavigate(cellId, value)}
                  onTabEdit={(value) => handleCellEditAndNavigateRight(cellId, value)}
                  editValue={editValue}
                  setEditValue={setEditValue}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default Spreadsheet; 