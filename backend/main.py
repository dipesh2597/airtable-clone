from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import socketio
import uvicorn
from typing import Dict, List, Any
import json
import uuid
from datetime import datetime
import re
from validation import validate_value, detect_data_type

# Initialize FastAPI app
app = FastAPI(title="Airtable Clone API", version="1.0.0")

# Initialize Socket.IO
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins="*"
)

# Create ASGI app
socket_app = socketio.ASGIApp(sio, app)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for spreadsheet data and user presence
spreadsheet_data: Dict[str, Any] = {}
active_users: Dict[str, Dict] = {}
user_sessions: Dict[str, str] = {}  # session_id -> user_id
used_colors: set = set()

def get_next_color():
    """Get the next available color, excluding blue colors for focus mode"""
    colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
        '#F9E79F', '#ABEBC6', '#FAD7A0', '#D5A6BD', '#A9CCE3'
    ]
    
    used_colors_set = {user['color'] for user in active_users.values()}
    available_colors = [color for color in colors if color not in used_colors_set]
    
    if not available_colors:
        # If all colors are used, start over
        return colors[0]
    
    return available_colors[0]

def release_color(color):
    """Release a color back to the pool (no longer needed with new system)"""
    # Colors are now managed dynamically based on active users
    pass

# Initialize default spreadsheet data (26 columns A-Z, 100 rows)
def initialize_spreadsheet():
    global spreadsheet_data
    spreadsheet_data = {
        "cells": {},
        "columns": 26,  # A-Z
        "rows": 100,
        "metadata": {
            "title": "Untitled Spreadsheet",
            "created_at": datetime.now().isoformat(),
            "last_modified": datetime.now().isoformat()
        }
    }

# Initialize spreadsheet on startup
initialize_spreadsheet()

# Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    """Handle user connection"""
    print(f"User connected: {sid}")
    await sio.emit('user_connected', {'sid': sid}, room=sid)

@sio.event
async def disconnect(sid):
    """Handle user disconnection"""
    print(f"User disconnected: {sid}")
    
    if sid in user_sessions:
        user_id = user_sessions[sid]
        if user_id in active_users:
            user_color = active_users[user_id]['color']
            user_name = active_users[user_id]['name']
            release_color(user_color)
            print(f"User {user_name} left, released color {user_color}")
            
            # Send the complete user object for proper frontend handling
            user_data = {
                'user_id': sid,  # Send sid instead of user_id for proper frontend matching
                'name': user_name,
                'color': user_color
            }
            
            print(f"DEBUG: Sending user_left event with user_id={sid} (sid), user_id_internal={user_id}")
            
            del active_users[user_id]
        del user_sessions[sid]
        
        # Broadcast user left to all remaining users
        await sio.emit('user_left', user_data)
        await sio.emit('user_selection_cleared', {'user_id': user_id})  # Send actual user_id, not sid
        print(f"Broadcasted user_left for {user_id}")

@sio.event
async def join_spreadsheet(sid, data):
    user_id = data.get('user_id', str(uuid.uuid4()))
    user_name = data.get('user_name', f'User {user_id[:8]}')
    
    # Check if this user_id already exists and remove old session
    for existing_sid, existing_user_id in user_sessions.items():
        if existing_user_id == user_id and existing_sid != sid:
            print(f"Removing duplicate user session: {existing_user_id}")
            if existing_user_id in active_users:
                old_color = active_users[existing_user_id]['color']
                release_color(old_color)
                del active_users[existing_user_id]
            del user_sessions[existing_sid]
            await sio.emit('user_left', {'user_id': existing_sid})  # Send sid instead of user_id
            await sio.emit('user_selection_cleared', {'user_id': existing_user_id})  # Send actual user_id
    
    user_color = get_next_color()
    
    user_sessions[sid] = user_id
    
    active_users[user_id] = {
        'name': user_name,
        'color': user_color,
        'sid': sid,
        'current_cell': None
    }
    
    print(f"User {user_name} joined with color {user_color}")
    
    await sio.emit('spreadsheet_data', spreadsheet_data, room=sid)
    await sio.emit('active_users', list(active_users.values()), room=sid)
    
    await sio.emit('user_joined', {
        'user_id': sid,  # Send sid instead of user_id for consistency
        'name': user_name,
        'color': user_color
    }, skip_sid=sid)

