"""
Comprehensive test suite for the Airtable Clone backend
Tests all major functionality including data entry, formulas, operations, and edge cases
"""

from pandas.core.missing import F
import pytest
import asyncio
import json
from datetime import datetime
from unittest.mock import Mock, patch
import pandas as pd
from io import StringIO

# Import the modules to test
from validation import (
    is_valid_date, is_valid_number, detect_data_type, validate_value
)
from main import (
    validate_value, detect_data_type,
    csv_to_spreadsheet_data, spreadsheet_data_to_csv
)
from formulaParser import (
    parse_cell_ref,
    parse_cell_range,
    get_range_values,
    evaluate_formula,
    is_formula,
    get_formula_display_value,
    get_formula_error
)


class TestDataValidation:
    """Test data validation and type detection"""
    
    def test_number_validation(self):
        """Test number validation"""
        assert is_valid_number("42") == True
        assert is_valid_number("3.14") == True
        assert is_valid_number("-123") == True
        assert is_valid_number("1e6") == True
        assert is_valid_number("abc") == False
        assert is_valid_number("") == False
        assert is_valid_number("12.34.56") == False
    
    def test_date_validation(self):
        """Test date validation"""
        assert is_valid_date("2024-12-25") == True
        assert is_valid_date("12/25/2024") == True
        assert is_valid_date("25-12-2024") == False
        assert is_valid_date("2024/12/25") == False  # Invalid format
        assert is_valid_date("abc") == False
        assert is_valid_date("") == False
    
    def test_data_type_detection(self):
        """Test data type detection"""
        assert detect_data_type("42") == "number"
        assert detect_data_type("3.14") == "number"
        assert detect_data_type("2024-12-25") == "date"
        assert detect_data_type("Hello World") == "text"
        assert detect_data_type("=SUM(A1:A10)") == "formula"
        assert detect_data_type("") == "empty"
        assert detect_data_type(None) == "empty"
    
    def test_value_validation(self):
        """Test complete value validation"""
        # Test number validation
        result = validate_value("42")
        assert result['is_valid'] == True
        assert result['detected_type'] == "number"
        assert result['formatted_value'] == "42"
        
        # Test date validation
        result = validate_value("2024-12-25")
        assert result['is_valid'] == True
        assert result['detected_type'] == "date"
        
        # Test text validation
        result = validate_value("Hello World")
        assert result['is_valid'] == True
        assert result['detected_type'] == "text"
        
        # Test empty value
        result = validate_value("")
        assert result['is_valid'] == True
        assert result['detected_type'] == "empty"
        assert result['formatted_value'] == ""


