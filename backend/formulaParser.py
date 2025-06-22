"""
Backend formula parsing and evaluation utilities
Mirrors the frontend formula logic for server-side validation
"""

import re
from typing import Dict, Any, List, Optional, Union


def parse_cell_ref(cell_ref: str) -> Optional[Dict[str, int]]:
    """Parse cell reference like "A1" to {col: 0, row: 0}"""
    match = re.match(r'^([A-Z]+)(\d+)$', cell_ref)
    if not match:
        return None
    
    col_str = match.group(1)
    row_str = match.group(2)
    
    # Convert column letters to number (A=0, B=1, etc.)
    col = 0
    for char in col_str:
        col = col * 26 + (ord(char) - 65 + 1)
    col -= 1  # Convert to 0-based index
    
    row = int(row_str) - 1  # Convert to 0-based index
    
    return {'col': col, 'row': row}


def parse_cell_range(range_str: str) -> Optional[Dict[str, Dict[str, int]]]:
    """Parse cell range like "A1:B10" to {start: {col, row}, end: {col, row}}"""
    parts = range_str.split(':')
    if len(parts) != 2:
        return None
    
    start = parse_cell_ref(parts[0])
    end = parse_cell_ref(parts[1])
    
    if not start or not end:
        return None
    
    return {'start': start, 'end': end}


def get_cell_id(row: int, col: int) -> str:
    """Get cell ID from row and column indices"""
    # Convert column number to letters
    col_str = ''
    col_num = col + 1  # Convert to 1-based
    
    while col_num > 0:
        col_num -= 1
        col_str = chr(65 + (col_num % 26)) + col_str
        col_num = col_num // 26
    
    return col_str + str(row + 1)  # Convert row to 1-based


def get_range_values(range_str: str, data: Dict[str, Any]) -> List[float]:
    """Extract values from a range of cells"""
    range_obj = parse_cell_range(range_str)
    if not range_obj:
        return []
    
    start = range_obj['start']
    end = range_obj['end']
    values = []
    
    for row in range(min(start['row'], end['row']), max(start['row'], end['row']) + 1):
        for col in range(min(start['col'], end['col']), max(start['col'], end['col']) + 1):
            cell_id = get_cell_id(row, col)
            cell_data = data.get('cells', {}).get(cell_id)
            
            if cell_data:
                # Extract numeric value for calculations
                value = cell_data.get('value', '')
                data_type = cell_data.get('data_type', 'text')
                
                if data_type == 'number':
                    try:
                        values.append(float(value))
                    except (ValueError, TypeError):
                        pass
                elif data_type == 'date':
                    # Convert date to timestamp for calculations
                    try:
                        from datetime import datetime
                        date = datetime.fromisoformat(value.replace('Z', '+00:00'))
                        values.append(date.timestamp())
                    except (ValueError, TypeError):
                        pass
                elif data_type == 'text':
                    # Try to parse text as number
                    try:
                        num_val = float(value)
                        values.append(num_val)
                    except (ValueError, TypeError):
                        pass
    
    return values


def parse_formula(formula: str) -> Optional[Dict[str, Any]]:
    """Parse formula string and extract function name and arguments"""
    if not formula.startswith('='):
        return None
    
    match = re.match(r'^=(\w+)\((.*)\)$', formula)
    if not match:
        return None
    
    function_name = match.group(1).upper()
    args = [arg.strip() for arg in match.group(2).split(',')]
    
    return {'functionName': function_name, 'args': args}


def evaluate_formula(formula: str, data: Dict[str, Any]) -> Optional[Union[float, int]]:
    """Evaluate formula"""
    parsed = parse_formula(formula)
    if not parsed:
        return None
    
    function_name = parsed['functionName']
    args = parsed['args']
    
    if function_name == 'SUM':
        if len(args) != 1:
            return None
        sum_values = get_range_values(args[0], data)
        return sum(sum_values)
    
    elif function_name == 'AVERAGE':
        if len(args) != 1:
            return None
        avg_values = get_range_values(args[0], data)
        if not avg_values:
            return 0
        return sum(avg_values) / len(avg_values)
    
    elif function_name == 'COUNT':
        if len(args) != 1:
            return None
        count_values = get_range_values(args[0], data)
        return len(count_values)
    
    else:
        return None


def is_formula(value: str) -> bool:
    """Check if a value is a formula"""
    return isinstance(value, str) and value.startswith('=')


def get_formula_display_value(formula: str, data: Dict[str, Any]) -> str:
    """Get formula display value (what to show in the cell)"""
    result = evaluate_formula(formula, data)
    if result is None:
        return '#ERROR!'
    
    # Format the result
    if isinstance(result, (int, float)):
        # Check if it's a whole number
        if result == int(result):
            return str(int(result))
        else:
            return f'{result:.2f}'
    
    return str(result)


def get_formula_error(formula: str, data: Dict[str, Any]) -> Optional[str]:
    """Get formula error message if any"""
    if not is_formula(formula):
        return None
    
    parsed = parse_formula(formula)
    if not parsed:
        return 'Invalid formula syntax'
    
    function_name = parsed['functionName']
    args = parsed['args']
    
    # Check if function is supported
    if function_name not in ['SUM', 'AVERAGE', 'COUNT']:
        return f'Unsupported function: {function_name}'
    
    # Check arguments
    if len(args) != 1:
        return f'{function_name} requires exactly 1 argument'
    
    # Check if range is valid
    range_obj = parse_cell_range(args[0])
    if not range_obj:
        return 'Invalid cell range'
    
    return None  # No error 