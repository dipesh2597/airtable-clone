import React, { useState, useEffect, useRef } from 'react';
import Cell from './Cell';
import ContextMenu from './ContextMenu';

const COLUMNS = 26;
const ROWS = 100;

function Spreadsheet({ socket, user, data, setData, userSelections, setUserSelections }) {
  const [selectedCell, setSelectedCell] = useState('A1');
  const [selectedRange, setSelectedRange] = useState(null); // { start: 'A1', end: 'C3' }
  const selectedRangeRef = useRef(null);
  const [editingCell, setEditingCell] = useState(null);
  const [clipboard, setClipboard] = useState(null); // { data: [], type: 'copy' | 'cut' }
  const [contextMenu, setContextMenu] = useState({ isVisible: false, position: { x: 0, y: 0 }, type: null, index: null });
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const gridRef = useRef(null);
  const selectedCellRef = useRef('A1'); // Ref to track current selected cell
  const editingCellRef = useRef(null); // Ref to track current editing cell
  const isSelectingRef = useRef(false); // Track if we're in selection mode
  const selectionStartRef = useRef('A1'); // Track the start of selection
  const pasteInputRef = useRef(null);
  const dataRef = useRef(data);

  useEffect(() => {
    if (!socket) return;

    socket.on('cell_updated', ({ cell_id, value, original_value, data_type, is_valid, validation_errors, user_id }) => {
      setData(prev => ({
        ...prev,
        cells: {
          ...prev.cells,
          [cell_id]: {
            value,
            original_value,
            data_type,
            is_valid,
            validation_errors,
            last_modified_by: user_id,
            last_modified_at: new Date().toISOString()
          }
        }
      }));
    });

    socket.on('cell_selected', ({ cell_id, user_id, user_name, user_color }) => {
      if (user_id !== socket.id) {
    
        setUserSelections(prev => {
          // Clear any previous selection by this user
          const newSelections = { ...prev };
          Object.keys(newSelections).forEach(cellId => {
            if (newSelections[cellId].user_id === user_id) {

              delete newSelections[cellId];
            }
          });
          // Add the new selection
          newSelections[cell_id] = { user_id, user_name, user_color };

          return newSelections;
        });
      }
    });

    socket.on('row_operation_applied', ({ type, index, user_id, cells }) => {
      
      setData(prev => ({
        ...prev,
        cells: cells
      }));
      // Close context menu if open
      setContextMenu({ isVisible: false, position: { x: 0, y: 0 }, type: null, index: null });
    });

    socket.on('column_operation_applied', ({ type, index, user_id, cells }) => {
      
      setData(prev => ({
        ...prev,
        cells: cells
      }));
      // Close context menu if open
      setContextMenu({ isVisible: false, position: { x: 0, y: 0 }, type: null, index: null });
    });

    return () => {
        if (socket) {
            socket.off('cell_updated');
            socket.off('cell_selected');
            socket.off('row_operation_applied');
            socket.off('column_operation_applied');
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

  // Helper functions for cell selection and copy/paste
  const parseCellId = (cellId) => {
    const [col, row] = cellId.match(/([A-Z]+)(\d+)/).slice(1);
    return {
      col: col.charCodeAt(0) - 65,
      row: parseInt(row) - 1
    };
  };

  const getCellRange = (startCell, endCell) => {
    const start = parseCellId(startCell);
    const end = parseCellId(endCell);
    
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    
    const cells = [];
    for (let row = minRow; row <= maxRow; row++) {
      const rowCells = [];
      for (let col = minCol; col <= maxCol; col++) {
        rowCells.push(getCellId(row, col));
      }
      cells.push(rowCells);
    }
    
    return cells;
  };

  const isCellInRange = (cellId, range) => {
    if (!range) return false;
    
    const cell = parseCellId(cellId);
    const start = parseCellId(range.start);
    const end = parseCellId(range.end);
    
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    
    return cell.row >= minRow && cell.row <= maxRow && 
           cell.col >= minCol && cell.col <= maxCol;
  };

  const copySelection = () => {
    if (selectedRange) {
      // Copy range selection
      const rangeData = getCellRange(selectedRange.start, selectedRange.end);
      const clipboardData = rangeData.map(row => 
        row.map(cellId => data.cells[cellId]?.value || '')
      );
      
      setClipboard({
        data: clipboardData,
        type: 'copy'
      });
      

    } else if (selectedCell) {
      // Copy single cell
      const cellValue = data.cells[selectedCell]?.value || '';
      setClipboard({
        data: [[cellValue]],
        type: 'copy'
      });
      

    }
  };

  const cutSelection = () => {
    if (selectedRange) {
      // Cut range selection
      copySelection();
      setClipboard(prev => ({ ...prev, type: 'cut' }));
      
      // Clear the cells if it's a cut operation
      const rangeData = getCellRange(selectedRange.start, selectedRange.end);
      const updates = {};
      rangeData.flat().forEach(cellId => {
        updates[cellId] = '';
      });
      
      setData(prev => ({
        ...prev,
        cells: { ...prev.cells, ...updates }
      }));
      
      // Emit updates to server
      Object.entries(updates).forEach(([cellId, value]) => {
        socket.emit('cell_update', { cell_id: cellId, value });
      });
      

    } else if (selectedCell) {
      // Cut single cell
      copySelection();
      setClipboard(prev => ({ ...prev, type: 'cut' }));
      
      // Clear the cell
      setData(prev => ({
        ...prev,
        cells: { ...prev.cells, [selectedCell]: '' }
      }));
      
      socket.emit('cell_update', { cell_id: selectedCell, value: '' });
      

    }
  };

  const pasteSelection = (targetCell) => {
    const cellToPaste = targetCell || selectedCell;
    if (!clipboard || !clipboard.data.length) {
      return;
    }
    
    const target = parseCellId(cellToPaste);
    const updates = {};
    
    clipboard.data.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        const cellRow = target.row + rowIndex;
        const cellCol = target.col + colIndex;
        
        if (cellRow < ROWS && cellCol < COLUMNS) {
          const cellId = getCellId(cellRow, cellCol);
          updates[cellId] = value;
        }
      });
    });
    
    setData(prev => ({
      ...prev,
      cells: { ...prev.cells, ...updates }
    }));
    
    // Emit updates to server
    Object.entries(updates).forEach(([cellId, value]) => {
      socket.emit('cell_update', { cell_id: cellId, value });
    });
    

  };

  const handleCellClick = (cellId, event) => {
    // Only clear selectedRange if Shift is NOT held
    if (event && event.shiftKey && selectedCell) {
      setSelectedRange({
        start: selectedCell,
        end: cellId
      });
      isSelectingRef.current = true;
    } else {
      setSelectedCell(cellId);
      setSelectedRange(null); // Only clear here
      selectedCellRef.current = cellId;
      selectionStartRef.current = cellId; // Set selection start
      isSelectingRef.current = false;
      socket.emit('cell_selection', { cell_id: cellId });
    }
  };

  const handleCellMouseDown = (cellId, event) => {
    if (event.button === 0) {

      setSelectedCell(cellId);
      selectedCellRef.current = cellId;
      selectionStartRef.current = cellId; // Set selection start
      setSelectedRange({ start: cellId, end: cellId }); // Show initial selection as range
      isSelectingRef.current = true;
      socket.emit('cell_selection', { cell_id: cellId });
    }
  };

  const handleCellMouseEnter = (cellId, event) => {
    if (isSelectingRef.current && event.buttons === 1) {
      const startCell = selectionStartRef.current;
      setSelectedRange({ start: startCell, end: cellId });
    }
  };

      const handleCellMouseUp = () => {
      isSelectingRef.current = false;
    };

      const handleCellDoubleClick = (cellId) => {
      setEditingCell(cellId);
      editingCellRef.current = cellId; // Update ref immediately
    };

      const handleCellEdit = (cellId, value) => {
      setData(prev => ({
        ...prev,
        cells: { ...prev.cells, [cellId]: value }
      }));

      // Update the ref immediately to prevent stale data
      dataRef.current = {
        ...dataRef.current,
        cells: { ...dataRef.current.cells, [cellId]: value }
      };

      socket.emit('cell_update', { cell_id: cellId, value });
      setEditingCell(null);
      editingCellRef.current = null; // Update ref immediately
    };

      const handleCellEditAndNavigate = (cellId, value) => {
      handleCellEdit(cellId, value);
      // Navigate to cell below after editing (for Enter key)
      setTimeout(() => navigateToCellBelow(cellId), 5);
    };

      const handleCellEditAndNavigateRight = (cellId, value) => {
      // Handle the cell edit first, then navigate right
      handleCellEdit(cellId, value);
      // Navigate to the right after editing (for Tab key)
      setTimeout(() => navigateToCellRight(cellId), 5);
    };

  const ensureGridFocus = () => {
    if (gridRef.current && document.activeElement !== gridRef.current) {
      gridRef.current.focus({ preventScroll: true });
      
      // Double-check focus was set
      setTimeout(() => {
        if (document.activeElement !== gridRef.current) {
          gridRef.current?.focus({ preventScroll: true });
        }
      }, 10);
    }
  };

  // Helper to scroll a cell into view only if out of view
  function scrollCellIntoView(cellId) {
    const cellElem = document.getElementById(`cell-${cellId}`);
    if (cellElem) {
      const rect = cellElem.getBoundingClientRect();
      const container = document.querySelector('.h-screen.overflow-auto');
      if (container) {
        const containerRect = container.getBoundingClientRect();
        if (
          rect.top < containerRect.top ||
          rect.bottom > containerRect.bottom
        ) {
          cellElem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      }
    }
  }

  const navigateToCellBelow = (currentCellId) => {
    const { row, col } = parseCellId(currentCellId);
    if (row < ROWS - 1) {
      const newCellId = getCellId(row + 1, col);
      setSelectedCell(newCellId);
      selectedCellRef.current = newCellId;
      
      // Don't call ensureGridFocus here to prevent scroll issues
    }
  };

  const navigateToCellRight = (currentCellId) => {
    const { row, col } = parseCellId(currentCellId);
    if (col < COLUMNS - 1) {
      const newCellId = getCellId(row, col + 1);
      setSelectedCell(newCellId);
      selectedCellRef.current = newCellId;
      
      // Don't call ensureGridFocus here to prevent scroll issues
    }
  };

  const handleKeyDown = (e) => {
    const currentSelectedCell = selectedCellRef.current;
    const currentEditingCell = editingCellRef.current;
    
    if (!currentSelectedCell) {
      return;
    }
    
    // Check if grid is focused
    if (document.activeElement !== gridRef.current) {
      return;
    }
    
    // Don't handle navigation if we're in edit mode
    if (currentEditingCell) {
      return;
    }

    // Copy (Ctrl+C/Cmd+C)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      const rangeToUse = selectedRangeRef.current;
      if (rangeToUse) {
        // Multi-cell copy: build tab/newline string
        const rangeData = getCellRange(rangeToUse.start, rangeToUse.end);
        const clipboardData = rangeData.map(row => row.map(cellId => dataRef.current.cells[cellId]?.value || ''));
        setClipboard({ data: clipboardData, type: 'copy' });
        // Convert to tab/newline string
        const clipboardString = clipboardData.map(row => row.join('\t')).join('\n');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(clipboardString).catch(err => {
            console.warn('Could not write range to system clipboard:', err);
          });
        }

      } else {
        // Single cell copy
        const value = dataRef.current.cells[currentSelectedCell]?.value || '';
        setClipboard(String(value));
        if (navigator.clipboard) {
          navigator.clipboard.writeText(value).catch(err => {
            console.warn('Could not write to system clipboard:', err);
          });
        }
        
      }
      return;
    }

    // Single cell paste: focus hidden input to receive paste
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
      if (pasteInputRef.current) {
        pasteInputRef.current.value = '';
        pasteInputRef.current.focus();
      }
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
          break;
        case 'ArrowDown':
          e.preventDefault();
          newRowIndex = Math.min(ROWS - 1, rowIndex + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newColIndex = Math.max(0, colIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newColIndex = Math.min(COLUMNS - 1, colIndex + 1);
          break;
              case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            newColIndex = Math.max(0, colIndex - 1);
          } else {
            newColIndex = Math.min(COLUMNS - 1, colIndex + 1);
          }
          break;
              case 'Enter':
          e.preventDefault();
          if (e.shiftKey) {
            newRowIndex = Math.max(0, rowIndex - 1);
          } else {
            // Enter edit mode instead of moving down
            handleCellDoubleClick(currentSelectedCell);
            return;
          }
          break;
      case 'Backspace':
        e.preventDefault();
        const rangeToUse = selectedRangeRef.current;

        if (rangeToUse) {
          // Clear all cells in the selected range
          const rangeData = getCellRange(rangeToUse.start, rangeToUse.end);
          
          const updates = {};
          rangeData.flat().forEach(cellId => {
            updates[cellId] = {
              value: '',
              last_modified_by: user.id,
              last_modified_at: new Date().toISOString()
            };
            
          });
          setData(prev => ({
            ...prev,
            cells: { ...prev.cells, ...updates }
          }));
          // Emit updates to server
          Object.entries(updates).forEach(([cellId, cellObj]) => {
            socket.emit('cell_update', { cell_id: cellId, value: '' });
          });
          
        } else {
          // Single cell clear (already working)
          
          handleCellEdit(currentSelectedCell, '');
        }
        return;
              default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            handleCellDoubleClick(currentSelectedCell);
          }
          return;
    }

    const newCellId = getCellId(newRowIndex, newColIndex);
          // Handle selection with Shift key
      if (e.shiftKey) {
      setSelectedRange({
        start: selectionStartRef.current,
        end: newCellId
      });
    } else {
      setSelectedRange(null); // Only clear here
      selectionStartRef.current = newCellId; // Update selection start
    }
    
    setSelectedCell(newCellId);
    selectedCellRef.current = newCellId; // Update ref immediately
    socket.emit('cell_selection', { cell_id: newCellId });

    
  };

      // Paste handler for the hidden input
    const handlePasteInput = (e) => {
      const pastedText = e.clipboardData.getData('text');
      if (selectedCell && typeof pastedText === 'string') {
        // Multi-cell paste: parse tab/newline string
        if (pastedText.includes('\t') || pastedText.includes('\n')) {
        const rows = pastedText.split(/\r?\n/);
        const values2D = rows.map(row => row.split('\t'));
        const start = parseCellId(selectedCell);
        const updates = {};
        for (let r = 0; r < values2D.length; r++) {
          for (let c = 0; c < values2D[r].length; c++) {
            const value = values2D[r][c];
                          const targetRow = start.row + r;
              const targetCol = start.col + c;
              if (targetRow < ROWS && targetCol < COLUMNS) {
              const cellId = getCellId(targetRow, targetCol);
              updates[cellId] = {
                value: value,
                last_modified_by: user.id,
                last_modified_at: new Date().toISOString()
              };
            }
          }
        }
        setData(prev => ({
          ...prev,
          cells: { ...prev.cells, ...updates }
        }));
        Object.entries(updates).forEach(([cellId, cellObj]) => {
          socket.emit('cell_update', { cell_id: cellId, value: cellObj.value });
        });
                } else {
        // Single cell paste
        setData(prev => ({
          ...prev,
          cells: {
            ...prev.cells,
            [selectedCell]: {
              value: pastedText,
              last_modified_by: user.id,
              last_modified_at: new Date().toISOString()
            }
          }
        }));
                  socket.emit('cell_update', { cell_id: selectedCell, value: pastedText });
      }
    }
    // Do not focus grid here - let navigation handle focus management
  };

  useEffect(() => {
          const handleGlobalKeyDown = (e) => {
        if (editingCellRef.current) {
          return;
        }
      
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
    // Scroll to top to ensure first row is visible (only on mount)
    window.scrollTo(0, 0);
    const container = document.querySelector('.h-screen.overflow-auto');
    if (container) {
      container.scrollTop = 0;
    }
  }, []);

  // Global mouse up handler to end selection
  useEffect(() => {
          const handleGlobalMouseUp = () => {
        if (isSelectingRef.current) {
          isSelectingRef.current = false;
        }
      };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Update ref whenever selectedCell changes
  useEffect(() => {
    selectedCellRef.current = selectedCell;
  }, [selectedCell]);

  // Update ref whenever editingCell changes
  useEffect(() => {
    editingCellRef.current = editingCell;
  }, [editingCell]);

  useEffect(() => {
    selectedRangeRef.current = selectedRange;
  }, [selectedRange]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

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

  // Row/Column operation functions
  const insertRowAt = (rowIndex, position = 'after') => {
    const insertIndex = position === 'before' ? rowIndex : rowIndex + 1;
    
    // Create new cell data structure by shifting existing cells
    const newCells = {};
    
    // Copy existing cells, shifting row numbers for cells after the insert point
    Object.entries(data.cells).forEach(([cellId, cellData]) => {
      const cellPos = parseCellId(cellId);
      if (cellPos.row >= insertIndex) {
        // Shift this cell down by one row
        const newCellId = getCellId(cellPos.row + 1, cellPos.col);
        newCells[newCellId] = cellData;
      } else {
        // Keep this cell in the same position
        newCells[cellId] = cellData;
      }
    });
    
    // Update data
    setData(prev => ({
      ...prev,
      cells: newCells
    }));
    
    // Emit to server
    socket.emit('row_operation', {
      type: 'insert',
      index: insertIndex,
      user_id: user.id
    });
  };

  const deleteRowAt = (rowIndex) => {
    
    // Create new cell data structure by removing cells in the row and shifting others
    const newCells = {};
    
    Object.entries(data.cells).forEach(([cellId, cellData]) => {
      const cellPos = parseCellId(cellId);
      if (cellPos.row === rowIndex) {
        // Delete this cell (don't add to newCells)
        return;
      } else if (cellPos.row > rowIndex) {
        // Shift this cell up by one row
        const newCellId = getCellId(cellPos.row - 1, cellPos.col);
        newCells[newCellId] = cellData;
      } else {
        // Keep this cell in the same position
        newCells[cellId] = cellData;
      }
    });
    
    // Update data
    setData(prev => ({
      ...prev,
      cells: newCells
    }));
    
    // Emit to server
    socket.emit('row_operation', {
      type: 'delete',
      index: rowIndex,
      user_id: user.id
    });
  };

  const insertColumnAt = (colIndex, position = 'after') => {
    const insertIndex = position === 'before' ? colIndex : colIndex + 1;
    
    // Create new cell data structure by shifting existing cells
    const newCells = {};
    
    Object.entries(data.cells).forEach(([cellId, cellData]) => {
      const cellPos = parseCellId(cellId);
      if (cellPos.col >= insertIndex) {
        // Shift this cell right by one column
        const newCellId = getCellId(cellPos.row, cellPos.col + 1);
        newCells[newCellId] = cellData;
      } else {
        // Keep this cell in the same position
        newCells[cellId] = cellData;
      }
    });
    
    // Update data
    setData(prev => ({
      ...prev,
      cells: newCells
    }));
    
    // Emit to server
    socket.emit('column_operation', {
      type: 'insert',
      index: insertIndex,
      user_id: user.id
    });
  };

  const deleteColumnAt = (colIndex) => {
    
    // Create new cell data structure by removing cells in the column and shifting others
    const newCells = {};
    
    Object.entries(data.cells).forEach(([cellId, cellData]) => {
      const cellPos = parseCellId(cellId);
      if (cellPos.col === colIndex) {
        // Delete this cell (don't add to newCells)
        return;
      } else if (cellPos.col > colIndex) {
        // Shift this cell left by one column
        const newCellId = getCellId(cellPos.row, cellPos.col - 1);
        newCells[newCellId] = cellData;
      } else {
        // Keep this cell in the same position
        newCells[cellId] = cellData;
      }
    });
    
    // Update data
    setData(prev => ({
      ...prev,
      cells: newCells
    }));
    
    // Emit to server
    socket.emit('column_operation', {
      type: 'delete',
      index: colIndex,
      user_id: user.id
    });
  };

  // Context menu handlers
  const handleRowRightClick = (e, rowIndex) => {
    e.preventDefault();
    setContextMenu({
      isVisible: true,
      position: { x: e.clientX, y: e.clientY },
      type: 'row',
      index: rowIndex
    });
  };

  const handleColumnRightClick = (e, colIndex) => {
    e.preventDefault();
    setContextMenu({
      isVisible: true,
      position: { x: e.clientX, y: e.clientY },
      type: 'column',
      index: colIndex
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ isVisible: false, position: { x: 0, y: 0 }, type: null, index: null });
  };

  return (
    <div className="h-screen overflow-auto bg-white" style={{ scrollBehavior: 'smooth' }}>
      <div className="sticky top-0 bg-white z-10">
        <div className="flex border-b-2 border-gray-400 select-none">
          <div className="w-12 sm:w-16 bg-gray-100 border-r border-gray-300 flex-shrink-0 select-none"></div>
          {Array.from({ length: COLUMNS }, (_, colIndex) => {
            // Highlight column header if any cell in this column is in the selected range, or if focused
            let colIsHighlighted = false;
            if (selectedRange) {
              for (let rowIndex = 0; rowIndex < ROWS; rowIndex++) {
                const cellId = getCellId(rowIndex, colIndex);
                if (isCellInRange(cellId, selectedRange)) {
                  colIsHighlighted = true;
                  break;
                }
              }
            } else if (selectedCell) {
              const selectedCol = selectedCell.match(/([A-Z]+)\d+/)[1];
              if (getColumnLabel(colIndex) === selectedCol) {
                colIsHighlighted = true;
              }
            }
            return (
              <div
                key={colIndex}
                className={`w-16 sm:w-20 lg:w-24 h-8 flex items-center justify-center border-r border-gray-300 text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0 select-none cursor-pointer hover:bg-gray-200
                  ${colIsHighlighted ? 'bg-blue-100' : 'bg-gray-100'}
                `}
                onContextMenu={(e) => handleColumnRightClick(e, colIndex)}
                title={`Right-click for column options`}
              >
                {getColumnLabel(colIndex)}
              </div>
            );
          })}
        </div>
      </div>

      <div
        ref={gridRef}
        className="grid select-none"
        style={getGridStyle()}
        tabIndex={0}
      >
        {Array.from({ length: ROWS }, (_, rowIndex) => {
          // Highlight row number if any cell in this row is in the selected range, or if focused
          let rowIsHighlighted = false;
          if (selectedRange) {
            for (let colIndex = 0; colIndex < COLUMNS; colIndex++) {
              const cellId = getCellId(rowIndex, colIndex);
              if (isCellInRange(cellId, selectedRange)) {
                rowIsHighlighted = true;
                break;
              }
            }
          } else if (selectedCell) {
            const selectedRow = parseInt(selectedCell.match(/[A-Z]+(\d+)/)[1], 10) - 1;
            if (rowIndex === selectedRow) {
              rowIsHighlighted = true;
            }
          }
          return (
            <React.Fragment key={rowIndex}>
              <div
                className={`w-12 sm:w-16 h-8 flex items-center justify-center sticky left-0 flex-shrink-0 border-r border-b border-gray-300 text-xs sm:text-sm text-gray-600 z-10 select-none cursor-pointer hover:bg-gray-200
                  ${rowIsHighlighted ? 'bg-blue-100' : 'bg-gray-100'}
                `}
                onContextMenu={(e) => handleRowRightClick(e, rowIndex)}
                title={`Right-click for row options`}
              >
                {rowIndex + 1}
              </div>
              {Array.from({ length: COLUMNS }, (_, colIndex) => {
                const cellId = getCellId(rowIndex, colIndex);
                const cellData = data.cells[cellId];
                const isSelected = selectedCell === cellId;
                const isInRange = selectedRange ? isCellInRange(cellId, selectedRange) : false;
                const isEditing = editingCell === cellId;
                const userSelection = userSelections[cellId];

                return (
                  <Cell
                    key={cellId}
                    cellId={cellId}
                    value={cellData?.value || ''}
                    isSelected={isSelected}
                    isInRange={isInRange}
                    isEditing={isEditing}
                    userSelection={userSelection}
                    onClick={(event) => handleCellClick(cellId, event)}
                    onMouseDown={(event) => handleCellMouseDown(cellId, event)}
                    onMouseEnter={(event) => handleCellMouseEnter(cellId, event)}
                    onMouseUp={handleCellMouseUp}
                    onDoubleClick={() => handleCellDoubleClick(cellId)}
                    onEdit={(value) => handleCellEditAndNavigate(cellId, value)}
                    onTabEdit={(value) => handleCellEditAndNavigateRight(cellId, value)}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </div>

      <input ref={pasteInputRef} type="text" style={{ position: 'absolute', left: '-9999px', width: 0, height: 0, opacity: 0 }} onPaste={handlePasteInput} tabIndex={-1} aria-hidden="true" />
      
      <ContextMenu
        isVisible={contextMenu.isVisible}
        position={contextMenu.position}
        type={contextMenu.type}
        index={contextMenu.index}
        onClose={closeContextMenu}
        onInsertBefore={(index) => {
          if (contextMenu.type === 'row') {
            insertRowAt(index, 'before');
          } else {
            insertColumnAt(index, 'before');
          }
        }}
        onInsertAfter={(index) => {
          if (contextMenu.type === 'row') {
            insertRowAt(index, 'after');
          } else {
            insertColumnAt(index, 'after');
          }
        }}
        onDelete={(index) => {
          if (contextMenu.type === 'row') {
            deleteRowAt(index);
          } else {
            deleteColumnAt(index);
          }
        }}
      />
    </div>
  );
}

export default Spreadsheet; 