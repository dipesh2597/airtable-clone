/**
 * Formula testing utilities and tests for the Airtable Clone frontend
 * Tests formula parsing, evaluation, and error handling
 */

// Formula testing utilities
export const createFormulaTestData = () => ({
  cells: {
    A1: { value: '1', data_type: 'number' },
    A2: { value: '2', data_type: 'number' },
    A3: { value: '3', data_type: 'number' },
    A4: { value: '4', data_type: 'number' },
    A5: { value: '5', data_type: 'number' },
    A6: { value: '6', data_type: 'number' },
    A7: { value: '7', data_type: 'number' },
    A8: { value: '8', data_type: 'number' },
    A9: { value: '9', data_type: 'number' },
    A10: { value: '10', data_type: 'number' },
    B1: { value: 'Apple', data_type: 'text' },
    B2: { value: 'Banana', data_type: 'text' },
    B3: { value: 'Orange', data_type: 'text' },
    B4: { value: 'Grape', data_type: 'text' },
    B5: { value: 'Kiwi', data_type: 'text' },
    C1: { value: '2024-01-01', data_type: 'date' },
    C2: { value: '2024-01-02', data_type: 'date' },
    C3: { value: '2024-01-03', data_type: 'date' },
    C4: { value: '2024-01-04', data_type: 'date' },
    C5: { value: '2024-01-05', data_type: 'date' }
  }
});

// Mock formula parser functions
export const mockFormulaParser = {
  isFormula: (value) => {
    return typeof value === 'string' && value.startsWith('=');
  },
  
  parseCellRef: (ref) => {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    
    const col = match[1];
    const row = parseInt(match[2]);
    
    // Convert column letter to number (A=0, B=1, etc.)
    let colNum = 0;
    for (let i = 0; i < col.length; i++) {
      colNum = colNum * 26 + (col.charCodeAt(i) - 64);
    }
    
    return { col: colNum - 1, row: row - 1 };
  },
  
  parseCellRange: (range) => {
    const parts = range.split(':');
    if (parts.length !== 2) return null;
    
    const start = mockFormulaParser.parseCellRef(parts[0]);
    const end = mockFormulaParser.parseCellRef(parts[1]);
    
    if (!start || !end) return null;
    
    return { start, end };
  },
  
  getRangeValues: (range, spreadsheetData) => {
    const rangeObj = mockFormulaParser.parseCellRange(range);
    if (!rangeObj) return [];
    
    const values = [];
    const { start, end } = rangeObj;
    
    for (let row = start.row; row <= end.row; row++) {
      for (let col = start.col; col <= end.col; col++) {
        const cellId = `${String.fromCharCode(65 + col)}${row + 1}`;
        const cell = spreadsheetData.cells[cellId];
        if (cell && cell.data_type === 'number') {
          values.push(parseFloat(cell.value));
        }
      }
    }
    
    return values;
  },
  
  evaluateFormula: (formula, spreadsheetData) => {
    if (!mockFormulaParser.isFormula(formula)) {
      return null;
    }
    
    const func = formula.substring(1).split('(')[0].toUpperCase();
    const args = formula.substring(formula.indexOf('(') + 1, formula.lastIndexOf(')'));
    
    switch (func) {
      case 'SUM':
        const sumValues = mockFormulaParser.getRangeValues(args, spreadsheetData);
        return sumValues.reduce((sum, val) => sum + val, 0);
        
      case 'AVERAGE':
        const avgValues = mockFormulaParser.getRangeValues(args, spreadsheetData);
        if (avgValues.length === 0) return 0;
        return avgValues.reduce((sum, val) => sum + val, 0) / avgValues.length;
        
      case 'COUNT':
        const countValues = mockFormulaParser.getRangeValues(args, spreadsheetData);
        return countValues.length;
        
      case 'MAX':
        const maxValues = mockFormulaParser.getRangeValues(args, spreadsheetData);
        return maxValues.length > 0 ? Math.max(...maxValues) : 0;
        
      case 'MIN':
        const minValues = mockFormulaParser.getRangeValues(args, spreadsheetData);
        return minValues.length > 0 ? Math.min(...minValues) : 0;
        
      default:
        return null;
    }
  },
  
  getFormulaError: (formula, spreadsheetData) => {
    if (!mockFormulaParser.isFormula(formula)) {
      return null;
    }
    
    const func = formula.substring(1).split('(')[0].toUpperCase();
    const args = formula.substring(formula.indexOf('(') + 1, formula.lastIndexOf(')'));
    
    // Check for invalid range
    const rangeObj = mockFormulaParser.parseCellRange(args);
    if (!rangeObj) {
      return 'Invalid cell range';
    }
    
    // Check for unsupported functions
    const supportedFunctions = ['SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN'];
    if (!supportedFunctions.includes(func)) {
      return `Unsupported function: ${func}`;
    }
    
    // Check for wrong number of arguments
    if (func === 'SUM' || func === 'AVERAGE' || func === 'COUNT' || func === 'MAX' || func === 'MIN') {
      if (!args.includes(':')) {
        return `${func} requires a cell range (e.g., A1:A10)`;
      }
    }
    
    return null;
  }
};

