import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Spreadsheet from './components/Spreadsheet';
import UserList from './components/UserList';
import UserModal from './components/UserModal';
import ResizablePanel from './components/ResizablePanel';
import DataPersistence from './components/DataPersistence';
import config from './config';
import './App.css';

// Use configuration for backend URL
const SOCKET_URL = config.wsUrl;

function App() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [spreadsheetData, setSpreadsheetData] = useState(null);
  const [showUserModal, setShowUserModal] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [userSelections, setUserSelections] = useState({});

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', () => {
      setConnectionStatus('error');
    });

    newSocket.on('spreadsheet_data', (data) => {
      setSpreadsheetData(data);
    });

    newSocket.on('spreadsheet_loaded', (data) => {
      console.log('Received spreadsheet_loaded event:', data);
      const newData = data.data || data;
      console.log('Setting spreadsheet data to:', newData);
      setSpreadsheetData(newData);
    });

    newSocket.on('active_users', (users) => {
      setActiveUsers(users);
    });

    newSocket.on('user_joined', (userData) => {
      setActiveUsers(prev => {
        // Convert user_joined data to match active_users format
        const newUser = {
          sid: userData.user_id,  // user_id contains sid from backend
          name: userData.name,
          color: userData.color,
          current_cell: null
        };
        const newUsers = [...prev, newUser];
        return newUsers;
      });
    });

    newSocket.on('user_left', (userData) => {
      setActiveUsers(prevUsers => {
        const filteredUsers = prevUsers.filter(user => user.sid !== userData.user_id);
        return filteredUsers;
      });
    });

    newSocket.on('user_selection', (data) => {
      setUserSelections(prev => ({
        ...prev,
        [data.user_id]: data
      }));
    });

    newSocket.on('user_selection_cleared', (data) => {
      setUserSelections(prev => {
        const newSelections = { ...prev };
        // Clear all selections for this user by iterating through all cells
        Object.keys(newSelections).forEach(cellId => {
          if (newSelections[cellId].user_id === data.user_id) {
            delete newSelections[cellId];
          }
        });
        return newSelections;
      });
    });

    // Handle page refresh/unload
    const handleBeforeUnload = () => {
      if (newSocket && newSocket.connected) {
        newSocket.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  const handleUserSubmit = (userData) => {
    const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    
    const user = { 
      id: userId, 
      name: userData.name
    };
    
    // Store user data in localStorage for session recovery
    localStorage.setItem('userData', JSON.stringify({
      user_id: userId,
      user_name: userData.name
    }));
    
    setUser(user);
    setShowUserModal(false);

    if (socket) {
      // Clear any existing user from the list first
      setActiveUsers(prev => prev.filter(u => u.user_id !== userId));
      
      // Disconnect any existing connection first
      if (socket.connected) {
        socket.disconnect();
      }
      
      // Reconnect and join
      socket.connect();
      socket.once('connect', () => {
        socket.emit('join_spreadsheet', {
          user_id: userId,
          user_name: userData.name
        });
      });
    }
  };

  const handleDataLoad = (newData) => {
    setSpreadsheetData(newData);
  };

  if (showUserModal) {
    return <UserModal onSubmit={handleUserSubmit} />;
  }

  if (!socket || !user || !spreadsheetData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Connecting to spreadsheet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <div className="flex-1 overflow-hidden relative">
        {/* Root container with fixed height */}
        <div className="h-screen flex flex-col pb-10">
          <DataPersistence 
            socket={socket}
            spreadsheetData={spreadsheetData}
            onDataLoad={handleDataLoad}
            showSidePanel={showSidePanel}
            onToggleSidePanel={() => setShowSidePanel(!showSidePanel)}
            activeUsers={activeUsers}
            userSelections={userSelections}
          />
          <div className="flex-1 overflow-hidden pb-16 lg:pb-0">
            <Spreadsheet 
              socket={socket}
              user={user}
              data={spreadsheetData}
              setData={setSpreadsheetData}
              userSelections={userSelections}
              setUserSelections={setUserSelections}
            />
          </div>
        </div>
      </div>
      
      {/* Side panel - responsive behavior */}
      {showSidePanel && (
        <div className="lg:hidden">
          {/* Mobile overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setShowSidePanel(false)} />
          <div className="fixed right-0 top-0 h-full w-64 max-w-[55vw] bg-white shadow-lg z-40">
            <UserList 
              users={activeUsers.filter(user => user.sid !== socket.id)}
              onClose={() => setShowSidePanel(false)}
            />
          </div>
        </div>
      )}
      
      {/* Desktop side panel */}
      <div className="hidden lg:block">
        {showSidePanel && (
          <ResizablePanel>
            <UserList 
              users={activeUsers.filter(user => user.sid !== socket.id)}
            />
          </ResizablePanel>
        )}
      </div>
      
      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200 py-1 px-4 z-40 shadow-lg">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-700">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="font-medium">Developed with ❤️ by</span>
          <span className="font-bold text-blue-700 hover:text-blue-800 transition-colors cursor-pointer bg-white px-2 py-1 rounded-md shadow-sm border border-blue-200">Dipesh</span>
        </div>
      </div>
    </div>
  );
}

export default App; 