class TestFormulaParsing:
    """Test formula parsing and evaluation"""
    
    def test_cell_reference_parsing(self):
        """Test cell reference parsing"""
        # Test valid cell references
        assert parse_cell_ref("A1") == {'col': 0, 'row': 0}
        assert parse_cell_ref("B5") == {'col': 1, 'row': 4}
        assert parse_cell_ref("Z100") == {'col': 25, 'row': 99}
        
        # Test invalid cell references
        assert parse_cell_ref("1A") == None
        assert parse_cell_ref("A") == None
        assert parse_cell_ref("1") == None
        assert parse_cell_ref("") == None
    
    def test_cell_range_parsing(self):
        """Test cell range parsing"""
        # Test valid ranges
        range_obj = parse_cell_range("A1:B10")
        assert range_obj['start'] == {'col': 0, 'row': 0}
        assert range_obj['end'] == {'col': 1, 'row': 9}
        
        # Test invalid ranges
        assert parse_cell_range("A1") == None
        assert parse_cell_range("A1:B") == None
        assert parse_cell_range("A:B10") == None
    
    def test_formula_parsing(self):
        """Test formula parsing"""
        # Test valid formulas
        assert is_formula("=SUM(A1:A10)") == True
        assert is_formula("=AVERAGE(B1:B5)") == True
        assert is_formula("=COUNT(C1:C20)") == True
        
        # Test invalid formulas
        assert is_formula("SUM(A1:A10)") == False  # Missing =
        assert is_formula("Hello") == False
    
    def test_formula_evaluation(self):
        """Test formula evaluation with sample data"""
        # Create sample spreadsheet data
        sample_data = {
            "cells": {
                "A1": {"value": "1", "data_type": "number"},
                "A2": {"value": "2", "data_type": "number"},
                "A3": {"value": "3", "data_type": "number"},
                "A4": {"value": "4", "data_type": "number"},
                "A5": {"value": "5", "data_type": "number"},
                "A6": {"value": "6", "data_type": "number"},
                "A7": {"value": "7", "data_type": "number"},
                "A8": {"value": "8", "data_type": "number"},
                "A9": {"value": "9", "data_type": "number"},
                "A10": {"value": "10", "data_type": "number"},
            }
        }
        
        # Test SUM formula
        result = evaluate_formula("=SUM(A1:A10)", sample_data)
        assert result == 55
        
        # Test AVERAGE formula
        result = evaluate_formula("=AVERAGE(A1:A10)", sample_data)
        assert result == 5.5
        
        # Test COUNT formula
        result = evaluate_formula("=COUNT(A1:A10)", sample_data)
        assert result == 10
    
    def test_formula_errors(self):
        """Test formula error handling"""
        # Test invalid range
        sample_data = {
            "cells": {
                "A1": {"value": "1", "data_type": "number"},
                "A2": {"value": "2", "data_type": "number"},
                "A3": {"value": "3", "data_type": "number"},
                "A4": {"value": "4", "data_type": "number"},
                "A5": {"value": "5", "data_type": "number"},
                "A6": {"value": "6", "data_type": "number"},
                "A7": {"value": "7", "data_type": "number"},
                "A8": {"value": "8", "data_type": "number"},
                "A9": {"value": "9", "data_type": "number"},
                "A10": {"value": "10", "data_type": "number"},
            }
        }
        
        # Test unsupported function
        error = get_formula_error("=INVALID(A1:A10)", sample_data)
        assert "Unsupported function" in error
        
        # Test wrong number of arguments
        error = get_formula_error("=SUM(A1:A10,B1:B10)", sample_data)
        assert "requires exactly 1 argument" in error
        
        # Test invalid syntax
        error = get_formula_error("=SUM A1:A10", sample_data) 
        assert error == "Invalid formula syntax"


class TestCSVImportExport:
    """Test CSV import and export functionality"""
    
    def test_csv_to_spreadsheet_data(self):
        """Test CSV to spreadsheet data conversion"""
        csv_content = """Name,Age,City
John,25,New York
Jane,30,Los Angeles
Bob,35,Chicago"""
        
        result = csv_to_spreadsheet_data(csv_content)
        
        # Check structure
        assert "cells" in result
        assert "columns" in result
        assert "rows" in result
        assert "metadata" in result
        
        # Check dimensions (should be at least 26x100)
        assert result["columns"] >= 26
        assert result["rows"] >= 100
        
        # Check specific cells
        assert result["cells"]["A1"]["value"] == "Name"
        assert result["cells"]["B1"]["value"] == "Age"
        assert result["cells"]["C1"]["value"] == "City"
        assert result["cells"]["A2"]["value"] == "John"
        assert result["cells"]["B2"]["value"] == "25"
        assert result["cells"]["C2"]["value"] == "New York"
        
        # Check that empty cells are present
        assert "Z1" in result["cells"]
        assert "A100" in result["cells"]
    
    def test_spreadsheet_data_to_csv(self):
        """Test spreadsheet data to CSV conversion"""
        sample_data = {
            "cells": {
                "A1": {"value": "Name", "data_type": "text"},
                "B1": {"value": "Age", "data_type": "text"},
                "A2": {"value": "John", "data_type": "text"},
                "B2": {"value": "25", "data_type": "number"},
                "A3": {"value": "Jane", "data_type": "text"},
                "B3": {"value": "30", "data_type": "number"},
            },
            "columns": 2,
            "rows": 3
        }
        
        csv_content = spreadsheet_data_to_csv(sample_data)
        
        # Check CSV content
        lines = csv_content.strip().split('\n')
        assert len(lines) == 3
        assert lines[0] == "Name,Age"
        assert lines[1] == "John,25"
        assert lines[2] == "Jane,30"
    
    def test_empty_csv_import(self):
        """Test importing empty CSV"""
        csv_content = ",,,"
        result = csv_to_spreadsheet_data(csv_content)
        
        # Should still create a full grid
        assert result["columns"] >= 26
        assert result["rows"] >= 100
        assert len(result["cells"]) > 0
    
    def test_csv_with_missing_values(self):
        """Test CSV with missing values"""
        csv_content = """A,B,C
1,,3
,5,6"""
        
        result = csv_to_spreadsheet_data(csv_content)
        
        # Check that missing values are handled
        assert result["cells"]["A1"]["value"] == "A"
        assert result["cells"]["A2"]["value"] == "1"
        assert result["cells"]["B2"]["value"] == ""  # Missing value
        assert result["cells"]["C2"]["value"] == "3"


