// Test file to verify formula parsing and evaluation
import { 
  parseCellRef, 
  parseCellRange, 
  getCellId, 
  getRangeValues, 
  parseFormula, 
  evaluateFormula, 
  isFormula, 
  getFormulaDisplayValue,
  getFormulaError 
} from './formulaParser.js';

console.log('Testing formula parsing and evaluation...\n');

// Test cell reference parsing
console.log('Testing cell reference parsing:');
console.log('A1 ->', parseCellRef('A1'));
console.log('B5 ->', parseCellRef('B5'));
console.log('Z26 ->', parseCellRef('Z26'));
console.log('');

// Test cell range parsing
console.log('Testing cell range parsing:');
console.log('A1:B10 ->', parseCellRange('A1:B10'));
console.log('B5:D8 ->', parseCellRange('B5:D8'));
console.log('');

// Test cell ID generation
console.log('Testing cell ID generation:');
console.log('(0,0) ->', getCellId(0, 0));
console.log('(4,1) ->', getCellId(4, 1));
console.log('(25,25) ->', getCellId(25, 25));
console.log('');

// Test formula parsing
console.log('Testing formula parsing:');
console.log('=SUM(A1:A10) ->', parseFormula('=SUM(A1:A10)'));
console.log('=AVERAGE(B1:B5) ->', parseFormula('=AVERAGE(B1:B5)'));
console.log('=COUNT(C1:C20) ->', parseFormula('=COUNT(C1:C20)'));
console.log('');

// Test formula detection
console.log('Testing formula detection:');
console.log('=SUM(A1:A10) ->', isFormula('=SUM(A1:A10)'));
console.log('Hello ->', isFormula('Hello'));
console.log('123 ->', isFormula('123'));
console.log('');

// Test with mock data
const mockData = {
  cells: {
    'A1': { value: '10', data_type: 'number' },
    'A2': { value: '20', data_type: 'number' },
    'A3': { value: '30', data_type: 'number' },
    'A4': { value: '40', data_type: 'number' },
    'A5': { value: '50', data_type: 'number' },
    'B1': { value: 'Hello', data_type: 'text' },
    'B2': { value: '25', data_type: 'number' },
    'B3': { value: '35', data_type: 'number' },
    'B4': { value: '45', data_type: 'number' },
    'B5': { value: '55', data_type: 'number' },
    'C1': { value: '100', data_type: 'number' },
    'C2': { value: '200', data_type: 'number' },
    'C3': { value: '300', data_type: 'number' }
  }
};

console.log('Testing formula evaluation with mock data:');
console.log('=SUM(A1:A5) ->', evaluateFormula('=SUM(A1:A5)', mockData));
console.log('=AVERAGE(A1:A5) ->', evaluateFormula('=AVERAGE(A1:A5)', mockData));
console.log('=COUNT(A1:A5) ->', evaluateFormula('=COUNT(A1:A5)', mockData));
console.log('=SUM(B1:B5) ->', evaluateFormula('=SUM(B1:B5)', mockData)); // Should ignore text
console.log('');

console.log('Testing formula display values:');
console.log('=SUM(A1:A5) ->', getFormulaDisplayValue('=SUM(A1:A5)', mockData));
console.log('=AVERAGE(A1:A5) ->', getFormulaDisplayValue('=AVERAGE(A1:A5)', mockData));
console.log('=COUNT(A1:A5) ->', getFormulaDisplayValue('=COUNT(A1:A5)', mockData));
console.log('');

console.log('Testing formula error detection:');
console.log('=SUM(A1) ->', getFormulaError('=SUM(A1)', mockData)); // Invalid range
console.log('=INVALID(A1:A5) ->', getFormulaError('=INVALID(A1:A5)', mockData)); // Unknown function
console.log('=SUM(A1:A5,B1:B5) ->', getFormulaError('=SUM(A1:A5,B1:B5)', mockData)); // Too many args
console.log('=SUM(A1:A5) ->', getFormulaError('=SUM(A1:A5)', mockData)); // Should be null (no error)
console.log('');

console.log('Formula testing completed!'); 