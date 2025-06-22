#!/bin/bash

# Airtable Clone Deployment Script
# This script helps you deploy your Airtable clone to production

set -e

echo "Airtable Clone Deployment Script"
echo "================================"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Error: Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if remote is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "Error: No remote repository found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/yourusername/your-repo-name.git"
    exit 1
fi

echo "Git repository found"
echo ""

# Push to GitHub
echo "Pushing to GitHub..."
git add .
git commit -m "Deploy to production" || echo "No changes to commit"
git push origin main || git push origin master
echo "Code pushed to GitHub"
echo ""

echo "Deployment Instructions"
echo "======================"
echo ""

echo "1. Deploy Backend (Render):"
echo "   - Go to https://render.com/"
echo "   - Sign up/Login with GitHub"
echo "   - Click 'New +' -> 'Web Service'"
echo "   - Connect your GitHub repository"
echo "   - Configure:"
echo "     Name: airtable-clone-backend"
echo "     Root Directory: backend"
echo "     Build Command: pip install -r requirements.txt"
echo "     Start Command: python main.py"
echo "     Environment: Python 3"
echo "   - Click 'Create Web Service'"
echo "   - Wait for deployment and copy the URL"
echo ""

echo "2. Deploy Frontend (Vercel):"
echo "   - Go to https://vercel.com/"
echo "   - Sign up/Login with GitHub"
echo "   - Click 'New Project'"
echo "   - Import your GitHub repository"
echo "   - Configure:"
echo "     Root Directory: frontend"
echo "     Framework Preset: Create React App"
echo "   - Add Environment Variables:"
echo "     REACT_APP_BACKEND_URL=https://airtable-clone-backend.onrender.com"
echo "     REACT_APP_WS_URL=wss://airtable-clone-backend.onrender.com"
echo "   - Click 'Deploy'"
echo ""

echo "3. Test Your Deployment:"
echo "   - Backend health check: https://airtable-clone-backend.onrender.com/health"
echo "   - Frontend: https://your-frontend-url.vercel.app"
echo ""

echo "4. Update Configuration (if needed):"
echo "   - If you need to change backend URL, update:"
echo "     - frontend/src/config.js"
echo "     - frontend/vercel.json"
echo "     - Environment variables in Vercel"
echo ""

echo "Deployment Complete!"
echo ""
echo "Your Airtable clone is now live at:"
echo "Frontend: https://your-frontend-url.vercel.app"
echo "Backend: https://airtable-clone-backend.onrender.com"
echo ""
echo "Both services will automatically redeploy when you push to your main branch." 