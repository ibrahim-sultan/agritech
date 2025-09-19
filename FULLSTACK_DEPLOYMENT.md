# 🚀 AgriTech Fullstack Deployment Guide

This guide will help you deploy your AgriTech application as a unified fullstack app where the Express server serves both the API and the React frontend.

## 📋 What We've Changed

### ✅ Server Configuration (server/server.js)
- Added static file serving for React build files in production
- Updated catch-all route to serve React app for non-API routes
- Maintained API-only mode for development

### ✅ Build Scripts (package.json)
- Updated build process to install and build client dependencies
- Added `postinstall` script for automatic building on deployment
- Maintained development scripts for local development

### ✅ Render Configuration (render.yaml)
- Changed service name from `agrictech-api` to `agrictech-fullstack`
- Removed `rootDir: ./server` to build from project root
- Updated build command to build both backend and frontend
- Updated CLIENT_URL to point to the same domain

### ✅ Frontend Environment (.env.production)
- Changed API URLs to relative paths (`/api`)
- Updated WebSocket URL for same-domain deployment

## 🏗️ Deployment Options

### Option 1: Render (Recommended)
Your app is already set up for Render. Here's how to deploy:

#### Step 1: Create New Render Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your repository
4. Use these settings:
   - **Name**: `agrictech-fullstack`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: Leave empty (use project root)

#### Step 2: Environment Variables
Copy all environment variables from your current `agrictech-3rfg` service:
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- And all other existing environment variables

**Important**: Update `CLIENT_URL` to your new service URL:
```
CLIENT_URL=https://your-new-service-name.onrender.com
```

#### Step 3: Deploy
- Click "Create Web Service"
- Wait for the build and deployment to complete
- Your app will be available at: `https://your-service-name.onrender.com`

### Option 2: Alternative Platforms

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway deploy
```

#### Heroku
```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-uri
# ... (add all other environment variables)

# Deploy
git push heroku main
```

## 🧪 Testing Locally

### Test the unified setup locally:

```bash
# Install all dependencies
npm install

# Build the client
npm run build

# Set environment for production mode
$env:NODE_ENV = "production"  # PowerShell
# or
set NODE_ENV=production       # CMD

# Start the server
npm start
```

Visit `http://localhost:5000` - you should see your React app served from the Express server.

## 🔧 Environment Variables Required

Make sure these are set in your deployment platform:

### Required
- `NODE_ENV=production`
- `MONGODB_URI=your-mongodb-connection-string`
- `JWT_SECRET=your-jwt-secret`
- `CLIENT_URL=https://your-domain.com`

### Optional (with defaults)
- `PORT=10000` (Render) or dynamic port
- `JWT_EXPIRES_IN=7d`
- `JWT_REFRESH_EXPIRES_IN=30d`
- `BCRYPT_ROUNDS=12`
- All other existing environment variables

## 🚦 After Deployment

1. **Test all endpoints**: Visit `/api/health` to verify API is working
2. **Test frontend**: Navigate through your React app
3. **Test authentication**: Try logging in/registering
4. **Test real-time features**: Check WebSocket connections
5. **Update DNS**: Point your custom domain to the new service

## 📊 Benefits of This Setup

✅ **Single Domain**: No CORS issues between frontend and backend  
✅ **Simplified Deployment**: One service instead of two  
✅ **Cost Effective**: Reduced infrastructure costs  
✅ **Better Performance**: Faster loading times  
✅ **Easier Maintenance**: Single codebase deployment  

## 🔄 Migration Steps

1. **Deploy new fullstack service** (don't delete old ones yet)
2. **Test thoroughly** to ensure everything works
3. **Update any external integrations** to point to new URLs
4. **Update your domain DNS** if using custom domain
5. **Delete old separate services** once confirmed working

## 🆘 Troubleshooting

### Build Failures
- Check that `client/package.json` exists
- Ensure all dependencies are properly listed
- Verify Node.js version compatibility

### Frontend Not Loading
- Check that `client/build` directory exists after build
- Verify static file serving is configured correctly
- Check browser console for errors

### API Not Working
- Ensure API routes still start with `/api/`
- Check environment variables are set correctly
- Verify database connection

### WebSocket Issues
- Update frontend WebSocket connection to use same domain
- Check that Socket.IO CORS settings allow the new domain

## 📞 Need Help?

If you encounter issues:
1. Check the deployment logs in your platform dashboard
2. Test locally first with `NODE_ENV=production`
3. Verify all environment variables are set correctly
4. Check that the build process completes successfully

---

🎉 **Congratulations!** You now have a unified fullstack AgriTech application!