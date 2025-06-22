/**
 * Data validation testing utilities and tests for the Airtable Clone frontend
 * Tests data type detection, validation, and formatting
 */

// Mock validation functions
export const mockDataValidator = {
  // Number validation
  isNumber: (value) => {
    if (typeof value === 'number') return true;
    if (typeof value !== 'string') return false;
    
    // Check for empty string
    if (value.trim() === '') return false;
    
    // Check for valid number format
    const numRegex = /^-?\d*\.?\d+(?:[eE][-+]?\d+)?$/;
    return numRegex.test(value.trim());
  },
  
  // Date validation
  isDate: (value) => {
    if (typeof value !== 'string') return false;
    
    const dateFormats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/  // DD-MM-YYYY
    ];
    
    return dateFormats.some(format => format.test(value.trim()));
  },
  
  // Formula validation
  isFormula: (value) => {
    if (typeof value !== 'string') return false;
    return value.trim().startsWith('=');
  },
  
  // Text validation
  isText: (value) => {
    if (typeof value !== 'string') return false;
    return value.trim().length > 0;
  },
  
  // Empty validation
  isEmpty: (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    return false;
  },
  
  // Data type detection
  detectDataType: (value) => {
    if (mockDataValidator.isEmpty(value)) return 'empty';
    if (mockDataValidator.isFormula(value)) return 'formula';
    if (mockDataValidator.isDate(value)) return 'date';
    if (mockDataValidator.isNumber(value)) return 'number';
    if (mockDataValidator.isText(value)) return 'text';
    return 'unknown';
  },
  
  // Value validation with error messages
  validateValue: (value) => {
    const result = {
      is_valid: true,
      detected_type: 'unknown',
      formatted_value: value,
      errors: []
    };
    
    // Check for empty value
    if (mockDataValidator.isEmpty(value)) {
      result.detected_type = 'empty';
      result.formatted_value = '';
      return result;
    }
    
    // Check for formula
    if (mockDataValidator.isFormula(value)) {
      result.detected_type = 'formula';
      return result;
    }
    
    // Check for date
    if (mockDataValidator.isDate(value)) {
      result.detected_type = 'date';
      return result;
    }
    
    // Check for number
    if (mockDataValidator.isNumber(value)) {
      result.detected_type = 'number';
      result.formatted_value = parseFloat(value).toString();
      return result;
    }
    
    // Check for text
    if (mockDataValidator.isText(value)) {
      result.detected_type = 'text';
      
      // Check for text length limits
      if (value.length > 1000) {
        result.is_valid = false;
        result.errors.push('Text is too long (maximum 1000 characters)');
      }
      
      return result;
    }
    
    // Invalid value
    result.is_valid = false;
    result.errors.push('Invalid value format');
    return result;
  },
  
  // Format value for display
  formatValue: (value, dataType) => {
    switch (dataType) {
      case 'number':
        const num = parseFloat(value);
        return isNaN(num) ? value : num.toString();
        
      case 'date':
        // Standardize date format to YYYY-MM-DD
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        return date.toISOString().split('T')[0];
        
      case 'text':
        return value.toString();
        
      case 'formula':
        return value.toString();
        
      case 'empty':
        return '';
        
      default:
        return value.toString();
    }
  }
};

