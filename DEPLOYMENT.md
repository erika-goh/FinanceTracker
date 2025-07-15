# Finance Tracker Deployment Guide

This guide will help you deploy your Finance Tracker app to Vercel (frontend) and Render (backend).

## Prerequisites

- GitHub account
- Vercel account (free)
- Render account (free)

## Step 1: Deploy Backend to Render

### 1.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Verify your email

### 1.2 Deploy Backend Service
1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `erika-goh/FinanceTracker`
3. Configure the service:
   - **Name**: `finance-tracker-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. Click **"Create Web Service"**

### 1.3 Get Your Backend URL
- Once deployed, Render will give you a URL like: `https://your-app-name.onrender.com`
- Copy this URL - you'll need it for the frontend

## Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Verify your email

### 2.2 Deploy Frontend
1. In Vercel dashboard, click **"New Project"**
2. Import your GitHub repository: `erika-goh/FinanceTracker`
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend/FinanceTracker`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Environment Variables**: Add this variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-render-backend-url.onrender.com/api` (replace with your actual Render URL)

5. Click **"Deploy"**

## Step 3: Test Your Deployment

### 3.1 Test Backend
- Visit your Render backend URL
- You should see the server running

### 3.2 Test Frontend
- Visit your Vercel frontend URL
- Login with:
  - Email: `erika_goh@ymail.com`
  - Password: `mg5Y!UAUK4sqhBB`

## Environment Variables

### Frontend (.env file for local development)
```
VITE_API_URL=http://localhost:5000/api
```

### Production (Vercel)
```
VITE_API_URL=https://your-render-backend-url.onrender.com/api
```

## Troubleshooting

### Backend Issues
- Check Render logs for any build errors
- Ensure all dependencies are in `package.json`
- Verify the start command is correct

### Frontend Issues
- Check Vercel build logs
- Ensure environment variable is set correctly
- Verify the API URL is accessible

### CORS Issues
- The backend is configured with CORS enabled
- If you get CORS errors, check that the frontend URL is allowed

## Local Development

To run locally after deployment:

1. **Backend**: `cd backend && npm start`
2. **Frontend**: `cd frontend/FinanceTracker && npm run dev`

The frontend will automatically use localhost for the API when running in development mode.

## Notes

- Render free tier may have cold starts (first request might be slow)
- Vercel automatically deploys on every push to main branch
- Both services offer free SSL certificates
- Data is stored in memory (will reset on server restart) 