// Test cases for formulas
export const formulaTestCases = [
  {
    name: 'SUM formula with numbers 1-10',
    formula: '=SUM(A1:A10)',
    expectedResult: 55,
    description: 'Should sum all numbers from A1 to A10'
  },
  {
    name: 'AVERAGE formula with numbers 1-10',
    formula: '=AVERAGE(A1:A10)',
    expectedResult: 5.5,
    description: 'Should calculate average of numbers from A1 to A10'
  },
  {
    name: 'COUNT formula with mixed data',
    formula: '=COUNT(A1:A10)',
    expectedResult: 10,
    description: 'Should count all numeric values from A1 to A10'
  },
  {
    name: 'MAX formula with numbers 1-10',
    formula: '=MAX(A1:A10)',
    expectedResult: 10,
    description: 'Should find maximum value from A1 to A10'
  },
  {
    name: 'MIN formula with numbers 1-10',
    formula: '=MIN(A1:A10)',
    expectedResult: 1,
    description: 'Should find minimum value from A1 to A10'
  },
  {
    name: 'SUM formula with partial range',
    formula: '=SUM(A1:A5)',
    expectedResult: 15,
    description: 'Should sum numbers from A1 to A5 only'
  },
  {
    name: 'AVERAGE formula with partial range',
    formula: '=AVERAGE(A1:A5)',
    expectedResult: 3,
    description: 'Should calculate average of numbers from A1 to A5'
  }
];

// Error test cases
export const errorTestCases = [
  {
    name: 'Invalid cell range',
    formula: '=SUM(Z1:Z10)',
    expectedError: 'Invalid cell range',
    description: 'Should return error for out-of-bounds range'
  },
  {
    name: 'Unsupported function',
    formula: '=INVALID(A1:A10)',
    expectedError: 'Unsupported function: INVALID',
    description: 'Should return error for unsupported function'
  },
  {
    name: 'Missing equals sign',
    formula: 'SUM(A1:A10)',
    expectedError: null,
    description: 'Should not be recognized as formula'
  },
  {
    name: 'Invalid syntax',
    formula: '=SUM(A1:A10',
    expectedError: 'Invalid cell range',
    description: 'Should return error for malformed formula'
  },
  {
    name: 'Empty range',
    formula: '=SUM(A1:A1)',
    expectedResult: 1,
    description: 'Should handle single cell range'
  }
];