// Test data sets
export const testDataSets = {
  numbers: [
    '42',
    '3.14',
    '-123',
    '1e6',
    '1.23e-10',
    '0',
    '999999999999999',
    '0.0000001'
  ],
  
  invalidNumbers: [
    'abc',
    '12.34.56',
    '1e',
    'e10',
    '1,234',
    '1 234',
    '',
    ' ',
    '12abc',
    'abc12'
  ],
  
  dates: [
    '2024-12-25',
    '12/25/2024',
    '25-12-2024',
    '2024-01-01',
    '01/01/2024',
    '01-01-2024'
  ],
  
  invalidDates: [
    '2024-13-01', // Invalid month
    '2024-12-32', // Invalid day
    '2024/12/25', // Wrong separator
    '25-12-2024', // Wrong order
    'abc-def-ghi', // Not a date
    '2024', // Incomplete
    '12/25', // Incomplete
    '25-12', // Incomplete
    '2024-12-25T10:30:00', // DateTime not supported
    '2024-12-25 10:30:00' // DateTime not supported
  ],
  
  formulas: [
    '=SUM(A1:A10)',
    '=AVERAGE(B1:B5)',
    '=COUNT(C1:C20)',
    '=MAX(D1:D15)',
    '=MIN(E1:E8)',
    '=SUM(A1,B1,C1)',
    '=AVERAGE(A1:A5,B1:B5)'
  ],
  
  invalidFormulas: [
    'SUM(A1:A10)', // Missing =
    '=SUM', // Incomplete
    '=SUM(A1:A10', // Missing closing )
    '=SUM(A1:A10,B1:B10)', // Too many arguments
    '=INVALID(A1:A10)', // Unknown function
    '=SUM(Z1:Z10)', // Out of bounds
    '=SUM(A1:A10,B1:B10,C1:C10)', // Too many arguments
    '=SUM()', // No arguments
    '=SUM(A1)', // Invalid range
    '=SUM(A1:B1:C1)' // Invalid range format
  ],
  
  text: [
    'Hello World',
    'Simple text',
    'Text with numbers 123',
    'Text with symbols !@#$%^&*()',
    'Text with spaces and tabs',
    'Text with "quotes"',
    'Text with \'apostrophes\'',
    'Text with\nnewlines',
    'Text with\ttabs',
    'Unicode text: 你好世界',
    'Emoji text: 🚀📊💻',
    'A'.repeat(500), // Long text
    'A'.repeat(1000), // Maximum length
    'A'.repeat(1001)  // Too long
  ],
  
  empty: [
    '',
    ' ',
    '  ',
    '\t',
    '\n',
    '\r\n',
    null,
    undefined
  ],
  
  edgeCases: [
    '0', // Zero number
    '0.0', // Zero decimal
    '00', // Leading zeros
    '001', // Leading zeros
    '1.0', // Decimal with zero
    '1.', // Decimal without fraction
    '.5', // Decimal without whole
    '-0', // Negative zero
    '+1', // Positive sign
    '1e+0', // Scientific notation with zero
    '1e-0', // Scientific notation with negative zero
    'Infinity', // Infinity
    '-Infinity', // Negative infinity
    'NaN', // Not a number
    'true', // Boolean as string
    'false', // Boolean as string
    'null', // Null as string
    'undefined' // Undefined as string
  ]
};

// Test cases for data validation
export const validationTestCases = [
  // Number validation tests
  {
    name: 'Valid Numbers',
    data: testDataSets.numbers,
    validator: (value) => mockDataValidator.isNumber(value),
    expected: true,
    description: 'Should correctly identify valid numbers'
  },
  {
    name: 'Invalid Numbers',
    data: testDataSets.invalidNumbers,
    validator: (value) => mockDataValidator.isNumber(value),
    expected: false,
    description: 'Should correctly reject invalid numbers'
  },
  
  // Date validation tests
  {
    name: 'Valid Dates',
    data: testDataSets.dates,
    validator: (value) => mockDataValidator.isDate(value),
    expected: true,
    description: 'Should correctly identify valid dates'
  },
  {
    name: 'Invalid Dates',
    data: testDataSets.invalidDates,
    validator: (value) => mockDataValidator.isDate(value),
    expected: false,
    description: 'Should correctly reject invalid dates'
  },
  
  // Formula validation tests
  {
    name: 'Valid Formulas',
    data: testDataSets.formulas,
    validator: (value) => mockDataValidator.isFormula(value),
    expected: true,
    description: 'Should correctly identify valid formulas'
  },
  {
    name: 'Invalid Formulas',
    data: testDataSets.invalidFormulas,
    validator: (value) => mockDataValidator.isFormula(value),
    expected: false,
    description: 'Should correctly reject invalid formulas'
  },
  
  // Text validation tests
  {
    name: 'Valid Text',
    data: testDataSets.text.slice(0, -1), // Exclude the too-long text
    validator: (value) => mockDataValidator.isText(value),
    expected: true,
    description: 'Should correctly identify valid text'
  },
  {
    name: 'Empty Values',
    data: testDataSets.empty,
    validator: (value) => mockDataValidator.isEmpty(value),
    expected: true,
    description: 'Should correctly identify empty values'
  }
];