@sio.event
async def cell_update(sid, data):
    """Handle cell value updates with validation"""
    cell_id = data.get('cell_id')
    value = data.get('value')
    user_id = user_sessions.get(sid)
    
    if not cell_id or user_id not in active_users:
        print(f"Invalid cell_update: cell_id={cell_id}, user_id={user_id}")
        return
    
    user_name = active_users[user_id]['name']
    print(f"Cell update from {user_name} ({user_id}): {cell_id} = '{value}'")
    
    # Validate the value
    validation_result = validate_value(value)
    
    # Update spreadsheet data with validation info
    spreadsheet_data['cells'][cell_id] = {
        'value': validation_result['formatted_value'],
        'original_value': value,  # Keep original input
        'data_type': validation_result['detected_type'],
        'is_valid': validation_result['is_valid'],
        'validation_errors': validation_result['errors'],
        'last_modified_by': user_id,
        'last_modified_at': datetime.now().isoformat()
    }
    
    print(f"Validation result: type={validation_result['detected_type']}, valid={validation_result['is_valid']}")
    if not validation_result['is_valid']:
        print(f"Validation errors: {validation_result['errors']}")
    
    print(f"Broadcasting cell_updated to all other users: {cell_id} = '{validation_result['formatted_value']}'")
    # Broadcast update to all other users with validation info
    await sio.emit('cell_updated', {
        'cell_id': cell_id,
        'value': validation_result['formatted_value'],
        'original_value': value,
        'data_type': validation_result['detected_type'],
        'is_valid': validation_result['is_valid'],
        'validation_errors': validation_result['errors'],
        'user_id': user_id
    }, skip_sid=sid)

@sio.event
async def cell_selection(sid, data):
    """Handle cell selection updates"""
    cell_id = data.get('cell_id')
    user_id = user_sessions.get(sid)
    
    if user_id not in active_users:
        print(f"Invalid cell_selection: user_id={user_id} not in active_users")
        return
    
    user_name = active_users[user_id]['name']
    print(f"Cell selection from {user_name} ({user_id}): {cell_id}")
    
    # Parse cell coordinates from cell_id (e.g., "A1" -> row=0, col=0)
    col = 0
    row = 0
    if cell_id:
        col_match = re.match(r'^([A-Z]+)', cell_id)
        row_match = re.match(r'[A-Z]+(\d+)$', cell_id)
        if col_match and row_match:
            col_str = col_match.group(1)
            col = sum((ord(c) - ord('A') + 1) * (26 ** i) for i, c in enumerate(reversed(col_str))) - 1
            row = int(row_match.group(1)) - 1
    
    # Update user's current cell
    active_users[user_id]['current_cell'] = cell_id
    
    print(f"Broadcasting cell_selected to other users: {user_name} selected {cell_id}")
    # Broadcast selection to other users
    await sio.emit('cell_selected', {
        'cell_id': cell_id,
        'user_id': user_id,
        'user_name': active_users[user_id]['name'],
        'user_color': active_users[user_id]['color']
    }, skip_sid=sid)
    
    # Also emit user_selection event for user list updates
    await sio.emit('user_selection', {
        'user_id': user_id,
        'cell': {
            'row': row,
            'col': col
        }
    }, skip_sid=sid)