class TestEdgeCases:
    """Test edge cases and error handling"""
    
    def test_large_numbers(self):
        """Test handling of large numbers"""
        result = validate_value("999999999999999")
        assert result['is_valid'] == True
        assert result['detected_type'] == "number"
    
    def test_scientific_notation(self):
        """Test scientific notation"""
        result = validate_value("1.23e-10")
        assert result['is_valid'] == True
        assert result['detected_type'] == "number"
    
    def test_very_long_text(self):
        """Test very long text (should be truncated)"""
        long_text = "A" * 2000  # 2000 characters
        result = validate_value(long_text)
        assert result['is_valid'] == False
        assert "too long" in result['errors'][0]
    
    def test_special_characters(self):
        """Test special characters in text"""
        special_text = "Hello!@#$%^&*()_+-=[]{}|;':\",./<>?"
        result = validate_value(special_text)
        assert result['is_valid'] == True
        assert result['detected_type'] == "text"
    
    def test_formula_with_empty_range(self):
        """Test formula with empty range"""
        sample_data = {"cells": {}}
        result = evaluate_formula("=SUM(A1:A10)", sample_data)
        assert result == 0  # Should return 0 for empty range
    
    def test_invalid_date_formats(self):
        """Test invalid date formats"""
        invalid_dates = [
            "2024-13-01",  # Invalid month
            "2024-12-32",  # Invalid day
            "2024/12/25",  # Wrong separator
            "25-12-2024",  # Wrong order
            "abc-def-ghi"  # Not a date
        ]
        
        for date_str in invalid_dates:
            assert is_valid_date(date_str) == False


class TestIntegration:
    """Test integration scenarios"""
    
    def test_full_workflow(self):
        """Test complete workflow from data entry to export"""
        # 1. Create sample data
        sample_data = {
            "cells": {
                "A1": {"value": "Product", "data_type": "text"},
                "B1": {"value": "Price", "data_type": "text"},
                "A2": {"value": "Apple", "data_type": "text"},
                "B2": {"value": "1.99", "data_type": "number"},
                "A3": {"value": "Banana", "data_type": "text"},
                "B3": {"value": "0.99", "data_type": "number"},
                "A4": {"value": "Orange", "data_type": "text"},
                "B4": {"value": "2.49", "data_type": "number"},
                "A5": {"value": "Total", "data_type": "text"},
                "B5": {"value": "=SUM(B2:B4)", "data_type": "formula"},
            },
            "columns": 2,
            "rows": 5
        }
        
        # 2. Export to CSV
        csv_content = spreadsheet_data_to_csv(sample_data)
        
        # 3. Import back
        imported_data = csv_to_spreadsheet_data(csv_content)
        
        # 4. Verify data integrity
        assert imported_data["cells"]["A1"]["value"] == "Product"
        assert imported_data["cells"]["B1"]["value"] == "Price"
        assert imported_data["cells"]["A2"]["value"] == "Apple"
        assert imported_data["cells"]["B2"]["value"] == "1.99"
    
    def test_formula_persistence(self):
        """Test that formulas persist through import/export"""
        sample_data = {
            "cells": {
                "A1": {"value": "10", "data_type": "number"},
                "A2": {"value": "20", "data_type": "number"},
                "A3": {"value": "=SUM(A1:A2)", "data_type": "formula"},
            }
        }
        
        # Export and import
        csv_content = spreadsheet_data_to_csv(sample_data)
        imported_data = csv_to_spreadsheet_data(csv_content)
        
        # Formula should be preserved
        assert imported_data["cells"]["A3"]["value"] == "=SUM(A1:A2)"


if __name__ == "__main__":
    # Run all tests
    pytest.main([__file__, "-v"])