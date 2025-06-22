// Formula parsing and evaluation utilities

// Parse cell reference like "A1" to {col: 0, row: 0}
export const parseCellRef = (cellRef) => {
  const match = cellRef.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  
  const colStr = match[1];
  const rowStr = match[2];
  
  // Convert column letters to number (A=0, B=1, etc.)
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 65 + 1);
  }
  col -= 1; // Convert to 0-based index
  
  const row = parseInt(rowStr) - 1; // Convert to 0-based index
  
  return { col, row };
};

// Parse cell range like "A1:B10" to {start: {col, row}, end: {col, row}}
export const parseCellRange = (rangeStr) => {
  const parts = rangeStr.split(':');
  if (parts.length !== 2) return null;
  
  const start = parseCellRef(parts[0]);
  const end = parseCellRef(parts[1]);
  
  if (!start || !end) return null;
  
  return { start, end };
};

// Get cell ID from row and column indices
export const getCellId = (row, col) => {
  // Convert column number to letters
  let colStr = '';
  let colNum = col + 1; // Convert to 1-based
  
  while (colNum > 0) {
    colNum -= 1;
    colStr = String.fromCharCode(65 + (colNum % 26)) + colStr;
    colNum = Math.floor(colNum / 26);
  }
  
  return colStr + (row + 1); // Convert row to 1-based
};

// Extract values from a range of cells
export const getRangeValues = (rangeStr, data) => {
  const range = parseCellRange(rangeStr);
  if (!range) return [];
  
  const { start, end } = range;
  const values = [];
  
  for (let row = Math.min(start.row, end.row); row <= Math.max(start.row, end.row); row++) {
    for (let col = Math.min(start.col, end.col); col <= Math.max(start.col, end.col); col++) {
      const cellId = getCellId(row, col);
      const cellData = data.cells[cellId];
      
      if (cellData) {
        // Extract numeric value for calculations
        const value = cellData.value;
        if (cellData.data_type === 'number') {
          values.push(parseFloat(value));
        } else if (cellData.data_type === 'date') {
          // Convert date to timestamp for calculations
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            values.push(date.getTime());
          }
        } else if (cellData.data_type === 'text' && !isNaN(parseFloat(value))) {
          // Try to parse text as number
          values.push(parseFloat(value));
        }
      }
    }
  }
  
  return values;
};

// Parse formula string and extract function name and arguments
export const parseFormula = (formula) => {
  if (!formula.startsWith('=')) return null;
  
  const match = formula.match(/^=(\w+)\((.*)\)$/);
  if (!match) return null;
  
  const functionName = match[1].toUpperCase();
  const args = match[2].split(',').map(arg => arg.trim());
  
  return { functionName, args };
};

// Evaluate formula
export const evaluateFormula = (formula, data) => {
  const parsed = parseFormula(formula);
  if (!parsed) return null;
  
  const { functionName, args } = parsed;
  
  switch (functionName) {
    case 'SUM':
      if (args.length !== 1) return null;
      const sumValues = getRangeValues(args[0], data);
      return sumValues.reduce((sum, val) => sum + val, 0);
      
    case 'AVERAGE':
      if (args.length !== 1) return null;
      const avgValues = getRangeValues(args[0], data);
      if (avgValues.length === 0) return 0;
      return avgValues.reduce((sum, val) => sum + val, 0) / avgValues.length;
      
    case 'COUNT':
      if (args.length !== 1) return null;
      const countValues = getRangeValues(args[0], data);
      return countValues.length;
      
    default:
      return null;
  }
};

// Check if a value is a formula
export const isFormula = (value) => {
  return typeof value === 'string' && value.startsWith('=');
};

// Get formula display value (what to show in the cell)
export const getFormulaDisplayValue = (formula, data) => {
  const result = evaluateFormula(formula, data);
  if (result === null) return '#ERROR!';
  
  // Format the result
  if (typeof result === 'number') {
    // Check if it's a whole number
    if (Number.isInteger(result)) {
      return result.toString();
    } else {
      return result.toFixed(2);
    }
  }
  
  return result.toString();
};

// Get formula error message if any
export const getFormulaError = (formula, data) => {
  if (!isFormula(formula)) return null;
  
  const parsed = parseFormula(formula);
  if (!parsed) return 'Invalid formula syntax';
  
  const { functionName, args } = parsed;
  
  // Check if function is supported
  if (!['SUM', 'AVERAGE', 'COUNT'].includes(functionName)) {
    return `Unsupported function: ${functionName}`;
  }
  
  // Check arguments
  if (args.length !== 1) {
    return `${functionName} requires exactly 1 argument`;
  }
  
  // Check if range is valid
  const range = parseCellRange(args[0]);
  if (!range) {
    return 'Invalid cell range';
  }
  
  return null; // No error
}; 