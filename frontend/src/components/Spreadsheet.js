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
    if (!cellId) return;
    setSelectedCell(cellId);
    socket.emit('cell_selection', { cell_id: cellId });
  };

  const handleCellDoubleClick = (cellId) => {
    const cellData = data.cells[cellId];
    setEditingCell(cellId);
    setEditValue(cellData?.value || '');
  };

  const handleCellEdit = (cellId, value) => {
    console.log(`Saving cell data: ${cellId} = "${value}"`);
    
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

    console.log(`Sending cell_update event to server: ${cellId} = "${value}"`);
    socket.emit('cell_update', { cell_id: cellId, value });
    setEditingCell(null);
    setEditValue('');
  };

  const handleTabNavigation = (currentCellId, direction = 'next') => {
    console.log(`Tab navigation: ${direction} from cell ${currentCellId}`);
    
    // Save current cell data if editing
    if (editingCell === currentCellId) {
      console.log(`Saving current cell data: ${currentCellId} = "${editValue}"`);
      handleCellEdit(currentCellId, editValue);
    }
    
    const [col, row] = currentCellId.match(/([A-Z]+)(\d+)/).slice(1);
    const colIndex = col.charCodeAt(0) - 65;
    const rowIndex = parseInt(row) - 1;

    let newColIndex = colIndex;
    let newRowIndex = rowIndex;

    if (direction === 'next') {
      newColIndex = Math.min(COLUMNS - 1, colIndex + 1);
    } else {
      newColIndex = Math.max(0, colIndex - 1);
    }

    const newCellId = getCellId(newRowIndex, newColIndex);
    console.log(`Moving to cell: ${newCellId}`);
    
    setSelectedCell(newCellId);
    setEditingCell(newCellId);
    const cellData = data.cells[newCellId];
    setEditValue(cellData?.value || '');
    socket.emit('cell_selection', { cell_id: newCellId });
  };

  const handleKeyDown = (e) => {
    const [col, row] = selectedCell.match(/([A-Z]+)(\d+)/).slice(1);
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
      case 'Tab':
        e.preventDefault();
        newColIndex = Math.min(COLUMNS - 1, colIndex + 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (e.shiftKey) {
          newRowIndex = Math.max(0, rowIndex - 1);
        } else {
          newRowIndex = Math.min(ROWS - 1, rowIndex + 1);
        }
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          handleCellDoubleClick(selectedCell);
        }
        return;
    }

    const newCellId = getCellId(newRowIndex, newColIndex);
    setSelectedCell(newCellId);
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
  }, [selectedCell]);

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
    <div className="h-screen overflow-auto">
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
                  onEdit={(value) => handleCellEdit(cellId, value)}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  onTabNavigation={(direction) => handleTabNavigation(cellId, direction)}
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