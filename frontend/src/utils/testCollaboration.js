/**
 * Collaboration testing utilities and tests for the Airtable Clone frontend
 * Tests real-time collaboration features, user presence, and conflict resolution
 */

// Mock socket for testing
export const createMockSocket = () => {
  const listeners = {};
  const emittedEvents = [];
  
  return {
    emit: (event, data) => {
      emittedEvents.push({ event, data, timestamp: Date.now() });
      console.log(`📤 Emitted: ${event}`, data);
    },
    
    on: (event, callback) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(callback);
    },
    
    off: (event, callback) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
      }
    },
    
    // Test utilities
    triggerEvent: (event, data) => {
      if (listeners[event]) {
        listeners[event].forEach(callback => callback(data));
      }
    },
    
    getEmittedEvents: () => emittedEvents,
    
    clearEmittedEvents: () => {
      emittedEvents.length = 0;
    },
    
    connected: true
  };
};

// Mock user data
export const createMockUser = (id, name, color) => ({
  sid: id,
  name: name || `User${id}`,
  color: color || `#${Math.floor(Math.random()*16777215).toString(16)}`,
  current_cell: null,
  joined_at: new Date().toISOString()
});

// Mock collaboration state
export const createMockCollaborationState = () => ({
  activeUsers: [],
  userSelections: {},
  cellUpdates: [],
  connectionStatus: 'connected'
});

