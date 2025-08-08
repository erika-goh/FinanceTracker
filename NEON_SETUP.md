# Neon Database Setup for FinanceTracker

This guide will help you set up a Neon PostgreSQL database for your FinanceTracker application.

## Step 1: Create a Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project

## Step 2: Get Your Database Connection String

1. In your Neon dashboard, go to your project
2. Click on "Connection Details"
3. Copy the connection string that looks like:
   ```
   postgresql://username:password@host:port/database?sslmode=require
   ```

## Step 3: Set Up Environment Variables

1. Create a `.env` file in the `backend` directory:
   ```bash
   cd backend
   cp env.example .env
   ```

2. Edit the `.env` file and replace the placeholder with your actual Neon connection string:
   ```
   DATABASE_URL=postgresql://your-username:your-password@your-host:port/your-database?sslmode=require
   PORT=5000
   ```

## Step 4: Initialize the Database

1. Run the database initialization script:
   ```bash
   cd backend
   npm run init-db
   ```

This will create the necessary tables in your Neon database.

## Step 5: Test the Connection

1. Start the backend server:
   ```bash
   npm run dev
   ```

2. You should see "Connected to Neon database successfully!" in the console.

## Step 6: Deploy to Vercel

### Backend Deployment

1. Create a new Vercel project for your backend
2. Add your environment variables in Vercel:
   - Go to your project settings
   - Add `DATABASE_URL` with your Neon connection string
   - Add `PORT` (Vercel will set this automatically)

3. Deploy your backend

### Frontend Deployment

1. Update the API base URL in your frontend to point to your deployed backend
2. Deploy your frontend to Vercel

## Step 7: Mobile Access

Once deployed, you can access your FinanceTracker from your phone by:

1. Opening the deployed frontend URL on your phone
2. Adding transactions, income, expenses, and budgets
3. All data will be stored in your Neon database and accessible from anywhere

## Database Schema

The application creates two main tables:

### Transactions Table
- `id` (UUID): Primary key
- `type` (VARCHAR): 'income' or 'expense'
- `amount` (DECIMAL): Transaction amount
- `category` (VARCHAR): Transaction category
- `description` (TEXT): Optional description
- `date` (TIMESTAMP): Transaction date
- `image_url` (TEXT): Optional image URL
- `created_at` (TIMESTAMP): Record creation time

### Budgets Table
- `id` (UUID): Primary key
- `category` (VARCHAR): Budget category
- `month` (VARCHAR): Month in YYYY-MM format
- `amount` (DECIMAL): Budget amount
- `created_at` (TIMESTAMP): Record creation time

## Troubleshooting

- **Connection Error**: Make sure your Neon connection string is correct and the database is accessible
- **SSL Error**: The connection string should include `?sslmode=require`
- **Table Not Found**: Run `npm run init-db` to create the tables
- **Environment Variables**: Ensure your `.env` file is in the backend directory and contains the correct `DATABASE_URL`

## Benefits of Using Neon

- **Serverless**: No server management required
- **Global**: Access your data from anywhere
- **Scalable**: Automatically scales with your needs
- **Free Tier**: Generous free tier for development
- **Real-time**: Instant data synchronization across devices 