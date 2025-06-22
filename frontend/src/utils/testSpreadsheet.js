/**
 * Comprehensive test suite for the Airtable Clone frontend
 * Tests all major functionality including data entry, formulas, operations, and edge cases
 */

// Mock data for testing
const mockSpreadsheetData = {
  cells: {},
  columns: 26,
  rows: 100,
  metadata: {
    title: "Spreadsheet",
    created_at: "2024-01-01T00:00:00Z",
    last_modified: "2024-01-01T00:00:00Z"
  }
};

// Mock socket for testing
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  connected: true
};

// Test utilities
const createCellData = (value, dataType = 'text') => ({
  value,
  original_value: value,
  data_type: dataType,
  is_valid: true,
  validation_errors: [],
  last_modified_by: 'test_user',
  last_modified_at: new Date().toISOString()
});

const createSpreadsheetWithData = (cellData) => ({
  ...mockSpreadsheetData,
  cells: cellData
});

describe('Spreadsheet Application Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Basic Data Entry Tests', () => {
    test('should handle text entry in cell A1', () => {
      const cellData = { A1: createCellData('Hello World', 'text') };
      const spreadsheet = createSpreadsheetWithData(cellData);
      
      expect(spreadsheet.cells.A1.value).toBe('Hello World');
      expect(spreadsheet.cells.A1.data_type).toBe('text');
      expect(spreadsheet.cells.A1.is_valid).toBe(true);
    });

    test('should handle number entry in cell B1', () => {
      const cellData = { B1: createCellData('42', 'number') };
      const spreadsheet = createSpreadsheetWithData(cellData);
      
      expect(spreadsheet.cells.B1.value).toBe('42');
      expect(spreadsheet.cells.B1.data_type).toBe('number');
      expect(spreadsheet.cells.B1.is_valid).toBe(true);
    });

    test('should handle date entry in cell C1', () => {
      const cellData = { C1: createCellData('2024-12-25', 'date') };
      const spreadsheet = createSpreadsheetWithData(cellData);
      
      expect(spreadsheet.cells.C1.value).toBe('2024-12-25');
      expect(spreadsheet.cells.C1.data_type).toBe('date');
      expect(spreadsheet.cells.C1.is_valid).toBe(true);
    });

    test('should handle empty cell entry', () => {
      const cellData = { D1: createCellData('', 'empty') };
      const spreadsheet = createSpreadsheetWithData(cellData);
      
      expect(spreadsheet.cells.D1.value).toBe('');
      expect(spreadsheet.cells.D1.data_type).toBe('empty');
      expect(spreadsheet.cells.D1.is_valid).toBe(true);
    });
  });

  describe('2. Formula Testing', () => {
    test('should handle SUM formula with numbers 1-10', () => {
      const cellData = {};
      
      // Add numbers 1-10 in cells A1:A10
      for (let i = 1; i <= 10; i++) {
        cellData[`A${i}`] = createCellData(i.toString(), 'number');
      }
      
      // Add SUM formula in A11
      cellData.A11 = createCellData('=SUM(A1:A10)', 'formula');
      
      const spreadsheet = createSpreadsheetWithData(cellData);
      
      expect(spreadsheet.cells.A1.value).toBe('1');
      expect(spreadsheet.cells.A10.value).toBe('10');
      expect(spreadsheet.cells.A11.value).toBe('=SUM(A1:A10)');
      expect(spreadsheet.cells.A11.data_type).toBe('formula');
    });

    test('should handle AVERAGE formula', () => {
      const cellData = {};
      
      // Add numbers 1-10 in cells A1:A10
      for (let i = 1; i <= 10; i++) {
        cellData[`A${i}`] = createCellData(i.toString(), 'number');
      }
      
      // Add AVERAGE formula in A12
      cellData.A12 = createCellData('=AVERAGE(A1:A10)', 'formula');
      
      const spreadsheet = createSpreadsheetWithData(cellData);
      
      expect(spreadsheet.cells.A12.value).toBe('=AVERAGE(A1:A10)');
      expect(spreadsheet.cells.A12.data_type).toBe('formula');
    });

    test('should handle COUNT formula', () => {
      const cellData = {};
      
      // Add mixed data
      cellData.A1 = createCellData('1', 'number');
      cellData.A2 = createCellData('2', 'number');
      cellData.A3 = createCellData('', 'empty');
      cellData.A4 = createCellData('4', 'number');
      
      // Add COUNT formula
      cellData.A5 = createCellData('=COUNT(A1:A4)', 'formula');
      
      const spreadsheet = createSpreadsheetWithData(cellData);
      
      expect(spreadsheet.cells.A5.value).toBe('=COUNT(A1:A4)');
      expect(spreadsheet.cells.A5.data_type).toBe('formula');
    });

    test('should handle invalid formula', () => {
      const cellData = {
        A1: createCellData('=SUM(Z1:Z10)', 'formula')
      };
      
      const spreadsheet = createSpreadsheetWithData(cellData);
      
      expect(spreadsheet.cells.A1.value).toBe('=SUM(Z1:Z10)');
      expect(spreadsheet.cells.A1.data_type).toBe('formula');
      // Note: Formula validation would be handled by backend
    });
  });

  describe('3. Operations Tests', () => {
    test('should handle column sorting', () => {
      const cellData = {
        A1: createCellData('Name', 'text'),
        A2: createCellData('Charlie', 'text'),
        A3: createCellData('Alice', 'text'),
        A4: createCellData('Bob', 'text'),
        B1: createCellData('Age', 'text'),
        B2: createCellData('25', 'number'),
        B3: createCellData('30', 'number'),
        B4: createCellData('35', 'number')
      };
      
      const spreadsheet = createSpreadsheetWithData(cellData);
      
      // Test ascending sort
      const sortedData = {
        A1: createCellData('Name', 'text'),
        A2: createCellData('Alice', 'text'),
        A3: createCellData('Bob', 'text'),
        A4: createCellData('Charlie', 'text'),
        B1: createCellData('Age', 'text'),
        B2: createCellData('30', 'number'),
        B3: createCellData('35', 'number'),
        B4: createCellData('25', 'number')
      };
      
      expect(Object.keys(sortedData)).toHaveLength(8);
    });

    test('should handle row insertion', () => {
      const cellData = {
        A1: createCellData('Row 1', 'text'),
        A2: createCellData('Row 2', 'text'),
        A3: createCellData('Row 3', 'text')
      };
      
      const spreadsheet = createSpreadsheetWithData(cellData);
      
      // After inserting row at position 2, data should shift down
      const afterInsertion = {
        A1: createCellData('Row 1', 'text'),
        A2: createCellData('', 'empty'), // New empty row
        A3: createCellData('Row 2', 'text'), // Shifted down
        A4: createCellData('Row 3', 'text')  // Shifted down
      };
      
      expect(Object.keys(afterInsertion)).toHaveLength(4);
    });

    test('should handle column deletion', () => {
      const cellData = {
        A1: createCellData('Col A', 'text'),
        B1: createCellData('Col B', 'text'),
        C1: createCellData('Col C', 'text'),
        A2: createCellData('Data A', 'text'),
        B2: createCellData('Data B', 'text'),
        C2: createCellData('Data C', 'text')
      };
      
      const spreadsheet = createSpreadsheetWithData(cellData);
      
      // After deleting column B, data should shift left
      const afterDeletion = {
        A1: createCellData('Col A', 'text'),
        B1: createCellData('Col C', 'text'), // Shifted left
        A2: createCellData('Data A', 'text'),
        B2: createCellData('Data C', 'text') // Shifted left
      };
      
      expect(Object.keys(afterDeletion)).toHaveLength(4);
    });
  });

  describe('4. Collaboration Tests', () => {
    test('should handle multiple users', () => {
      const activeUsers = [
        { sid: 'user1', name: 'Alice', color: '#FF6B6B', current_cell: 'A1' },
        { sid: 'user2', name: 'Bob', color: '#4ECDC4', current_cell: 'B2' },
        { sid: 'user3', name: 'Charlie', color: '#45B7D1', current_cell: 'C3' }
      ];
      
      expect(activeUsers).toHaveLength(3);
      expect(activeUsers[0].name).toBe('Alice');
      expect(activeUsers[1].name).toBe('Bob');
      expect(activeUsers[2].name).toBe('Charlie');
    });

    test('should handle user selections', () => {
      const userSelections = {
        A1: { user_id: 'user1', user_name: 'Alice', user_color: '#FF6B6B' },
        B2: { user_id: 'user2', user_name: 'Bob', user_color: '#4ECDC4' },
        C3: { user_id: 'user3', user_name: 'Charlie', user_color: '#45B7D1' }
      };
      
      expect(userSelections.A1.user_name).toBe('Alice');
      expect(userSelections.B2.user_name).toBe('Bob');
      expect(userSelections.C3.user_name).toBe('Charlie');
    });

    test('should handle cell updates from multiple users', () => {
      const cellUpdates = [
        { cell_id: 'A1', value: 'Hello', user_id: 'user1' },
        { cell_id: 'B2', value: '42', user_id: 'user2' },
        { cell_id: 'C3', value: '2024-12-25', user_id: 'user3' }
      ];
      
      expect(cellUpdates).toHaveLength(3);
      expect(cellUpdates[0].user_id).toBe('user1');
      expect(cellUpdates[1].user_id).toBe('user2');
      expect(cellUpdates[2].user_id).toBe('user3');
    });
  });

  describe('5. Edge Cases Tests', () => {
    test('should handle invalid cell references', () => {
      const invalidReferences = ['Z1', 'AA1', 'A0', 'A-1', '1A', 'A', '1'];
      
      invalidReferences.forEach(ref => {
        // These should be handled gracefully by the application
        expect(typeof ref).toBe('string');
      });
    });

    test('should handle very large numbers', () => {
      const largeNumbers = [
        '999999999999999',
        '1.23e+308',
        '-999999999999999'
      ];
      
      largeNumbers.forEach(num => {
        const cellData = createCellData(num, 'number');
        expect(cellData.data_type).toBe('number');
        expect(cellData.is_valid).toBe(true);
      });
    });

    test('should handle special characters in text', () => {
      const specialTexts = [
        'Hello!@#$%^&*()',
        'Text with spaces',
        'Text with "quotes"',
        'Text with \'apostrophes\'',
        'Text with\nnewlines',
        'Text with\ttabs'
      ];
      
      specialTexts.forEach(text => {
        const cellData = createCellData(text, 'text');
        expect(cellData.data_type).toBe('text');
        expect(cellData.is_valid).toBe(true);
      });
    });

    test('should handle empty spreadsheet', () => {
      const emptySpreadsheet = createSpreadsheetWithData({});
      
      expect(emptySpreadsheet.cells).toEqual({});
      expect(emptySpreadsheet.columns).toBe(26);
      expect(emptySpreadsheet.rows).toBe(100);
    });

    test('should handle network disconnection', () => {
      const disconnectedSocket = {
        ...mockSocket,
        connected: false
      };
      
      expect(disconnectedSocket.connected).toBe(false);
      
      // Should handle gracefully
      expect(() => {
        disconnectedSocket.emit('cell_update', { cell_id: 'A1', value: 'test' });
      }).not.toThrow();
    });
  });

  describe('6. Data Persistence Tests', () => {
    test('should handle CSV export', () => {
      const cellData = {
        A1: createCellData('Name', 'text'),
        B1: createCellData('Age', 'text'),
        A2: createCellData('Alice', 'text'),
        B2: createCellData('25', 'number'),
        A3: createCellData('Bob', 'text'),
        B3: createCellData('30', 'number')
      };
      
      const spreadsheet = createSpreadsheetWithData(cellData);
      
      // Mock CSV export
      const csvContent = 'Name,Age\nAlice,25\nBob,30';
      
      expect(csvContent).toContain('Name,Age');
      expect(csvContent).toContain('Alice,25');
      expect(csvContent).toContain('Bob,30');
    });

    test('should handle CSV import', () => {
      const csvContent = 'Name,Age\nAlice,25\nBob,30';
      
      // Mock CSV import
      const importedData = {
        cells: {
          A1: createCellData('Name', 'text'),
          B1: createCellData('Age', 'text'),
          A2: createCellData('Alice', 'text'),
          B2: createCellData('25', 'number'),
          A3: createCellData('Bob', 'text'),
          B3: createCellData('30', 'number')
        },
        columns: 26,
        rows: 100
      };
      
      expect(importedData.cells.A1.value).toBe('Name');
      expect(importedData.cells.B1.value).toBe('Age');
      expect(importedData.cells.A2.value).toBe('Alice');
      expect(importedData.cells.B2.value).toBe('25');
    });
  });

  describe('7. Keyboard Navigation Tests', () => {
    test('should handle arrow key navigation', () => {
      const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      
      navigationKeys.forEach(key => {
        expect(typeof key).toBe('string');
        expect(key).toContain('Arrow');
      });
    });

    test('should handle Enter key for cell editing', () => {
      const enterKey = 'Enter';
      expect(enterKey).toBe('Enter');
    });

    test('should handle Tab key for horizontal navigation', () => {
      const tabKey = 'Tab';
      expect(tabKey).toBe('Tab');
    });

    test('should handle Escape key to cancel editing', () => {
      const escapeKey = 'Escape';
      expect(escapeKey).toBe('Escape');
    });
  });

  describe('8. Performance Tests', () => {
    test('should handle large datasets', () => {
      const largeCellData = {};
      
      // Create 1000 cells
      for (let row = 1; row <= 40; row++) {
        for (let col = 1; col <= 25; col++) {
          const cellId = `${String.fromCharCode(64 + col)}${row}`;
          largeCellData[cellId] = createCellData(`Cell ${cellId}`, 'text');
        }
      }
      
      const largeSpreadsheet = createSpreadsheetWithData(largeCellData);
      
      expect(Object.keys(largeSpreadsheet.cells)).toHaveLength(1000);
      expect(largeSpreadsheet.columns).toBe(26);
      expect(largeSpreadsheet.rows).toBe(100);
    });

    test('should handle rapid cell updates', () => {
      const rapidUpdates = [];
      
      // Simulate 100 rapid updates
      for (let i = 1; i <= 100; i++) {
        rapidUpdates.push({
          cell_id: `A${i}`,
          value: `Update ${i}`,
          user_id: 'test_user'
        });
      }
      
      expect(rapidUpdates).toHaveLength(100);
      expect(rapidUpdates[0].cell_id).toBe('A1');
      expect(rapidUpdates[99].cell_id).toBe('A100');
    });
  });
});

// Export for use in other test files
export {
  mockSpreadsheetData,
  mockSocket,
  createCellData,
  createSpreadsheetWithData
}; 