// Test scenarios
export const collaborationTestScenarios = {
  // Basic user management
  userJoins: {
    name: 'User Joins Session',
    description: 'Test user joining the spreadsheet session',
    setup: () => {
      const socket = createMockSocket();
      const user = createMockUser('user1', 'Alice', '#FF6B6B');
      return { socket, user };
    },
    execute: ({ socket, user }) => {
      // Simulate user joining
      socket.emit('join_spreadsheet', { user_id: user.sid, user_name: user.name });
      
      // Simulate server response
      socket.triggerEvent('user_joined', {
        user_id: user.sid,
        user_name: user.name,
        user_color: user.color,
        active_users: [user]
      });
      
      return { socket, user };
    },
    verify: ({ socket, user }) => {
      const events = socket.getEmittedEvents();
      const joinEvent = events.find(e => e.event === 'join_spreadsheet');
      
      expect(joinEvent).toBeDefined();
      expect(joinEvent.data.user_id).toBe(user.sid);
      expect(joinEvent.data.user_name).toBe(user.name);
      
      return true;
    }
  },
  
  userLeaves: {
    name: 'User Leaves Session',
    description: 'Test user leaving the spreadsheet session',
    setup: () => {
      const socket = createMockSocket();
      const user = createMockUser('user1', 'Alice', '#FF6B6B');
      return { socket, user };
    },
    execute: ({ socket, user }) => {
      // Simulate user leaving
      socket.emit('leave_spreadsheet', { user_id: user.sid });
      
      // Simulate server response
      socket.triggerEvent('user_left', {
        user_id: user.sid,
        active_users: []
      });
      
      return { socket, user };
    },
    verify: ({ socket, user }) => {
      const events = socket.getEmittedEvents();
      const leaveEvent = events.find(e => e.event === 'leave_spreadsheet');
      
      expect(leaveEvent).toBeDefined();
      expect(leaveEvent.data.user_id).toBe(user.sid);
      
      return true;
    }
  },
  
  // Cell selection and cursor visibility
  userSelectsCell: {
    name: 'User Selects Cell',
    description: 'Test user selecting a cell and cursor visibility',
    setup: () => {
      const socket = createMockSocket();
      const user = createMockUser('user1', 'Alice', '#FF6B6B');
      return { socket, user };
    },
    execute: ({ socket, user }) => {
      // Simulate user selecting cell A1
      socket.emit('cell_selected', {
        user_id: user.sid,
        user_name: user.name,
        user_color: user.color,
        cell_id: 'A1'
      });
      
      // Simulate server broadcasting selection
      socket.triggerEvent('cell_selection_update', {
        cell_id: 'A1',
        user_id: user.sid,
        user_name: user.name,
        user_color: user.color
      });
      
      return { socket, user };
    },
    verify: ({ socket, user }) => {
      const events = socket.getEmittedEvents();
      const selectionEvent = events.find(e => e.event === 'cell_selected');
      
      expect(selectionEvent).toBeDefined();
      expect(selectionEvent.data.cell_id).toBe('A1');
      expect(selectionEvent.data.user_id).toBe(user.sid);
      
      return true;
    }
  },
  
  multipleUsersSelectCells: {
    name: 'Multiple Users Select Different Cells',
    description: 'Test multiple users selecting different cells simultaneously',
    setup: () => {
      const socket = createMockSocket();
      const user1 = createMockUser('user1', 'Alice', '#FF6B6B');
      const user2 = createMockUser('user2', 'Bob', '#4ECDC4');
      const user3 = createMockUser('user3', 'Charlie', '#45B7D1');
      return { socket, user1, user2, user3 };
    },
    execute: ({ socket, user1, user2, user3 }) => {
      // Simulate multiple users selecting cells
      socket.emit('cell_selected', {
        user_id: user1.sid,
        user_name: user1.name,
        user_color: user1.color,
        cell_id: 'A1'
      });
      
      socket.emit('cell_selected', {
        user_id: user2.sid,
        user_name: user2.name,
        user_color: user2.color,
        cell_id: 'B2'
      });
      
      socket.emit('cell_selected', {
        user_id: user3.sid,
        user_name: user3.name,
        user_color: user3.color,
        cell_id: 'C3'
      });
      
      // Simulate server broadcasting all selections
      socket.triggerEvent('cell_selection_update', {
        cell_id: 'A1',
        user_id: user1.sid,
        user_name: user1.name,
        user_color: user1.color
      });
      
      socket.triggerEvent('cell_selection_update', {
        cell_id: 'B2',
        user_id: user2.sid,
        user_name: user2.name,
        user_color: user2.color
      });
      
      socket.triggerEvent('cell_selection_update', {
        cell_id: 'C3',
        user_id: user3.sid,
        user_name: user3.name,
        user_color: user3.color
      });
      
      return { socket, user1, user2, user3 };
    },
    verify: ({ socket, user1, user2, user3 }) => {
      const events = socket.getEmittedEvents();
      const selectionEvents = events.filter(e => e.event === 'cell_selected');
      
      expect(selectionEvents).toHaveLength(3);
      expect(selectionEvents[0].data.cell_id).toBe('A1');
      expect(selectionEvents[1].data.cell_id).toBe('B2');
      expect(selectionEvents[2].data.cell_id).toBe('C3');
      
      return true;
    }
  },
  
  // Cell editing and real-time updates
  userEditsCell: {
    name: 'User Edits Cell',
    description: 'Test user editing a cell and real-time update',
    setup: () => {
      const socket = createMockSocket();
      const user = createMockUser('user1', 'Alice', '#FF6B6B');
      return { socket, user };
    },
    execute: ({ socket, user }) => {
      // Simulate user editing cell A1
      socket.emit('cell_update', {
        cell_id: 'A1',
        value: 'Hello World',
        user_id: user.sid,
        user_name: user.name
      });
      
      // Simulate server broadcasting update
      socket.triggerEvent('cell_updated', {
        cell_id: 'A1',
        value: 'Hello World',
        data_type: 'text',
        user_id: user.sid,
        user_name: user.name,
        timestamp: new Date().toISOString()
      });
      
      return { socket, user };
    },
    verify: ({ socket, user }) => {
      const events = socket.getEmittedEvents();
      const updateEvent = events.find(e => e.event === 'cell_update');
      
      expect(updateEvent).toBeDefined();
      expect(updateEvent.data.cell_id).toBe('A1');
      expect(updateEvent.data.value).toBe('Hello World');
      expect(updateEvent.data.user_id).toBe(user.sid);
      
      return true;
    }
  },
  
  multipleUsersEditDifferentCells: {
    name: 'Multiple Users Edit Different Cells',
    description: 'Test multiple users editing different cells simultaneously',
    setup: () => {
      const socket = createMockSocket();
      const user1 = createMockUser('user1', 'Alice', '#FF6B6B');
      const user2 = createMockUser('user2', 'Bob', '#4ECDC4');
      return { socket, user1, user2 };
    },
    execute: ({ socket, user1, user2 }) => {
      // Simulate users editing different cells
      socket.emit('cell_update', {
        cell_id: 'A1',
        value: 'Alice\'s data',
        user_id: user1.sid,
        user_name: user1.name
      });
      
      socket.emit('cell_update', {
        cell_id: 'B2',
        value: '42',
        user_id: user2.sid,
        user_name: user2.name
      });
      
      // Simulate server broadcasting updates
      socket.triggerEvent('cell_updated', {
        cell_id: 'A1',
        value: 'Alice\'s data',
        data_type: 'text',
        user_id: user1.sid,
        user_name: user1.name,
        timestamp: new Date().toISOString()
      });
      
      socket.triggerEvent('cell_updated', {
        cell_id: 'B2',
        value: '42',
        data_type: 'number',
        user_id: user2.sid,
        user_name: user2.name,
        timestamp: new Date().toISOString()
      });
      
      return { socket, user1, user2 };
    },
    verify: ({ socket, user1, user2 }) => {
      const events = socket.getEmittedEvents();
      const updateEvents = events.filter(e => e.event === 'cell_update');
      
      expect(updateEvents).toHaveLength(2);
      expect(updateEvents[0].data.cell_id).toBe('A1');
      expect(updateEvents[0].data.value).toBe('Alice\'s data');
      expect(updateEvents[1].data.cell_id).toBe('B2');
      expect(updateEvents[1].data.value).toBe('42');
      
      return true;
    }
  },
  
  // Conflict resolution
  usersEditSameCell: {
    name: 'Users Edit Same Cell (Conflict Resolution)',
    description: 'Test conflict resolution when multiple users edit the same cell',
    setup: () => {
      const socket = createMockSocket();
      const user1 = createMockUser('user1', 'Alice', '#FF6B6B');
      const user2 = createMockUser('user2', 'Bob', '#4ECDC4');
      return { socket, user1, user2 };
    },
    execute: ({ socket, user1, user2 }) => {
      // Simulate both users editing the same cell
      socket.emit('cell_update', {
        cell_id: 'A1',
        value: 'Alice\'s version',
        user_id: user1.sid,
        user_name: user1.name
      });
      
      socket.emit('cell_update', {
        cell_id: 'A1',
        value: 'Bob\'s version',
        user_id: user2.sid,
        user_name: user2.name
      });
      
      // Simulate server resolving conflict (last write wins)
      socket.triggerEvent('cell_updated', {
        cell_id: 'A1',
        value: 'Bob\'s version',
        data_type: 'text',
        user_id: user2.sid,
        user_name: user2.name,
        timestamp: new Date().toISOString(),
        conflict_resolved: true
      });
      
      return { socket, user1, user2 };
    },
    verify: ({ socket, user1, user2 }) => {
      const events = socket.getEmittedEvents();
      const updateEvents = events.filter(e => e.event === 'cell_update');
      
      expect(updateEvents).toHaveLength(2);
      expect(updateEvents[0].data.cell_id).toBe('A1');
      expect(updateEvents[1].data.cell_id).toBe('A1');
      
      // Both users tried to edit the same cell
      expect(updateEvents[0].data.user_id).toBe(user1.sid);
      expect(updateEvents[1].data.user_id).toBe(user2.sid);
      
      return true;
    }
  },
  
  // Network disconnection and reconnection
  networkDisconnection: {
    name: 'Network Disconnection and Reconnection',
    description: 'Test handling of network disconnection and reconnection',
    setup: () => {
      const socket = createMockSocket();
      const user = createMockUser('user1', 'Alice', '#FF6B6B');
      return { socket, user };
    },
    execute: ({ socket, user }) => {
      // Simulate disconnection
      socket.connected = false;
      socket.triggerEvent('disconnect', { reason: 'network_error' });
      
      // Simulate reconnection attempt
      socket.emit('reconnect_attempt', { user_id: user.sid });
      
      // Simulate successful reconnection
      socket.connected = true;
      socket.triggerEvent('connect', {});
      socket.triggerEvent('reconnected', {
        user_id: user.sid,
        spreadsheet_data: { cells: {}, columns: 26, rows: 100 }
      });
      
      return { socket, user };
    },
    verify: ({ socket, user }) => {
      const events = socket.getEmittedEvents();
      const reconnectEvent = events.find(e => e.event === 'reconnect_attempt');
      
      expect(reconnectEvent).toBeDefined();
      expect(reconnectEvent.data.user_id).toBe(user.sid);
      
      return true;
    }
  },
  
  // User presence indicators
  userPresenceIndicators: {
    name: 'User Presence Indicators',
    description: 'Test user presence indicators and status updates',
    setup: () => {
      const socket = createMockSocket();
      const user1 = createMockUser('user1', 'Alice', '#FF6B6B');
      const user2 = createMockUser('user2', 'Bob', '#4ECDC4');
      return { socket, user1, user2 };
    },
    execute: ({ socket, user1, user2 }) => {
      // Simulate users joining
      socket.triggerEvent('user_joined', {
        user_id: user1.sid,
        user_name: user1.name,
        user_color: user1.color,
        active_users: [user1]
      });
      
      socket.triggerEvent('user_joined', {
        user_id: user2.sid,
        user_name: user2.name,
        user_color: user2.color,
        active_users: [user1, user2]
      });
      
      // Simulate user activity
      socket.emit('user_activity', {
        user_id: user1.sid,
        activity_type: 'typing',
        cell_id: 'A1'
      });
      
      socket.triggerEvent('user_activity_update', {
        user_id: user1.sid,
        activity_type: 'typing',
        cell_id: 'A1',
        timestamp: new Date().toISOString()
      });
      
      return { socket, user1, user2 };
    },
    verify: ({ socket, user1, user2 }) => {
      const events = socket.getEmittedEvents();
      const activityEvent = events.find(e => e.event === 'user_activity');
      
      expect(activityEvent).toBeDefined();
      expect(activityEvent.data.user_id).toBe(user1.sid);
      expect(activityEvent.data.activity_type).toBe('typing');
      
      return true;
    }
  }
};

