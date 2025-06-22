#!/bin/bash

# 🚀 Airtable Clone Deployment Script
# This script helps automate the deployment process

set -e  # Exit on any error

echo "🚀 Starting Airtable Clone Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_status "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
    print_success "Git repository initialized"
else
    print_status "Git repository already exists"
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    print_warning "No remote origin found. Please add your GitHub repository:"
    echo "git remote add origin https://github.com/yourusername/airtable-clone.git"
    echo "git push -u origin main"
else
    print_status "Remote origin found"
fi

# Check if backend dependencies are installed
if [ ! -d "backend/venv" ]; then
    print_status "Setting up backend virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    print_success "Backend dependencies installed"
else
    print_status "Backend virtual environment already exists"
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed"
else
    print_status "Frontend dependencies already installed"
fi

# Test backend locally
print_status "Testing backend locally..."
cd backend
source venv/bin/activate
python -c "import fastapi, socketio, uvicorn; print('Backend dependencies OK')" || {
    print_error "Backend dependencies test failed"
    exit 1
}
cd ..

# Test frontend build
print_status "Testing frontend build..."
cd frontend
npm run build || {
    print_error "Frontend build failed"
    exit 1
}
cd ..

print_success "Local tests passed!"

echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for deployment'"
echo "   git push origin main"
echo ""
echo "2. Deploy Backend (Railway):"
echo "   - Go to https://railway.app/"
echo "   - Create new project from GitHub repo"
echo "   - Select 'backend' directory"
echo "   - Copy the generated URL"
echo ""
echo "3. Deploy Frontend (Vercel):"
echo "   - Go to https://vercel.com/"
echo "   - Import GitHub repository"
echo "   - Set root directory to 'frontend'"
echo "   - Add environment variables:"
echo "     REACT_APP_BACKEND_URL=https://your-backend-url.railway.app"
echo "     REACT_APP_WS_URL=wss://your-backend-url.railway.app"
echo ""
echo "4. Update configuration files with your actual backend URL"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo ""
print_success "Deployment preparation complete! 🚀" 