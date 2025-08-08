# FinanceTracker Deployment Guide

This guide will help you deploy your FinanceTracker application with Neon database to Vercel.

## Prerequisites

1. **Neon Database**: Follow the [NEON_SETUP.md](./NEON_SETUP.md) guide to set up your Neon database
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **GitHub Repository**: Your code should be pushed to GitHub

## Step 1: Backend Deployment

### 1.1 Create Vercel Backend Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Node.js
   - **Root Directory**: `backend`
   - **Build Command**: Leave empty (not needed for Node.js)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

### 1.2 Configure Environment Variables

1. In your Vercel project settings, go to "Environment Variables"
2. Add the following variables:
   ```
   DATABASE_URL=your-neon-connection-string
   PORT=5000
   ```
3. Make sure to add them to all environments (Production, Preview, Development)

### 1.3 Deploy Backend

1. Click "Deploy"
2. Wait for the deployment to complete
3. Copy the deployment URL (e.g., `https://your-backend.vercel.app`)

## Step 2: Frontend Deployment

### 2.1 Create Vercel Frontend Project

1. Go back to Vercel dashboard
2. Click "New Project" again
3. Import the same GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend/FinanceTracker`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2.2 Configure Environment Variables

1. In your frontend project settings, go to "Environment Variables"
2. Add the following variable:
   ```
   VITE_API_URL=https://your-backend.vercel.app/api
   ```
   Replace `your-backend.vercel.app` with your actual backend URL

### 2.3 Deploy Frontend

1. Click "Deploy"
2. Wait for the deployment to complete
3. Copy the frontend URL (e.g., `https://your-frontend.vercel.app`)

## Step 3: Initialize Database

### 3.1 Run Database Initialization

1. Clone your repository locally
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

3. Create a `.env` file with your Neon connection string:
   ```
   DATABASE_URL=your-neon-connection-string
   ```

4. Run the database initialization:
   ```bash
   npm run init-db
   ```

## Step 4: Test Your Deployment

### 4.1 Test Backend API

1. Visit your backend URL + `/api/transactions`
2. You should see an empty transactions array: `{"transactions":[]}`

### 4.2 Test Frontend

1. Visit your frontend URL
2. Try adding a transaction
3. Check if it appears in your Neon database

## Step 5: Mobile Access

### 5.1 Access from Phone

1. Open your frontend URL on your phone
2. Add transactions, income, expenses, and budgets
3. All data will be stored in your Neon database

### 5.2 Cross-Device Sync

- Data added on your phone will appear on your computer
- Data added on your computer will appear on your phone
- All data is stored in the cloud via Neon

## Troubleshooting

### Backend Issues

- **Database Connection Error**: Check your `DATABASE_URL` environment variable
- **CORS Error**: The backend is configured to allow all origins
- **Port Error**: Vercel will set the PORT automatically

### Frontend Issues

- **API Connection Error**: Check your `VITE_API_URL` environment variable
- **Build Error**: Make sure all dependencies are installed
- **404 Error**: Check if the backend URL is correct

### Database Issues

- **Table Not Found**: Run `npm run init-db` locally
- **Connection Timeout**: Check your Neon connection string
- **SSL Error**: Make sure your connection string includes `?sslmode=require`

## Environment Variables Summary

### Backend (.env)
```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
PORT=5000
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend.vercel.app/api
```

## URLs to Remember

- **Backend API**: `https://your-backend.vercel.app`
- **Frontend App**: `https://your-frontend.vercel.app`
- **Neon Dashboard**: Your Neon project dashboard

## Benefits of This Setup

- **Serverless**: No server management required
- **Global**: Access from anywhere in the world
- **Scalable**: Automatically scales with usage
- **Real-time**: Instant data synchronization
- **Mobile-friendly**: Works perfectly on phones
- **Free**: Generous free tiers for both Vercel and Neon

## Next Steps

1. **Custom Domain**: Add a custom domain to your Vercel projects
2. **Monitoring**: Set up monitoring for your database and API
3. **Backup**: Set up automated backups for your Neon database
4. **Analytics**: Add analytics to track usage
5. **Features**: Add more features like data export, charts, etc. 