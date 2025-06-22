import React, { useState, useEffect, useRef } from 'react';
import Cell from './Cell';

const COLUMNS = 26;
const ROWS = 100;

function Spreadsheet({ socket, user, data, setData }) {
  const [selectedCell, setSelectedCell] = useState('A1');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [userSelections, setUserSelections] = useState({});
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
      if (user_id !== user.id) {
        setUserSelections(prev => ({
          ...prev,
          [cell_id]: { user_id, user_name, user_color }
        }));
      }
    });

    socket.on('user_left', (data) => {
      setUserSelections(prev => {
        const newSelections = { ...prev };
        Object.keys(newSelections).forEach(cellId => {
          if (newSelections[cellId].user_id === data.user_id) {
            delete newSelections[cellId];
          }
        });
        return newSelections;
      });
    });

    return () => {
      socket.off('cell_updated');
      socket.off('cell_selected');
      socket.off('user_left');
    };
  }, [socket, user.id, setData]);

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

    socket.emit('cell_update', { cell_id: cellId, value });
    setEditingCell(null);
    setEditValue('');
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

  return (
    <div className="h-screen overflow-auto">
      <div className="sticky top-0 bg-white z-10">
        <div className="flex border-b border-gray-300">
          <div className="w-16 bg-gray-100 border-r border-gray-300"></div>
          {Array.from({ length: COLUMNS }, (_, i) => (
            <div
              key={i}
              className="w-24 h-8 flex items-center justify-center bg-gray-100 border-r border-gray-300 text-sm font-medium text-gray-700"
            >
              {getColumnLabel(i)}
            </div>
          ))}
        </div>
      </div>

      <div
        ref={gridRef}
        className="grid"
        style={{
          gridTemplateColumns: `64px repeat(${COLUMNS}, 96px)`,
          gridTemplateRows: `repeat(${ROWS}, 32px)`
        }}
        tabIndex={0}
      >
        {Array.from({ length: ROWS }, (_, rowIndex) => (
          <React.Fragment key={rowIndex}>
            <div className="w-16 h-8 flex items-center justify-center bg-gray-100 border-r border-gray-300 text-sm text-gray-600 sticky left-0">
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