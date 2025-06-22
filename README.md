# Airtable Clone - Real-time Collaborative Spreadsheet

A web-based spreadsheet application with real-time collaboration features, built with React frontend and FastAPI backend.

## Features

### Core Spreadsheet
- 26 columns (A-Z) and 100 rows
- Clickable and editable cells
- Column headers and row numbers
- Keyboard navigation (arrow keys, Tab, Enter)
- Visual cell selection

### Real-time Collaboration
- Multi-user editing with live updates
- Live cursors showing other users' selections
- User presence indicators
- Real-time cell updates across all connected users
- Conflict resolution (last write wins)

### Data Management
- In-memory cell data storage
- Support for text, numbers, and dates
- Empty cell handling
- Basic data validation

### User Experience
- Responsive design
- Loading states
- Error handling
- Keyboard shortcuts documentation
- Clean, modern UI

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **python-socketio**: Real-time WebSocket communication
- **Uvicorn**: ASGI server for production deployment

### Frontend
- **React**: UI framework
- **Socket.IO-client**: Real-time communication
- **Tailwind CSS**: Utility-first CSS framework

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the server:
```bash
python start.py
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Architecture Overview

### Real-time Communication
- Uses Socket.IO for bidirectional communication
- Backend maintains in-memory state for spreadsheet data and user presence
- Frontend connects via Socket.IO-client for real-time updates

### State Management
- Backend: In-memory dictionaries for spreadsheet data and active users
- Frontend: React state with useEffect hooks for real-time synchronization

### Collaboration Features
- User sessions tracked by Socket.IO session IDs
- Cell updates broadcast to all connected users
- User presence and cursor positions synchronized in real-time

## API Endpoints

- `GET /`: Health check
- `GET /api/spreadsheet`: Get current spreadsheet data
- `GET /api/users`: Get list of active users
- `POST /api/spreadsheet/reset`: Reset spreadsheet to initial state

## Socket.IO Events

### Client to Server
- `join_spreadsheet`: User joins the spreadsheet
- `cell_update`: Update cell value
- `cell_selection`: Update user's cell selection

### Server to Client
- `spreadsheet_data`: Initial spreadsheet data
- `active_users`: List of active users
- `cell_updated`: Cell value updated by another user
- `cell_selected`: Cell selection by another user
- `user_joined`: New user joined
- `user_left`: User disconnected

## Testing Collaborative Features

1. Open the application in multiple browser tabs/windows
2. Each tab will have a different user with a unique color
3. Edit cells in one tab and see updates in real-time in other tabs
4. Navigate cells to see live cursors from other users
5. Check the user list sidebar to see active users and their current selections

## Keyboard Shortcuts

- **Arrow keys**: Navigate between cells
- **Enter**: Edit selected cell / Move down
- **Tab**: Move to next cell (right)
- **Shift + Enter**: Move up
- **Double-click**: Edit cell
- **Escape**: Cancel editing

## Future Improvements

- Formula support (SUM, AVERAGE, COUNT)
- Copy/paste functionality
- Row/column operations (add/delete)
- Cell formatting (bold, italic, colors)
- Data import/export (CSV)
- Undo/redo functionality
- Multiple sheets support
- Data persistence
- Advanced filtering and sorting

## Performance Considerations

- Efficient rendering with React's virtual DOM
- Debounced input handling for cell edits
- Minimal re-renders through proper state management
- Optimized real-time update broadcasting
- Graceful handling of network disconnections

## Known Limitations

- In-memory storage (data lost on server restart)
- Basic conflict resolution (last write wins)
- No formula support yet
- Limited cell formatting options
- No data persistence 