// Test runner for data validation
export const runDataValidationTests = () => {
  console.log('🔍 Running Data Validation Tests...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  validationTestCases.forEach(testCase => {
    console.log(`🧪 Testing: ${testCase.name}`);
    console.log(`📝 ${testCase.description}`);
    
    let testPassed = 0;
    let testFailed = 0;
    
    testCase.data.forEach(value => {
      try {
        const result = testCase.validator(value);
        if (result === testCase.expected) {
          testPassed++;
        } else {
          testFailed++;
          console.log(`  ❌ "${value}" - Expected ${testCase.expected}, got ${result}`);
        }
      } catch (error) {
        testFailed++;
        console.log(`  ❌ "${value}" - Exception: ${error.message}`);
      }
    });
    
    if (testFailed === 0) {
      console.log(`✅ ${testCase.name}: ${testPassed} tests passed\n`);
      results.passed++;
    } else {
      console.log(`❌ ${testCase.name}: ${testPassed} passed, ${testFailed} failed\n`);
      results.failed++;
      results.errors.push(`${testCase.name}: ${testFailed} tests failed`);
    }
  });
  
  console.log(`📊 Data Validation Results: ${results.passed} passed, ${results.failed} failed`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  return results;
};

// Data type detection tests
export const runDataTypeDetectionTests = () => {
  console.log('🎯 Running Data Type Detection Tests...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  const typeTests = [
    { data: testDataSets.numbers, expectedType: 'number' },
    { data: testDataSets.dates, expectedType: 'date' },
    { data: testDataSets.formulas, expectedType: 'formula' },
    { data: testDataSets.text.slice(0, -1), expectedType: 'text' },
    { data: testDataSets.empty, expectedType: 'empty' }
  ];
  
  typeTests.forEach(test => {
    console.log(`🧪 Testing: ${test.expectedType} detection`);
    
    let testPassed = 0;
    let testFailed = 0;
    
    test.data.forEach(value => {
      try {
        const detectedType = mockDataValidator.detectDataType(value);
        if (detectedType === test.expectedType) {
          testPassed++;
        } else {
          testFailed++;
          console.log(`  ❌ "${value}" - Expected ${test.expectedType}, got ${detectedType}`);
        }
      } catch (error) {
        testFailed++;
        console.log(`  ❌ "${value}" - Exception: ${error.message}`);
      }
    });
    
    if (testFailed === 0) {
      console.log(`✅ ${test.expectedType} detection: ${testPassed} tests passed\n`);
      results.passed++;
    } else {
      console.log(`❌ ${test.expectedType} detection: ${testPassed} passed, ${testFailed} failed\n`);
      results.failed++;
      results.errors.push(`${test.expectedType} detection: ${testFailed} tests failed`);
    }
  });
  
  console.log(`📊 Data Type Detection Results: ${results.passed} passed, ${results.failed} failed`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  return results;
};

// Value validation tests
export const runValueValidationTests = () => {
  console.log('✅ Running Value Validation Tests...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  const validationTests = [
    {
      name: 'Valid Values',
      data: [
        { value: '42', expected: { valid: true, type: 'number' } },
        { value: '2024-12-25', expected: { valid: true, type: 'date' } },
        { value: '=SUM(A1:A10)', expected: { valid: true, type: 'formula' } },
        { value: 'Hello World', expected: { valid: true, type: 'text' } },
        { value: '', expected: { valid: true, type: 'empty' } }
      ]
    },
    {
      name: 'Invalid Values',
      data: [
        { value: 'A'.repeat(1001), expected: { valid: false, type: 'text' } },
        { value: 'invalid-date', expected: { valid: true, type: 'text' } },
        { value: '12.34.56', expected: { valid: true, type: 'text' } }
      ]
    }
  ];
  
  validationTests.forEach(test => {
    console.log(`🧪 Testing: ${test.name}`);
    
    let testPassed = 0;
    let testFailed = 0;
    
    test.data.forEach(({ value, expected }) => {
      try {
        const result = mockDataValidator.validateValue(value);
        
        const isValid = result.is_valid === expected.valid && 
                       result.detected_type === expected.type;
        
        if (isValid) {
          testPassed++;
        } else {
          testFailed++;
          console.log(`  ❌ "${value}" - Expected valid=${expected.valid}, type=${expected.type}, got valid=${result.is_valid}, type=${result.detected_type}`);
        }
      } catch (error) {
        testFailed++;
        console.log(`  ❌ "${value}" - Exception: ${error.message}`);
      }
    });
    
    if (testFailed === 0) {
      console.log(`✅ ${test.name}: ${testPassed} tests passed\n`);
      results.passed++;
    } else {
      console.log(`❌ ${test.name}: ${testPassed} passed, ${testFailed} failed\n`);
      results.failed++;
      results.errors.push(`${test.name}: ${testFailed} tests failed`);
    }
  });
  
  console.log(`📊 Value Validation Results: ${results.passed} passed, ${results.failed} failed`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  return results;
};

// Format tests
export const runFormatTests = () => {
  console.log('🎨 Running Format Tests...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  const formatTests = [
    { value: '42', type: 'number', expected: '42' },
    { value: '3.14', type: 'number', expected: '3.14' },
    { value: '2024-12-25', type: 'date', expected: '2024-12-25' },
    { value: '12/25/2024', type: 'date', expected: '2024-12-25' },
    { value: '=SUM(A1:A10)', type: 'formula', expected: '=SUM(A1:A10)' },
    { value: 'Hello World', type: 'text', expected: 'Hello World' },
    { value: '', type: 'empty', expected: '' }
  ];
  
  formatTests.forEach(test => {
    try {
      const result = mockDataValidator.formatValue(test.value, test.type);
      
      if (result === test.expected) {
        console.log(`✅ "${test.value}" (${test.type}) -> "${result}"`);
        results.passed++;
      } else {
        console.log(`❌ "${test.value}" (${test.type}) - Expected "${test.expected}", got "${result}"`);
        results.failed++;
        results.errors.push(`Format test failed for "${test.value}" (${test.type})`);
      }
    } catch (error) {
      console.log(`❌ "${test.value}" (${test.type}) - Exception: ${error.message}`);
      results.failed++;
      results.errors.push(`Format test exception for "${test.value}" (${test.type}): ${error.message}`);
    }
  });
  
  console.log(`\n📊 Format Test Results: ${results.passed} passed, ${results.failed} failed`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  return results;
};

// Export test runner
export const runAllDataValidationTests = () => {
  console.log('🚀 Starting Comprehensive Data Validation Test Suite\n');
  
  const validationResults = runDataValidationTests();
  console.log('\n' + '='.repeat(50) + '\n');
  
  const detectionResults = runDataTypeDetectionTests();
  console.log('\n' + '='.repeat(50) + '\n');
  
  const valueResults = runValueValidationTests();
  console.log('\n' + '='.repeat(50) + '\n');
  
  const formatResults = runFormatTests();
  
  const totalPassed = validationResults.passed + detectionResults.passed + 
                     valueResults.passed + formatResults.passed;
  const totalFailed = validationResults.failed + detectionResults.failed + 
                     valueResults.failed + formatResults.failed;
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎯 TOTAL DATA VALIDATION RESULTS: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('='.repeat(50));
  
  return {
    validation: validationResults,
    detection: detectionResults,
    value: valueResults,
    format: formatResults,
    total: { passed: totalPassed, failed: totalFailed }
  };
};

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.runAllDataValidationTests = runAllDataValidationTests;
  window.mockDataValidator = mockDataValidator;
  window.testDataSets = testDataSets;
} else {
  // Node.js environment
  module.exports = {
    runAllDataValidationTests,
    mockDataValidator,
    testDataSets,
    validationTestCases
  };
} 