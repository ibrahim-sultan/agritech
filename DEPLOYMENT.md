# AgriTech Dashboard - Render Deployment Guide

## Environment Variables Required for Production

The following environment variables need to be configured in Render:

### Server Environment Variables
- `NODE_ENV=production`
- `PORT=10000` (automatically set by Render)
- `MONGODB_URI` - Will be automatically set from the database connection
- `CLIENT_URL=https://your-app-name.onrender.com`

### Optional Environment Variables
- `JWT_SECRET` - For authentication features (if implemented)
- `API_VERSION=v1`

## Render Deployment Steps

### 1. Prerequisites
- Push your code to a GitHub repository
- Sign up for a Render account at https://render.com

### 2. Database Setup
1. In Render dashboard, create a new PostgreSQL database
2. Or connect to an external MongoDB Atlas database

### 3. Web Service Setup
1. Connect your GitHub repository
2. Choose "Web Service"
3. Configure the following:
   - **Name**: agrictech-dashboard
   - **Environment**: Node
   - **Region**: Choose closest to your users
   - **Branch**: main (or your default branch)
   - **Root Directory**: leave blank
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run install-all && npm run build`
   - **Start Command**: `npm start`

### 4. Environment Variables
Set the following environment variables in Render:
- `NODE_ENV`: production
- `CLIENT_URL`: https://your-service-name.onrender.com
- `MONGODB_URI`: Your database connection string

### 5. Deploy
Click "Deploy" and wait for the build to complete.

## Post-Deployment
1. Visit your app URL to verify it's working
2. Check the health endpoint: https://your-app-name.onrender.com/api/health
3. Monitor logs in Render dashboard for any issues

## Troubleshooting
- If build fails, check the build logs in Render dashboard
- Verify all dependencies are listed in package.json files
- Ensure MongoDB connection string is correct
- Check that all required routes and models exist