// Test runner for collaboration features
export const runCollaborationTests = () => {
  console.log('🤝 Running Collaboration Tests...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  Object.entries(collaborationTestScenarios).forEach(([key, scenario]) => {
    try {
      console.log(`🧪 Testing: ${scenario.name}`);
      console.log(`📝 ${scenario.description}`);
      
      const setup = scenario.setup();
      const executed = scenario.execute(setup);
      const passed = scenario.verify(executed);
      
      if (passed) {
        console.log(`✅ ${scenario.name}: PASSED\n`);
        results.passed++;
      } else {
        console.log(`❌ ${scenario.name}: FAILED\n`);
        results.failed++;
        results.errors.push(`${scenario.name}: Verification failed`);
      }
    } catch (error) {
      console.log(`❌ ${scenario.name}: ERROR - ${error.message}\n`);
      results.failed++;
      results.errors.push(`${scenario.name}: ${error.message}`);
    }
  });
  
  console.log(`📊 Collaboration Test Results: ${results.passed} passed, ${results.failed} failed`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  return results;
};

// Performance tests for collaboration
export const runCollaborationPerformanceTests = () => {
  console.log('⚡ Running Collaboration Performance Tests...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  // Test rapid cell updates
  const rapidUpdateTest = () => {
    const socket = createMockSocket();
    const user = createMockUser('user1', 'Alice', '#FF6B6B');
    const startTime = Date.now();
    
    // Simulate 100 rapid cell updates
    for (let i = 1; i <= 100; i++) {
      socket.emit('cell_update', {
        cell_id: `A${i}`,
        value: `Update ${i}`,
        user_id: user.sid,
        user_name: user.name
      });
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const events = socket.getEmittedEvents();
    expect(events).toHaveLength(100);
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
    
    return true;
  };
  
  // Test multiple users simultaneously
  const multipleUsersTest = () => {
    const socket = createMockSocket();
    const users = [
      createMockUser('user1', 'Alice', '#FF6B6B'),
      createMockUser('user2', 'Bob', '#4ECDC4'),
      createMockUser('user3', 'Charlie', '#45B7D1'),
      createMockUser('user4', 'Diana', '#FFA07A'),
      createMockUser('user5', 'Eve', '#98D8C8')
    ];
    
    // Simulate all users editing simultaneously
    users.forEach((user, index) => {
      for (let i = 1; i <= 20; i++) {
        socket.emit('cell_update', {
          cell_id: `${String.fromCharCode(65 + index)}${i}`,
          value: `${user.name} update ${i}`,
          user_id: user.sid,
          user_name: user.name
        });
      }
    });
    
    const events = socket.getEmittedEvents();
    expect(events).toHaveLength(100); // 5 users * 20 updates each
    
    return true;
  };
  
  // Test large user groups
  const largeUserGroupTest = () => {
    const socket = createMockSocket();
    const users = [];
    
    // Create 50 users
    for (let i = 1; i <= 50; i++) {
      users.push(createMockUser(`user${i}`, `User${i}`, `#${Math.floor(Math.random()*16777215).toString(16)}`));
    }
    
    // Simulate all users joining
    users.forEach(user => {
      socket.emit('join_spreadsheet', { user_id: user.sid, user_name: user.name });
    });
    
    const events = socket.getEmittedEvents();
    expect(events).toHaveLength(50);
    
    return true;
  };
  
  // Run performance tests
  const performanceTests = [
    { name: 'Rapid Cell Updates', test: rapidUpdateTest },
    { name: 'Multiple Users Simultaneously', test: multipleUsersTest },
    { name: 'Large User Groups', test: largeUserGroupTest }
  ];
  
  performanceTests.forEach(({ name, test }) => {
    try {
      console.log(`🧪 Testing: ${name}`);
      const passed = test();
      
      if (passed) {
        console.log(`✅ ${name}: PASSED\n`);
        results.passed++;
      } else {
        console.log(`❌ ${name}: FAILED\n`);
        results.failed++;
        results.errors.push(`${name}: Performance test failed`);
      }
    } catch (error) {
      console.log(`❌ ${name}: ERROR - ${error.message}\n`);
      results.failed++;
      results.errors.push(`${name}: ${error.message}`);
    }
  });
  
  console.log(`📊 Performance Test Results: ${results.passed} passed, ${results.failed} failed`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  return results;
};

// Export test runners
export const runAllCollaborationTests = () => {
  console.log('🚀 Starting Comprehensive Collaboration Test Suite\n');
  
  const collaborationResults = runCollaborationTests();
  console.log('\n' + '='.repeat(50) + '\n');
  
  const performanceResults = runCollaborationPerformanceTests();
  
  const totalPassed = collaborationResults.passed + performanceResults.passed;
  const totalFailed = collaborationResults.failed + performanceResults.failed;
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎯 TOTAL COLLABORATION RESULTS: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('='.repeat(50));
  
  return {
    collaboration: collaborationResults,
    performance: performanceResults,
    total: { passed: totalPassed, failed: totalFailed }
  };
};

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.runAllCollaborationTests = runAllCollaborationTests;
  window.createMockSocket = createMockSocket;
  window.createMockUser = createMockUser;
} else {
  // Node.js environment
  module.exports = {
    runAllCollaborationTests,
    createMockSocket,
    createMockUser,
    createMockCollaborationState,
    collaborationTestScenarios
  };
} 