# AgriTech Platform - Separate Frontend/Backend Deployment Guide

This guide will help you deploy your AgriTech platform with the backend on Render and frontend separately on Netlify, Vercel, or another hosting service.

## 🏗️ Architecture Overview

```
Frontend (Netlify/Vercel) ← API calls → Backend API (Render) ← Database (MongoDB Atlas)
```

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **MongoDB Atlas Account**: For production database
3. **Render Account**: For backend API hosting
4. **Netlify/Vercel Account**: For frontend hosting

## 🚀 Part 1: Deploy Backend API to Render

### Step 1: Prepare MongoDB Atlas

1. **Create MongoDB Atlas Account**: Visit [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Create a Cluster**: Choose the free tier (M0)
3. **Create Database User**: 
   - Go to Database Access → Add New Database User
   - Username: `agritech-user`
   - Password: Generate a strong password
   - Built-in Role: Read and write to any database
4. **Configure Network Access**:
   - Go to Network Access → Add IP Address
   - Add `0.0.0.0/0` (allow from anywhere)
5. **Get Connection String**:
   - Go to Clusters → Connect → Connect your application
   - Copy the connection string: `mongodb+srv://username:password@cluster.mongodb.net/agrictech`

### Step 2: Deploy Backend to Render

1. **Sign up to Render**: Visit [render.com](https://render.com)
2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository and branch (main/master)

3. **Configure Build Settings**:
   - **Name**: `agrictech-api` 
   - **Environment**: Node
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Auto-Deploy**: Yes

4. **Set Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/agrictech
   JWT_SECRET=generate-a-32-character-secret-key-here
   JWT_EXPIRES_IN=7d
   CLIENT_URL=https://your-frontend-will-be-here.netlify.app
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   ENABLE_SMS_NOTIFICATIONS=true
   ENABLE_EMAIL_NOTIFICATIONS=true
   ENABLE_MARKETPLACE=true
   ENABLE_TRAINING_SYSTEM=true
   ENABLE_PREMIUM_FEATURES=true
   ```

5. **Deploy**: Click "Create Web Service"

6. **Note Your API URL**: After deployment, you'll get:
   ```
   https://agrictech-api.onrender.com
   ```

### Step 3: Test Backend Deployment

Visit these URLs to confirm backend is working:
- Health check: `https://your-api-url.onrender.com/api/health`
- Root endpoint: `https://your-api-url.onrender.com/`

You should see JSON responses.

## 🌐 Part 2: Deploy Frontend 

### Option A: Deploy to Netlify

1. **Update Frontend Environment**:
   
   Create `client/.env.production`:
   ```
   REACT_APP_API_URL=https://your-api-url.onrender.com/api
   REACT_APP_WS_URL=https://your-api-url.onrender.com
   REACT_APP_ENV=production
   REACT_APP_DEBUG=false
   ```

2. **Deploy to Netlify**:
   - Visit [netlify.com](https://netlify.com) and sign up
   - Click "New site from Git"
   - Connect GitHub and select your repository
   - **Build settings**:
     - Base directory: `client`
     - Build command: `npm run build`
     - Publish directory: `client/build`
   
3. **Set Environment Variables** (in Netlify dashboard):
   ```
   REACT_APP_API_URL=https://your-api-url.onrender.com/api
   REACT_APP_WS_URL=https://your-api-url.onrender.com
   REACT_APP_ENV=production
   REACT_APP_DEBUG=false
   ```

4. **Deploy**: Click "Deploy site"

5. **Get Your Frontend URL**: Something like:
   ```
   https://magical-unicorn-123456.netlify.app
   ```

### Option B: Deploy to Vercel

1. **Visit Vercel**: Go to [vercel.com](https://vercel.com)
2. **Import Project**: Connect GitHub and select your repository
3. **Configure**:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   
4. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://your-api-url.onrender.com/api
   REACT_APP_WS_URL=https://your-api-url.onrender.com
   REACT_APP_ENV=production
   REACT_APP_DEBUG=false
   ```

5. **Deploy**: Click "Deploy"

## 🔗 Part 3: Connect Frontend and Backend

### Step 1: Update Backend CORS

1. **Get Your Frontend URL** from Netlify/Vercel dashboard
2. **Update server code** - edit these files:
   
   In `server/server.js`, update the CORS origins (lines 31, 59):
   ```javascript
   origin: [
     process.env.CLIENT_URL || "http://localhost:3000",
     "https://your-actual-frontend-url.netlify.app", // Replace this
     "http://localhost:3000"
   ]
   ```

3. **Update Render Environment Variables**:
   - Go to your Render service dashboard
   - Update `CLIENT_URL` to your frontend URL:
     ```
     CLIENT_URL=https://your-actual-frontend-url.netlify.app
     ```

4. **Redeploy Backend**: Render will auto-redeploy when you push changes

### Step 2: Update Frontend Configuration

1. **Update client environment** (if you haven't already):
   ```
   REACT_APP_API_URL=https://your-actual-api-url.onrender.com/api
   REACT_APP_WS_URL=https://your-actual-api-url.onrender.com
   ```

2. **Redeploy Frontend**: 
   - Netlify/Vercel will auto-redeploy when you push changes
   - Or manually trigger deployment from their dashboards

## ✅ Part 4: Test Full Integration

### Test Checklist:

1. **Frontend Loading**: ✅ Visit your frontend URL
2. **API Connection**: ✅ Check browser network tab for API calls to Render
3. **User Registration**: ✅ Try creating a new account
4. **User Login**: ✅ Try logging in
5. **Data Loading**: ✅ Check if crop prices and other data loads
6. **WebSocket**: ✅ Check browser console for WebSocket connection logs

### Debugging:

1. **Frontend Issues**: Check browser developer console
2. **Backend Issues**: Check Render service logs
3. **CORS Issues**: Verify frontend URL is in CORS origins
4. **API Issues**: Test API endpoints directly in browser

## 📈 URLs Summary

After successful deployment, you'll have:

```
Frontend:  https://your-app.netlify.app
Backend:   https://your-api.onrender.com
Database:  MongoDB Atlas cluster
```

## 🛠️ Maintenance & Updates

### Auto-Deployment:
- Both Netlify/Vercel and Render support auto-deployment
- Push to your main branch to trigger deployments
- Monitor deployment status in respective dashboards

### Environment Variables:
- Update in respective service dashboards
- Restart services after major environment changes

### Monitoring:
- Check service health regularly
- Monitor usage and performance
- Set up uptime monitoring if needed

## 💡 Common Issues & Solutions

### Issue 1: CORS Errors
**Solution**: 
- Ensure frontend URL is in backend CORS origins
- Update `CLIENT_URL` environment variable in Render
- Check browser console for exact error

### Issue 2: API Calls Failing
**Solution**:
- Verify `REACT_APP_API_URL` includes `/api`
- Check backend is running on Render
- Test API endpoints directly

### Issue 3: WebSocket Connection Failed
**Solution**:
- Verify `REACT_APP_WS_URL` does NOT include `/api`
- Check backend WebSocket configuration
- Look for connection errors in browser console

### Issue 4: Environment Variables Not Working
**Solution**:
- Variables must start with `REACT_APP_` for frontend
- Don't use quotes around values in dashboards
- Restart/redeploy services after changes

## 🎉 You're Done!

Your AgriTech platform is now running with:
- ✅ Backend API on Render
- ✅ Frontend on Netlify/Vercel  
- ✅ Database on MongoDB Atlas
- ✅ Separate, scalable architecture

## 🚀 Next Steps

1. **Custom Domains**: Add your own domain to both services
2. **SSL Certificates**: Already included automatically
3. **Performance Monitoring**: Add analytics and error tracking
4. **Scaling**: Upgrade to paid tiers as your app grows

## 📞 Support

If you run into issues:
1. Check service logs (Render, Netlify, Vercel)
2. Verify all environment variables are set correctly
3. Test API endpoints individually
4. Check browser console for frontend errors

Happy deploying! 🎊