@sio.event
async def row_operation(sid, data):
    """Handle row insert/delete operations"""
    operation_type = data.get('type')  # 'insert' or 'delete'
    row_index = data.get('index')
    user_id = user_sessions.get(sid)
    
    if user_id not in active_users:
        print(f"Invalid row_operation: user_id={user_id} not in active_users")
        return
    
    user_name = active_users[user_id]['name']
    print(f"Row operation from {user_name} ({user_id}): {operation_type} at index {row_index}")
    
    if operation_type == 'insert':
        # Shift all cells down that are at or after the insert index
        new_cells = {}
        for cell_id, cell_data in spreadsheet_data['cells'].items():
            # Parse cell coordinates
            col_match = re.match(r'^([A-Z]+)', cell_id)
            row_match = re.search(r'(\d+)$', cell_id)
            if col_match and row_match:
                col = col_match.group(1)
                row = int(row_match.group(1)) - 1  # Convert to 0-based
                
                if row >= row_index:
                    # Shift this cell down by one row
                    new_cell_id = f"{col}{row + 2}"  # +2 because we convert back to 1-based and add 1
                    new_cells[new_cell_id] = cell_data
                else:
                    # Keep this cell in the same position
                    new_cells[cell_id] = cell_data
        
        spreadsheet_data['cells'] = new_cells
        
    elif operation_type == 'delete':
        # Remove all cells in the row and shift others up
        new_cells = {}
        for cell_id, cell_data in spreadsheet_data['cells'].items():
            # Parse cell coordinates
            col_match = re.match(r'^([A-Z]+)', cell_id)
            row_match = re.search(r'(\d+)$', cell_id)
            if col_match and row_match:
                col = col_match.group(1)
                row = int(row_match.group(1)) - 1  # Convert to 0-based
                
                if row == row_index:
                    # Delete this cell (don't add to new_cells)
                    continue
                elif row > row_index:
                    # Shift this cell up by one row
                    new_cell_id = f"{col}{row}"  # row is already 0-based, so this becomes row-1+1
                    new_cells[new_cell_id] = cell_data
                else:
                    # Keep this cell in the same position
                    new_cells[cell_id] = cell_data
        
        spreadsheet_data['cells'] = new_cells
    
    # Broadcast operation to all other users
    await sio.emit('row_operation_applied', {
        'type': operation_type,
        'index': row_index,
        'user_id': user_id,
        'cells': spreadsheet_data['cells']
    }, skip_sid=sid)

@sio.event
async def column_operation(sid, data):
    """Handle column insert/delete operations"""
    operation_type = data.get('type')  # 'insert' or 'delete'
    col_index = data.get('index')
    user_id = user_sessions.get(sid)
    
    if user_id not in active_users:
        print(f"Invalid column_operation: user_id={user_id} not in active_users")
        return
    
    user_name = active_users[user_id]['name']
    print(f"Column operation from {user_name} ({user_id}): {operation_type} at index {col_index}")
    
    def col_index_to_letter(index):
        """Convert column index to letter (0=A, 1=B, etc.)"""
        return chr(65 + index)
    
    def letter_to_col_index(letter):
        """Convert column letter to index (A=0, B=1, etc.)"""
        return ord(letter) - 65
    
    if operation_type == 'insert':
        # Shift all cells right that are at or after the insert index
        new_cells = {}
        for cell_id, cell_data in spreadsheet_data['cells'].items():
            # Parse cell coordinates
            col_match = re.match(r'^([A-Z]+)', cell_id)
            row_match = re.search(r'(\d+)$', cell_id)
            if col_match and row_match:
                col_letter = col_match.group(1)
                row = row_match.group(1)
                col = letter_to_col_index(col_letter)
                
                if col >= col_index:
                    # Shift this cell right by one column
                    new_col_letter = col_index_to_letter(col + 1)
                    new_cell_id = f"{new_col_letter}{row}"
                    new_cells[new_cell_id] = cell_data
                else:
                    # Keep this cell in the same position
                    new_cells[cell_id] = cell_data
        
        spreadsheet_data['cells'] = new_cells
        
    elif operation_type == 'delete':
        # Remove all cells in the column and shift others left
        new_cells = {}
        for cell_id, cell_data in spreadsheet_data['cells'].items():
            # Parse cell coordinates
            col_match = re.match(r'^([A-Z]+)', cell_id)
            row_match = re.search(r'(\d+)$', cell_id)
            if col_match and row_match:
                col_letter = col_match.group(1)
                row = row_match.group(1)
                col = letter_to_col_index(col_letter)
                
                if col == col_index:
                    # Delete this cell (don't add to new_cells)
                    continue
                elif col > col_index:
                    # Shift this cell left by one column
                    new_col_letter = col_index_to_letter(col - 1)
                    new_cell_id = f"{new_col_letter}{row}"
                    new_cells[new_cell_id] = cell_data
                else:
                    # Keep this cell in the same position
                    new_cells[cell_id] = cell_data
        
        spreadsheet_data['cells'] = new_cells
    
    # Broadcast operation to all other users
    await sio.emit('column_operation_applied', {
        'type': operation_type,
        'index': col_index,
        'user_id': user_id,
        'cells': spreadsheet_data['cells']
    }, skip_sid=sid)

