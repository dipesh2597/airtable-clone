"""
Data validation utilities for the backend
Mirrors the frontend validation logic to ensure consistency
"""

import re
from datetime import datetime
from typing import Dict, Any, List, Union


def is_valid_date(date_string: str) -> bool:
    """Check if a string is a valid date"""
    if not date_string or not isinstance(date_string, str):
        return False
    
    # Common date formats to support
    date_formats = [
        r'^\d{1,2}/\d{1,2}/\d{4}$',  # MM/DD/YYYY or M/D/YYYY
        r'^\d{1,2}-\d{1,2}-\d{4}$',  # MM-DD-YYYY or M-D-YYYY
        r'^\d{4}-\d{1,2}-\d{1,2}$',  # YYYY-MM-DD or YYYY-M-D
        r'^\d{1,2}/\d{1,2}/\d{2}$',  # MM/DD/YY or M/D/YY
    ]
    
    # Check if format matches
    format_matches = any(re.match(pattern, date_string.strip()) for pattern in date_formats)
    if not format_matches:
        return False
    
    # Try to parse the date
    try:
        # Try different parsing formats (MM/DD/YYYY, MM/DD/YY, YYYY-MM-DD)
        for fmt in ['%m/%d/%Y', '%m-%d-%Y', '%Y-%m-%d', '%m/%d/%y']:
            try:
                datetime.strptime(date_string.strip(), fmt)
                return True
            except ValueError:
                continue
        return False
    except:
        return False


def is_valid_number(number_string: str) -> bool:
    """Check if a string is a valid number"""
    if not number_string or not isinstance(number_string, str):
        return False
    
    trimmed = number_string.strip()
    if trimmed == '':
        return False
    
    # Allow integers, decimals, negative numbers, and scientific notation
    number_pattern = r'^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$'
    if not re.match(number_pattern, trimmed):
        return False
    
    try:
        float(trimmed)
        return True
    except ValueError:
        return False


def looks_like_date(date_string: str) -> bool:
    """Check if a string looks like a date format-wise (even if invalid)"""
    if not date_string or not isinstance(date_string, str):
        return False
    
    # Common date formats to support
    date_formats = [
        r'^\d{1,2}/\d{1,2}/\d{4}$',  # MM/DD/YYYY or M/D/YYYY
        r'^\d{1,2}-\d{1,2}-\d{4}$',  # MM-DD-YYYY or M-D-YYYY
        r'^\d{4}-\d{1,2}-\d{1,2}$',  # YYYY-MM-DD or YYYY-M-D
        r'^\d{1,2}/\d{1,2}/\d{2}$',  # MM/DD/YY or M/D/YY
    ]
    
    # Check if format matches
    return any(re.match(pattern, date_string.strip()) for pattern in date_formats)


def detect_data_type(value: Union[str, int, float, None]) -> str:
    """Detect data type based on input value"""
    if value is None or (isinstance(value, str) and value.strip() == ''):
        return 'empty'
    
    string_value = str(value).strip()
    
    # Check for number first (most specific)
    if is_valid_number(string_value):
        return 'number'
    
    # Check if it looks like a date (even if invalid)
    if looks_like_date(string_value):
        return 'date'
    
    # Default to text
    return 'text'


def validate_value(value: Union[str, int, float, None], expected_type: str = None) -> Dict[str, Any]:
    """Validate value based on detected or specified type"""
    detected_type = detect_data_type(value)
    type_to_validate = expected_type or detected_type
    
    result = {
        'is_valid': True,
        'detected_type': detected_type,
        'expected_type': type_to_validate,
        'errors': [],
        'formatted_value': str(value) if value is not None else ''
    }
    
    if value is None or (isinstance(value, str) and value.strip() == ''):
        result['detected_type'] = 'empty'
        result['formatted_value'] = ''
        return result
    
    string_value = str(value).strip()
    
    if type_to_validate == 'number':
        if not is_valid_number(string_value):
            result['is_valid'] = False
            result['errors'].append('Invalid number format')
        else:
            # Format number for storage
            try:
                num = float(string_value)
                # Keep as integer if it's a whole number
                if num.is_integer():
                    result['formatted_value'] = str(int(num))
                else:
                    result['formatted_value'] = str(num)
            except ValueError:
                result['is_valid'] = False
                result['errors'].append('Invalid number format')
    
    elif type_to_validate == 'date':
        if not is_valid_date(string_value):
            result['is_valid'] = False
            result['errors'].append('Invalid date format. Use MM/DD/YYYY, YYYY-MM-DD, or similar')
        else:
            # Format date for storage (keep original format for now)
            result['formatted_value'] = string_value
    
    elif type_to_validate == 'text':
        # Text validation - check length
        if len(string_value) > 1000:
            result['is_valid'] = False
            result['errors'].append('Text too long (max 1000 characters)')
        result['formatted_value'] = string_value
    
    elif type_to_validate == 'empty':
        result['formatted_value'] = ''
    
    else:
        result['formatted_value'] = string_value
    
    return result


def get_type_icon(data_type: str) -> str:
    """Get display icon for data type"""
    icons = {
        'number': '123',
        'date': '📅',
        'text': 'T',
        'empty': ''
    }
    return icons.get(data_type, 'T') 