#!/bin/bash
set -e

# Change to backend directory if it exists
if [ -d "backend" ]; then
    cd backend
fi

# Start the FastAPI server
exec uvicorn main:socket_app --host 0.0.0.0 --port ${PORT:-8000} 