# AgriTech Platform - Render Deployment Guide

## Overview
This guide will help you deploy your AgriTech platform to Render.com, a modern cloud platform that provides easy deployment for web applications.

## Prerequisites
- ✅ GitHub repository with your code (already done)
- ✅ Render.yaml configuration file (already created)
- ✅ MongoDB Atlas database (you'll need to set this up)
- ✅ Render.com account (free tier available)

## Step-by-Step Deployment Process

### 1. Set Up MongoDB Atlas (Database)

Since Render's free PostgreSQL won't work with your MongoDB-based app, you need MongoDB Atlas:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free account or sign in
3. Create a new cluster (choose the free M0 tier)
4. Wait for cluster creation (2-3 minutes)
5. Set up database access:
   - Go to "Database Access" → "Add New Database User"
   - Create a user with read/write permissions
   - Remember the username and password
6. Set up network access:
   - Go to "Network Access" → "Add IP Address"
   - Add `0.0.0.0/0` (allows access from anywhere - for Render)
7. Get your connection string:
   - Go to "Database" → "Connect" → "Connect your application"
   - Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/agrictech?retryWrites=true&w=majority`)

### 2. Deploy to Render

1. **Go to Render Dashboard:**
   - Visit [render.com](https://render.com/)
   - Sign up/Sign in with your GitHub account

2. **Create New Web Service:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository: `ibrahim-sultan/agritech`
   - Render will automatically detect your `render.yaml` file

3. **Configure Service:**
   - **Name:** `agrictech-platform` (or your preferred name)
   - **Branch:** `master`
   - **Root Directory:** Leave empty (uses project root)
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

### 3. Set Up Environment Variables

In your Render service dashboard, go to "Environment" and add these **critical** environment variables:

#### Required Variables (Must Set):
```
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/agrictech?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters-long
```

#### Optional but Recommended:
```
EMAIL_USERNAME=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-specific-password
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
PAYSTACK_SECRET_KEY=your-paystack-secret
PAYSTACK_PUBLIC_KEY=your-paystack-public
```

**Note:** The render.yaml file already includes many environment variables with default values.

### 4. Deploy

1. Click "Create Web Service"
2. Render will:
   - Clone your repository
   - Install dependencies
   - Build the React frontend
   - Start the Node.js server
   - This process takes 5-10 minutes

### 5. Monitor Deployment

Watch the deployment logs in real-time:
- ✅ Installing dependencies
- ✅ Building React app
- ✅ Starting server
- ✅ MongoDB connection
- ✅ Server running on port 10000

### 6. Access Your Application

Once deployed, your app will be available at:
`https://your-service-name.onrender.com`

## Post-Deployment Steps

### 1. Test Core Features
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Dashboard displays
- [ ] Crop prices load
- [ ] API endpoints respond

### 2. Set Up Custom Domain (Optional)
1. Go to your service → "Settings"
2. Add your custom domain
3. Configure DNS records as instructed

### 3. Enable HTTPS (Automatic)
- Render automatically provides SSL certificates
- Your app will be accessible via HTTPS

## Environment Variables Reference

### Authentication & Security
- `JWT_SECRET` - Secret key for JWT tokens (required)
- `JWT_EXPIRES_IN` - Token expiration time (default: 7d)
- `BCRYPT_ROUNDS` - Password hashing rounds (default: 12)

### Database
- `MONGODB_URI` - MongoDB connection string (required)

### Email Service (Optional)
- `EMAIL_HOST` - SMTP server (default: smtp.gmail.com)
- `EMAIL_PORT` - SMTP port (default: 587)
- `EMAIL_USERNAME` - Email account username
- `EMAIL_PASSWORD` - Email account password/app password

### SMS/WhatsApp (Optional)
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number

### Payment Processing (Optional)
- `PAYSTACK_SECRET_KEY` - Paystack secret key
- `PAYSTACK_PUBLIC_KEY` - Paystack public key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `FLUTTERWAVE_SECRET_KEY` - Flutterwave secret key

## Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check build logs for specific errors
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

2. **Database Connection Fails:**
   - Verify MongoDB URI is correct
   - Check MongoDB Atlas network access settings
   - Ensure database user has proper permissions

3. **Environment Variables Not Working:**
   - Variables are case-sensitive
   - Don't use quotes around values in Render dashboard
   - Restart service after adding new variables

4. **App Loads but Features Don't Work:**
   - Check browser console for JavaScript errors
   - Verify API endpoints in network tab
   - Check server logs for backend errors

### Getting Help:
1. Check Render service logs
2. Check browser developer tools console
3. Review GitHub repository for any missing files
4. Contact Render support if deployment fails

## Maintenance

### Auto-Deploy:
- Set up in render.yaml (already configured)
- Every push to `master` branch will automatically redeploy
- Monitor deployments in Render dashboard

### Monitoring:
- Render provides automatic health checks
- Monitor performance in Render dashboard
- Set up uptime monitoring if needed

### Scaling:
- Free tier: 750 hours/month
- Upgrade to paid plans for:
  - Custom domains
  - More resources
  - Better performance
  - Dedicated support

## Cost Considerations

### Render Free Tier:
- 750 hours/month (enough for continuous deployment)
- 512MB RAM, 0.1 CPU
- SSL certificates included
- Automatic deploys
- **Sleeps after 15 minutes of inactivity** (wakes on request)

### Paid Plans (Starting $7/month):
- Always-on services
- More resources
- Faster builds
- Priority support

---

## Quick Commands Reference

```bash
# Local development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Deploy to Render
git push origin master  # Auto-deploys if connected
```

Your AgriTech platform is now ready for deployment! 🚀