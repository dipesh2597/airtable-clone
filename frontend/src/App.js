import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Spreadsheet from './components/Spreadsheet';
import UserList from './components/UserList';
import UserModal from './components/UserModal';
import './App.css';

const SOCKET_URL = 'http://localhost:8000';

function App() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [spreadsheetData, setSpreadsheetData] = useState(null);
  const [showUserModal, setShowUserModal] = useState(true);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('spreadsheet_data', (data) => {
      setSpreadsheetData(data);
    });

    newSocket.on('active_users', (users) => {
      setActiveUsers(users);
    });

    newSocket.on('user_joined', (userData) => {
      setActiveUsers(prev => [...prev, userData]);
    });

    newSocket.on('user_left', (data) => {
      setActiveUsers(prev => prev.filter(u => u.user_id !== data.user_id));
    });

    return () => newSocket.close();
  }, []);

  const handleUserSubmit = (userData) => {
    const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    
    setUser({ 
      id: userId, 
      name: userData.name
    });
    
    setShowUserModal(false);

    if (socket) {
      socket.emit('join_spreadsheet', {
        user_id: userId,
        user_name: userData.name
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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="flex-1">
          <Spreadsheet 
            socket={socket}
            user={user}
            data={spreadsheetData}
            setData={setSpreadsheetData}
          />
        </div>
        <div className="w-64 bg-white border-l border-gray-200">
          <UserList users={activeUsers} currentUser={user} />
        </div>
      </div>
    </div>
  );
}

export default App; 