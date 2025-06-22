import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Spreadsheet from './components/Spreadsheet';
import UserList from './components/UserList';
import UserModal from './components/UserModal';
import ResizablePanel from './components/ResizablePanel';
import './App.css';

const SOCKET_URL = 'http://localhost:8000';

function App() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [spreadsheetData, setSpreadsheetData] = useState(null);
  const [showUserModal, setShowUserModal] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [userSelections, setUserSelections] = useState({});
  const [showTooltip, setShowTooltip] = useState(false);

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

    newSocket.on('active_users', (users) => {
      console.log('Received active_users update:', users);
      setActiveUsers(users);
    });

    newSocket.on('user_joined', (userData) => {
      console.log('User joined:', userData);
      setActiveUsers(prev => {
        // Convert user_joined data to match active_users format
        const newUser = {
          sid: userData.user_id,  // user_id contains sid from backend
          name: userData.name,
          color: userData.color,
          current_cell: null
        };
        const newUsers = [...prev, newUser];
        console.log('Updated user list after join:', newUsers);
        return newUsers;
      });
    });

    newSocket.on('user_left', (userData) => {
      console.log('User left - removing from list:', userData);
      console.log('Current active users before removal:', activeUsers);
      setActiveUsers(prevUsers => {
        const filteredUsers = prevUsers.filter(user => user.sid !== userData.user_id);
        console.log('Updated user list after user left:', filteredUsers);
        return filteredUsers;
      });
    });

    newSocket.on('user_selection', (data) => {
      console.log('Received user selection:', data);
      setUserSelections(prev => ({
        ...prev,
        [data.user_id]: data
      }));
    });

    newSocket.on('user_selection_cleared', (data) => {
      console.log('User left - clearing their selection:', data);
      setUserSelections(prev => {
        const newSelections = { ...prev };
        delete newSelections[data.user_id];
        console.log('Updated user selections after user left:', newSelections);
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
    
    setUser({ 
      id: userId, 
      name: userData.name
    });
    
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
        <Spreadsheet 
          socket={socket}
          user={user}
          data={spreadsheetData}
          setData={setSpreadsheetData}
          userSelections={userSelections}
          setUserSelections={setUserSelections}
        />
        
        {/* Toggle button for side panel - always visible */}
        <div className="relative">
          <button
            onClick={() => setShowSidePanel(!showSidePanel)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="fixed top-4 right-4 z-50 bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transform hover:scale-105"
          >
            {showSidePanel ? (
              <svg className="w-5 h-5 text-gray-600 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )}
          </button>
          
          {/* Custom tooltip */}
          {showTooltip && (
            <div className="fixed top-12 right-4 z-50 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-xs">
              <div className="flex items-center space-x-2">
                {showSidePanel ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Hide Users Panel</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Show Users Panel ({activeUsers.filter(user => user.sid !== socket.id).length} online)</span>
                  </>
                )}
              </div>
              <div className="text-xs text-gray-300 mt-1">
                {showSidePanel ? "Click to hide the users panel" : "Click to show who's currently editing"}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Side panel - responsive behavior */}
      {showSidePanel && (
        <div className="lg:hidden">
          {/* Mobile overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setShowSidePanel(false)} />
          <div className="fixed right-0 top-0 h-full w-80 max-w-[80vw] bg-white shadow-lg z-40">
            <UserList 
              users={activeUsers.filter(user => user.sid !== socket.id)} 
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
    </div>
  );
}

export default App; 