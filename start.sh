#!/bin/bash
set -e

echo "🚀 Starting Airtable Clone Backend..."

# Change to backend directory if it exists
if [ -d "backend" ]; then
    echo "📁 Changing to backend directory..."
    cd backend
fi

# Check if main.py exists
if [ ! -f "main.py" ]; then
    echo "❌ Error: main.py not found in current directory"
    echo "Current directory: $(pwd)"
    echo "Files in current directory:"
    ls -la
    exit 1
fi

echo "✅ Starting FastAPI server..."
echo "📊 Health check will be available at: http://localhost:${PORT:-8000}/health"

# Start the FastAPI server
exec uvicorn main:socket_app --host 0.0.0.0 --port ${PORT:-8000} --log-level info 