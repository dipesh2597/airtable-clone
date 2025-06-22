// Test file to verify date validation with DD/MM/YYYY and DD/MM/YY formats
import { isValidDate, looksLikeDate, detectDataType, validateValue } from './dataValidation.js';

console.log('Testing date validation with DD/MM/YYYY and DD/MM/YY formats...\n');

// Test cases for DD/MM/YYYY format
const testCases = [
  '25/12/2024',  // Valid DD/MM/YYYY
  '1/1/2024',    // Valid D/M/YYYY
  '31/12/2024',  // Valid DD/MM/YYYY
  '25/12/24',    // Valid DD/MM/YY
  '1/1/24',      // Valid D/M/YY
  '32/12/2024',  // Invalid date (day > 31)
  '25/13/2024',  // Invalid date (month > 12)
  '25/12/2025',  // Valid future date
  'abc',         // Not a date
  '123',         // Number
  '',            // Empty
];

testCases.forEach(testCase => {
  console.log(`Testing: "${testCase}"`);
  console.log(`  looksLikeDate: ${looksLikeDate(testCase)}`);
  console.log(`  isValidDate: ${isValidDate(testCase)}`);
  console.log(`  detectDataType: ${detectDataType(testCase)}`);
  
  const validation = validateValue(testCase);
  console.log(`  validation:`, validation);
  console.log('');
});

console.log('Date validation test completed!'); 