@sio.event
async def sort_operation(sid, data):
    """Handle column sorting operations"""
    column = data.get('column')
    direction = data.get('direction')  # 'asc', 'desc', or None for clear
    user_id = user_sessions.get(sid)
    
    if user_id not in active_users:
        return
    
    # Handle clear sort operation
    if column is None or direction is None:
        # For clear sort, we don't need to do anything to the data
        # Just broadcast the clear sort state
        await sio.emit('sort_applied', {
            'column': None,
            'direction': None,
            'user_id': user_id,
            'cells': spreadsheet_data['cells']
        })
        return
    
    if direction not in ['asc', 'desc']:
        return
    
    user_name = active_users[user_id]['name']
    print(f"Sort operation from {user_name}: column {column} {direction}")
    
    # Get all rows with data in the sorted column
    rows_with_data = []
    
    for row_index in range(spreadsheet_data['rows']):
        cell_id = f"{chr(65 + column)}{row_index + 1}"
        cell_data = spreadsheet_data['cells'].get(cell_id)
        cell_value = cell_data['value'] if cell_data else ''
        
        if cell_value.strip():
            row_data = {
                'row_index': row_index,
                'sort_value': cell_value,
                'cells': {}
            }
            
            # Collect all cell data for this row
            for col_index in range(spreadsheet_data['columns']):
                row_cell_id = f"{chr(65 + col_index)}{row_index + 1}"
                if row_cell_id in spreadsheet_data['cells']:
                    row_data['cells'][row_cell_id] = spreadsheet_data['cells'][row_cell_id]
            
            rows_with_data.append(row_data)
    
    # Sort the rows
    def sort_key(row):
        value = row['sort_value'].strip()
        
        # Try to parse as number first
        try:
            return (0, float(value))  # Numbers sort first
        except ValueError:
            return (1, value.lower())  # Then strings (case insensitive)
    
    rows_with_data.sort(key=sort_key, reverse=(direction == 'desc'))
    
    # Create new cell data with sorted rows
    new_cells = {}
    
    # First, copy all cells that are not in rows with data
    for cell_id, cell_data in spreadsheet_data['cells'].items():
        # Parse cell ID to get row index
        match = re.match(r'([A-Z]+)(\d+)', cell_id)
        if match:
            row_index = int(match.group(2)) - 1
            has_data_in_sort_column = any(row['row_index'] == row_index for row in rows_with_data)
            if not has_data_in_sort_column:
                new_cells[cell_id] = cell_data
    
    # Then place the sorted rows
    for new_row_index, row_data in enumerate(rows_with_data):
        for old_cell_id, cell_data in row_data['cells'].items():
            # Parse old cell ID to get column
            match = re.match(r'([A-Z]+)(\d+)', old_cell_id)
            if match:
                col_letter = match.group(1)
                new_cell_id = f"{col_letter}{new_row_index + 1}"
                new_cells[new_cell_id] = cell_data
    
    # Update spreadsheet data
    spreadsheet_data['cells'] = new_cells
    spreadsheet_data['metadata']['last_modified'] = datetime.now().isoformat()
    
    # Broadcast the sorted data to all users
    await sio.emit('sort_applied', {
        'column': column,
        'direction': direction,
        'user_id': user_id,
        'cells': new_cells
    })

# HTTP endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Airtable Clone API", "status": "running"}

@app.get("/api/spreadsheet")
async def get_spreadsheet():
    """Get current spreadsheet data"""
    return spreadsheet_data

@app.get("/api/users")
async def get_active_users():
    """Get list of active users"""
    return list(active_users.values())

@app.post("/api/spreadsheet/reset")
async def reset_spreadsheet():
    """Reset spreadsheet to initial state"""
    initialize_spreadsheet()
    await sio.emit('spreadsheet_reset', spreadsheet_data)
    return {"message": "Spreadsheet reset successfully"} 

if __name__ == "__main__":
    uvicorn.run("main:socket_app", host="0.0.0.0", port=8000, reload=True)