import React from 'react';

function UserList({ users, currentUser }) {
  return (
    <div className="h-full p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Users</h3>
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.user_id || user.id}
            className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: user.color }}
            ></div>
            <span className="text-sm text-gray-700">
              {user.name}
              {user.user_id === currentUser?.id && ' (You)'}
            </span>
            {user.current_cell && (
              <span className="text-xs text-gray-500 ml-auto">
                {user.current_cell}
              </span>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Keyboard Shortcuts</h4>
        <div className="text-xs text-blue-700 space-y-1">
          <div>• Arrow keys: Navigate cells</div>
          <div>• Enter: Edit cell / Move down</div>
          <div>• Tab: Move right</div>
          <div>• Double-click: Edit cell</div>
          <div>• Escape: Cancel editing</div>
        </div>
      </div>
    </div>
  );
}

export default UserList; 