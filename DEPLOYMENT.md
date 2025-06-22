# 🚀 Deployment Guide - Airtable Clone

This guide will walk you through deploying your Airtable clone to production using modern cloud platforms.

## 📋 Prerequisites

- GitHub account
- Railway account (for backend) - [Sign up here](https://railway.app/)
- Vercel account (for frontend) - [Sign up here](https://vercel.com/)
- Git installed locally

## 🎯 Deployment Strategy

We'll deploy:
- **Backend (FastAPI)**: Railway (recommended) or Render
- **Frontend (React)**: Vercel (recommended) or Netlify

## 🚀 Step 1: Prepare Your Repository

### 1.1 Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for deployment"

# Create a new repository on GitHub and push
git remote add origin https://github.com/yourusername/airtable-clone.git
git push -u origin main
```

### 1.2 Update Configuration Files

The deployment files have been created for you:
- `frontend/vercel.json` - Vercel configuration
- `frontend/netlify.toml` - Netlify configuration  
- `backend/railway.json` - Railway configuration
- `backend/Procfile` - Heroku configuration
- `frontend/src/config.js` - Environment configuration

## 🏗️ Step 2: Deploy Backend (FastAPI)

### Option A: Railway (Recommended)

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app/)
   - Sign up with GitHub

2. **Deploy Backend**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `backend` directory
   - Railway will automatically detect it's a Python project

3. **Configure Environment Variables**
   - In your Railway project dashboard, go to "Variables"
   - Add any environment variables if needed

4. **Get Your Backend URL**
   - Railway will provide a URL like: `https://your-app-name.railway.app`
   - Copy this URL for the next step

### Option B: Render

1. **Sign up for Render**
   - Go to [render.com](https://render.com/)
   - Sign up with GitHub

2. **Deploy Backend**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `uvicorn main:socket_app --host 0.0.0.0 --port $PORT`

### Option C: Heroku

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew install heroku/brew/heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Deploy to Heroku**
   ```bash
   cd backend
   heroku create your-app-name
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

## 🎨 Step 3: Deploy Frontend (React)

### Option A: Vercel (Recommended)

1. **Sign up for Vercel**
   - Go to [vercel.com](https://vercel.com/)
   - Sign up with GitHub

2. **Deploy Frontend**
   - Click "New Project"
   - Import your GitHub repository
   - Set root directory to `frontend`
   - Vercel will auto-detect it's a React app

3. **Configure Environment Variables**
   - In your Vercel project dashboard, go to "Settings" → "Environment Variables"
   - Add:
     ```
     REACT_APP_BACKEND_URL=https://your-backend-url.railway.app
     REACT_APP_WS_URL=wss://your-backend-url.railway.app
     ```

4. **Update Vercel Configuration**
   - Edit `frontend/vercel.json`
   - Replace `your-backend-url.railway.app` with your actual backend URL

### Option B: Netlify

1. **Sign up for Netlify**
   - Go to [netlify.com](https://netlify.com/)
   - Sign up with GitHub

2. **Deploy Frontend**
   - Click "New site from Git"
   - Choose your repository
   - Set build command: `cd frontend && npm run build`
   - Set publish directory: `frontend/build`

3. **Configure Environment Variables**
   - Go to "Site settings" → "Environment variables"
   - Add the same variables as Vercel

4. **Update Netlify Configuration**
   - Edit `frontend/netlify.toml`
   - Replace `your-backend-url.railway.app` with your actual backend URL

## 🔧 Step 4: Update Configuration

### Update Backend URL References

1. **In `frontend/src/config.js`**:
   ```javascript
   production: {
     backendUrl: 'https://your-actual-backend-url.railway.app',
     wsUrl: 'wss://your-actual-backend-url.railway.app'
   }
   ```

2. **In `frontend/vercel.json`** (if using Vercel):
   ```json
   "destination": "https://your-actual-backend-url.railway.app/api/$1"
   ```

3. **In `frontend/netlify.toml`** (if using Netlify):
   ```toml
   to = "https://your-actual-backend-url.railway.app/api/:splat"
   ```

## 🧪 Step 5: Test Your Deployment

1. **Test Backend API**
   ```bash
   curl https://your-backend-url.railway.app/
   # Should return: {"message": "Airtable Clone API is running!"}
   ```

2. **Test Frontend**
   - Visit your frontend URL
   - Try creating a spreadsheet
   - Test real-time collaboration

3. **Test WebSocket Connection**
   - Open browser dev tools
   - Check for WebSocket connection errors
   - Verify real-time updates work

## 🔄 Step 6: Continuous Deployment

### Automatic Deployments

Both Vercel and Railway will automatically redeploy when you push to your main branch:

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Your changes will automatically deploy!
```

## 🛠️ Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure your backend CORS settings allow your frontend domain
   - Check the `allow_origins` in `backend/main.py`

2. **WebSocket Connection Issues**
   - Verify the WebSocket URL uses `wss://` (secure) in production
   - Check that your backend supports WebSocket upgrades

3. **Environment Variables**
   - Double-check all environment variables are set correctly
   - Ensure variable names match what your code expects

4. **Build Failures**
   - Check the build logs in your deployment platform
   - Ensure all dependencies are in `package.json` and `requirements.txt`

### Debug Commands

```bash
# Test backend locally
cd backend
python main.py

# Test frontend locally
cd frontend
npm start

# Check if ports are available
lsof -i :8000  # Backend
lsof -i :3000  # Frontend
```

## 📊 Monitoring & Analytics

### Railway Dashboard
- Monitor backend performance
- View logs and errors
- Check resource usage

### Vercel Analytics
- Track frontend performance
- Monitor user interactions
- View deployment status

## 🔒 Security Considerations

1. **Environment Variables**
   - Never commit sensitive data to Git
   - Use platform-specific secret management

2. **CORS Configuration**
   - In production, restrict CORS to your frontend domain only
   - Update `allow_origins` in `backend/main.py`

3. **Rate Limiting**
   - Consider adding rate limiting for API endpoints
   - Monitor for abuse

## 🎉 Success!

Your Airtable clone is now live! Share your URLs:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.railway.app`

## 📈 Next Steps

1. **Add Custom Domain**
   - Configure custom domain in Vercel/Railway
   - Update DNS settings

2. **Add Monitoring**
   - Set up error tracking (Sentry)
   - Add performance monitoring

3. **Scale Up**
   - Add database for persistent storage
   - Implement user authentication
   - Add more collaboration features

## 🆘 Need Help?

- **Railway Docs**: https://docs.railway.app/
- **Vercel Docs**: https://vercel.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://reactjs.org/docs/

---

**Happy Deploying! 🚀** 