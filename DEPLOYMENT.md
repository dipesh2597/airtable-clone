# Complete Deployment Guide

## Prerequisites
- GitHub account
- Render account (for backend) - [Sign up here](https://render.com/)
- Vercel account (for frontend) - [Sign up here](https://vercel.com/)

## Architecture Overview
- **Frontend (React)**: Vercel (recommended) or Netlify
- **Backend (FastAPI)**: Render (recommended)

## Project Structure
```
AirtableClone/
├── frontend/          # React application
├── backend/           # FastAPI application
├── Dockerfile         # Container configuration
├── .dockerignore      # Docker ignore rules
└── deploy.sh          # Deployment automation script
```

## Step-by-Step Deployment

### Backend Deployment (Render)

#### 1. **Sign up for Render**
- Go to [render.com](https://render.com/)
- Sign up with your GitHub account
- Verify your email address

#### 2. **Deploy the Backend**
- In your Render dashboard, click "New +" -> "Web Service"
- Connect your GitHub repository
- Configure the service:
  - **Name**: `airtable-clone-backend`
  - **Root Directory**: `backend`
  - **Environment**: Python 3
  - **Build Command**: `pip install -r requirements.txt`
  - **Start Command**: `python main.py`
  - **Plan**: Free

- Click "Create Web Service"
- Render will automatically detect it's a Python project
- Wait for the build to complete (usually 2-3 minutes)

#### 3. **Get your Backend URL**
- In your Render project dashboard, go to "Settings"
- Copy the "Service URL" - it will look like: `https://airtable-clone-backend.onrender.com`
- Test the health endpoint: `https://airtable-clone-backend.onrender.com/health`

### Frontend Deployment (Vercel)

#### 1. **Sign up for Vercel**
- Go to [vercel.com](https://vercel.com/)
- Sign up with your GitHub account

#### 2. **Deploy the Frontend**
- Click "New Project"
- Import your GitHub repository
- Configure the project:
  - **Framework Preset**: Create React App
  - **Root Directory**: `frontend`
  - **Build Command**: `npm run build`
  - **Output Directory**: `build`

#### 3. **Configure Environment Variables**
- In your Vercel project settings, go to "Environment Variables"
- Add the following variables:
```
REACT_APP_BACKEND_URL=https://airtable-clone-backend.onrender.com
REACT_APP_WS_URL=wss://airtable-clone-backend.onrender.com
```
- Replace `airtable-clone-backend.onrender.com` with your actual backend URL
- Make sure to select "Production" environment

#### 4. **Deploy**
- Click "Deploy"
- Vercel will build and deploy your frontend
- You'll get a URL like: `https://your-app-name.vercel.app`

## Configuration Files

### Frontend Configuration

#### `frontend/src/config.js`
```javascript
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
```

#### `frontend/vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://airtable-clone-backend.onrender.com/api/$1"
    }
  ]
}
```

### Backend Configuration

#### `backend/main.py`
The backend is already configured to:
- Listen on port 8000
- Accept CORS from any origin
- Handle WebSocket connections
- Provide health check endpoints

## Testing Your Deployment

### 1. **Test Backend Health**
```bash
curl https://airtable-clone-backend.onrender.com/health
```
Should return: `{"status": "healthy", "timestamp": "..."}`

### 2. **Test Frontend**
- Open your frontend URL in a browser
- Check the browser console for any errors
- Try creating a new spreadsheet

### 3. **Test Real-time Collaboration**
- Open the app in two different browser windows
- Try editing cells simultaneously
- Verify that changes appear in real-time

## Troubleshooting

### Common Issues

#### Backend Issues
1. **Build fails**: Check Render logs for Python dependency issues
2. **App won't start**: Verify the start command is `python main.py`
3. **Health check fails**: Check if the app is listening on port 8000

#### Frontend Issues
1. **Can't connect to backend**: Verify environment variables in Vercel
2. **WebSocket errors**: Ensure you're using `wss://` (secure WebSocket)
3. **CORS errors**: Backend should allow all origins in development

#### Real-time Issues
1. **No live updates**: Check WebSocket URL configuration
2. **Users not appearing**: Verify Socket.IO is working properly

### Debugging Steps
1. Check Render logs for backend errors
2. Check Vercel logs for frontend build errors
3. Use browser developer tools to check network requests
4. Verify all environment variables are set correctly

## Environment Variables Reference

### Required for Frontend (Vercel)
```
REACT_APP_BACKEND_URL=https://airtable-clone-backend.onrender.com
REACT_APP_WS_URL=wss://airtable-clone-backend.onrender.com
```

### Optional for Backend (Render)
```
DATABASE_URL=your_database_url_here
SECRET_KEY=your_secret_key_here
CORS_ORIGINS=https://your-frontend-url.vercel.app
LOG_LEVEL=INFO
```

## Automatic Deployments

Both Vercel and Render will automatically redeploy when you push to your main branch:
- **Render**: Detects changes and rebuilds automatically
- **Vercel**: Triggers new deployment on each push

## Monitoring and Logs

### Render Dashboard
- View real-time logs
- Monitor resource usage
- Check deployment status
- View environment variables

### Vercel Dashboard
- View build logs
- Monitor performance
- Check deployment status
- Manage environment variables

## Cost and Limits

### Free Tier Limits
- **Render**: 750 hours/month, 512MB RAM
- **Vercel**: 100GB bandwidth/month, unlimited deployments

### Scaling
- Both platforms offer paid plans for higher limits
- Render: $7/month for 1GB RAM, unlimited hours
- Vercel: $20/month for Pro plan

## Final URLs
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://airtable-clone-backend.onrender.com`
- **Health Check**: `https://airtable-clone-backend.onrender.com/health`

## Next Steps
1. Set up custom domains (optional)
2. Configure monitoring and alerts
3. Set up CI/CD pipelines
4. Add authentication (if needed)
5. Configure custom domain in Vercel/Render

## Resources
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Socket.IO Documentation](https://socket.io/docs/) 