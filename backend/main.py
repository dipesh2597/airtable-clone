from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import socketio
import uvicorn
from typing import Dict, List, Any
import json
import uuid
from datetime import datetime

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

available_colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E',
    '#8B5A2B', '#4F46E5', '#059669', '#DC2626'
]

def get_available_color():
    for color in available_colors:
        if color not in used_colors:
            return color
    return f'#{format(hash(str(uuid.uuid4())) % 0xFFFFFF, "06x")}'

def release_color(color):
    if color in used_colors:
        used_colors.remove(color)

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
    """Handle client connection"""
    print(f"Client connected: {sid}")
    await sio.emit('user_connected', {'sid': sid}, room=sid)

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"Client disconnected: {sid}")
    
    if sid in user_sessions:
        user_id = user_sessions[sid]
        if user_id in active_users:
            user_color = active_users[user_id]['color']
            release_color(user_color)
            print(f"User {active_users[user_id]['name']} left, released color {user_color}")
            del active_users[user_id]
        del user_sessions[sid]
        
        await sio.emit('user_left', {'user_id': user_id}, skip_sid=sid)

@sio.event
async def join_spreadsheet(sid, data):
    """Handle user joining the spreadsheet"""
    user_id = data.get('user_id', str(uuid.uuid4()))
    user_name = data.get('user_name', f'User {user_id[:8]}')
    
    user_color = get_available_color()
    used_colors.add(user_color)
    
    # Store user session
    user_sessions[sid] = user_id
    
    # Add to active users
    active_users[user_id] = {
        'name': user_name,
        'color': user_color,
        'sid': sid,
        'current_cell': None
    }
    
    # Send current spreadsheet data to the new user
    await sio.emit('spreadsheet_data', spreadsheet_data, room=sid)
    
    # Send active users list to the new user
    await sio.emit('active_users', list(active_users.values()), room=sid)
    
    # Broadcast new user joined to others
    await sio.emit('user_joined', {
        'user_id': user_id,
        'name': user_name,
        'color': user_color
    }, skip_sid=sid)

@sio.event
async def cell_update(sid, data):
    """Handle cell value updates"""
    cell_id = data.get('cell_id')
    value = data.get('value')
    user_id = user_sessions.get(sid)
    
    if not cell_id or user_id not in active_users:
        return
    
    # Update spreadsheet data
    spreadsheet_data['cells'][cell_id] = {
        'value': value,
        'last_modified_by': user_id,
        'last_modified_at': datetime.now().isoformat()
    }
    
    # Broadcast update to all other users
    await sio.emit('cell_updated', {
        'cell_id': cell_id,
        'value': value,
        'user_id': user_id
    }, skip_sid=sid)

@sio.event
async def cell_selection(sid, data):
    """Handle cell selection updates"""
    cell_id = data.get('cell_id')
    user_id = user_sessions.get(sid)
    
    if user_id not in active_users:
        return
    
    # Update user's current cell
    active_users[user_id]['current_cell'] = cell_id
    
    # Broadcast selection to other users
    await sio.emit('cell_selected', {
        'cell_id': cell_id,
        'user_id': user_id,
        'user_name': active_users[user_id]['name'],
        'user_color': active_users[user_id]['color']
    }, skip_sid=sid)

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
    uvicorn.run(
        "main:socket_app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 