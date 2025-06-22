// Data type detection and validation utilities

// Helper function to check if a string is a valid date
export const isValidDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false;
  
  // Common date formats to support
  const dateFormats = [
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY or M/D/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/, // MM-DD-YYYY or M-D-YYYY
    /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-MM-DD or YYYY-M-D
    /^\d{1,2}\/\d{1,2}\/\d{2}$/, // MM/DD/YY or M/D/YY
  ];
  
  // Check if format matches
  const formatMatches = dateFormats.some(format => format.test(dateString.trim()));
  if (!formatMatches) return false;
  
  // Try to parse the date
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Helper function to check if a string looks like a date (format-wise)
export const looksLikeDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false;
  
  // Common date formats to support
  const dateFormats = [
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY or M/D/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/, // MM-DD-YYYY or M-D-YYYY
    /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-MM-DD or YYYY-M-D
    /^\d{1,2}\/\d{1,2}\/\d{2}$/, // MM/DD/YY or M/D/YY
  ];
  
  // Check if format matches
  return dateFormats.some(format => format.test(dateString.trim()));
};

// Helper function to check if a string is a valid number
export const isValidNumber = (numberString) => {
  if (!numberString || typeof numberString !== 'string') return false;
  const trimmed = numberString.trim();
  if (trimmed === '') return false;
  
  // Allow integers, decimals, negative numbers, and scientific notation
  const numberRegex = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
  return numberRegex.test(trimmed) && !isNaN(parseFloat(trimmed));
};

// Detect data type based on input value
export const detectDataType = (value) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return 'empty';
  }
  
  const stringValue = String(value).trim();
  
  // Check for number first (most specific)
  if (isValidNumber(stringValue)) {
    return 'number';
  }
  
  // Check if it looks like a date (even if invalid)
  if (looksLikeDate(stringValue)) {
    return 'date';
  }
  
  // Default to text
  return 'text';
};

// Validate value based on detected or specified type
export const validateValue = (value, expectedType = null) => {
  const detectedType = detectDataType(value);
  const typeToValidate = expectedType || detectedType;
  
  const result = {
    isValid: true,
    detectedType,
    expectedType: typeToValidate,
    errors: [],
    formattedValue: value
  };
  
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    result.detectedType = 'empty';
    result.formattedValue = '';
    return result;
  }
  
  const stringValue = String(value).trim();
  
  switch (typeToValidate) {
    case 'number':
      if (!isValidNumber(stringValue)) {
        result.isValid = false;
        result.errors.push('Invalid number format');
      } else {
        // Format number for display
        const num = parseFloat(stringValue);
        result.formattedValue = num.toString();
      }
      break;
      
    case 'date':
      if (!isValidDate(stringValue)) {
        result.isValid = false;
        result.errors.push('Invalid date format. Use MM/DD/YYYY, YYYY-MM-DD, or similar');
      } else {
        // Format date for display
        const date = new Date(stringValue);
        result.formattedValue = date.toLocaleDateString();
      }
      break;
      
    case 'text':
      // Text validation - check length
      if (stringValue.length > 1000) {
        result.isValid = false;
        result.errors.push('Text too long (max 1000 characters)');
      }
      result.formattedValue = stringValue;
      break;
      
    case 'empty':
      result.formattedValue = '';
      break;
      
    default:
      result.formattedValue = stringValue;
  }
  
  return result;
};

// Get display icon for data type
export const getTypeIcon = (type) => {
  switch (type) {
    case 'number':
      return '123';
    case 'date':
      return '📅';
    case 'text':
      return 'T';
    case 'empty':
      return '';
    default:
      return 'T';
  }
};

// Get display color for validation status
export const getValidationColor = (isValid) => {
  return isValid ? 'text-green-600' : 'text-red-600';
}; 