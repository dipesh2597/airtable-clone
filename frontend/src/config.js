// Configuration for different environments
const config = {
  development: {
    backendUrl: 'http://localhost:8000',
    wsUrl: 'ws://localhost:8000'
  },
  production: {
    backendUrl: process.env.REACT_APP_BACKEND_URL || 'https://airtable-clone-backend.onrender.com',
    wsUrl: process.env.REACT_APP_WS_URL || 'wss://airtable-clone-backend.onrender.com'
  }
};

// Get current environment
const environment = process.env.NODE_ENV || 'development';

// Export the appropriate config
export default config[environment]; 