// Test runner
export const runFormulaTests = () => {
  const testData = createFormulaTestData();
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  console.log('🧪 Running Formula Tests...\n');
  
  // Test valid formulas
  formulaTestCases.forEach(testCase => {
    try {
      const result = mockFormulaParser.evaluateFormula(testCase.formula, testData);
      const error = mockFormulaParser.getFormulaError(testCase.formula, testData);
      
      if (error) {
        console.log(`❌ ${testCase.name}: ${error}`);
        results.failed++;
        results.errors.push(`${testCase.name}: ${error}`);
      } else if (result === testCase.expectedResult) {
        console.log(`✅ ${testCase.name}: ${result}`);
        results.passed++;
      } else {
        console.log(`❌ ${testCase.name}: Expected ${testCase.expectedResult}, got ${result}`);
        results.failed++;
        results.errors.push(`${testCase.name}: Expected ${testCase.expectedResult}, got ${result}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}: Exception - ${error.message}`);
      results.failed++;
      results.errors.push(`${testCase.name}: Exception - ${error.message}`);
    }
  });
  
  // Test error cases
  errorTestCases.forEach(testCase => {
    try {
      const error = mockFormulaParser.getFormulaError(testCase.formula, testData);
      const result = mockFormulaParser.evaluateFormula(testCase.formula, testData);
      
      if (testCase.expectedError) {
        if (error === testCase.expectedError) {
          console.log(`✅ ${testCase.name}: ${error}`);
          results.passed++;
        } else {
          console.log(`❌ ${testCase.name}: Expected "${testCase.expectedError}", got "${error}"`);
          results.failed++;
          results.errors.push(`${testCase.name}: Expected "${testCase.expectedError}", got "${error}"`);
        }
      } else if (testCase.expectedResult !== undefined) {
        if (result === testCase.expectedResult) {
          console.log(`✅ ${testCase.name}: ${result}`);
          results.passed++;
        } else {
          console.log(`❌ ${testCase.name}: Expected ${testCase.expectedResult}, got ${result}`);
          results.failed++;
          results.errors.push(`${testCase.name}: Expected ${testCase.expectedResult}, got ${result}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}: Exception - ${error.message}`);
      results.failed++;
      results.errors.push(`${testCase.name}: Exception - ${error.message}`);
    }
  });
  
  console.log(`\n📊 Test Results: ${results.passed} passed, ${results.failed} failed`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  return results;
};

// Cell reference tests
export const runCellReferenceTests = () => {
  const cellRefTests = [
    { ref: 'A1', expected: { col: 0, row: 0 } },
    { ref: 'B5', expected: { col: 1, row: 4 } },
    { ref: 'Z100', expected: { col: 25, row: 99 } },
    { ref: 'AA1', expected: { col: 26, row: 0 } },
    { ref: 'AB10', expected: { col: 27, row: 9 } }
  ];
  
  const invalidRefs = ['1A', 'A', '1', '', 'A0', 'A-1'];
  
  console.log('🧪 Running Cell Reference Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test valid references
  cellRefTests.forEach(test => {
    const result = mockFormulaParser.parseCellRef(test.ref);
    if (result && result.col === test.expected.col && result.row === test.expected.row) {
      console.log(`✅ ${test.ref}: col=${result.col}, row=${result.row}`);
      passed++;
    } else {
      console.log(`❌ ${test.ref}: Expected col=${test.expected.col}, row=${test.expected.row}, got ${result}`);
      failed++;
    }
  });
  
  // Test invalid references
  invalidRefs.forEach(ref => {
    const result = mockFormulaParser.parseCellRef(ref);
    if (result === null) {
      console.log(`✅ Invalid ref "${ref}": correctly rejected`);
      passed++;
    } else {
      console.log(`❌ Invalid ref "${ref}": should be rejected, got ${result}`);
      failed++;
    }
  });
  
  console.log(`\n📊 Cell Reference Tests: ${passed} passed, ${failed} failed`);
  return { passed, failed };
};

// Range parsing tests
export const runRangeTests = () => {
  const rangeTests = [
    { range: 'A1:B10', expected: { start: { col: 0, row: 0 }, end: { col: 1, row: 9 } } },
    { range: 'B5:D8', expected: { start: { col: 1, row: 4 }, end: { col: 3, row: 7 } } },
    { range: 'Z1:AA10', expected: { start: { col: 25, row: 0 }, end: { col: 26, row: 9 } } }
  ];
  
  const invalidRanges = ['A1', 'A1:B', 'A:B10', 'A1:B10:C5'];
  
  console.log('🧪 Running Range Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test valid ranges
  rangeTests.forEach(test => {
    const result = mockFormulaParser.parseCellRange(test.range);
    if (result && 
        result.start.col === test.expected.start.col && 
        result.start.row === test.expected.start.row &&
        result.end.col === test.expected.end.col && 
        result.end.row === test.expected.end.row) {
      console.log(`✅ ${test.range}: start=${test.expected.start.col},${test.expected.start.row}, end=${test.expected.end.col},${test.expected.end.row}`);
      passed++;
    } else {
      console.log(`❌ ${test.range}: Expected ${JSON.stringify(test.expected)}, got ${JSON.stringify(result)}`);
      failed++;
    }
  });
  
  // Test invalid ranges
  invalidRanges.forEach(range => {
    const result = mockFormulaParser.parseCellRange(range);
    if (result === null) {
      console.log(`✅ Invalid range "${range}": correctly rejected`);
      passed++;
    } else {
      console.log(`❌ Invalid range "${range}": should be rejected, got ${JSON.stringify(result)}`);
      failed++;
    }
  });
  
  console.log(`\n📊 Range Tests: ${passed} passed, ${failed} failed`);
  return { passed, failed };
};

// Export test runner
export const runAllFormulaTests = () => {
  console.log('🚀 Starting Comprehensive Formula Test Suite\n');
  
  const formulaResults = runFormulaTests();
  console.log('\n' + '='.repeat(50) + '\n');
  
  const cellRefResults = runCellReferenceTests();
  console.log('\n' + '='.repeat(50) + '\n');
  
  const rangeResults = runRangeTests();
  
  const totalPassed = formulaResults.passed + cellRefResults.passed + rangeResults.passed;
  const totalFailed = formulaResults.failed + cellRefResults.failed + rangeResults.failed;
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎯 TOTAL RESULTS: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('='.repeat(50));
  
  return {
    formula: formulaResults,
    cellRef: cellRefResults,
    range: rangeResults,
    total: { passed: totalPassed, failed: totalFailed }
  };
};

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.runAllFormulaTests = runAllFormulaTests;
  window.mockFormulaParser = mockFormulaParser;
} else {
  // Node.js environment
  module.exports = {
    runAllFormulaTests,
    mockFormulaParser,
    createFormulaTestData,
    formulaTestCases,
    errorTestCases
  };
} 