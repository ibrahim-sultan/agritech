# AgricTech Dashboard - Troubleshooting Guide

## Common Issues and Solutions

### 1. "Network Error: Cannot connect to server"

**Symptoms:**
- Dashboard shows network error message
- API requests fail
- Real-time updates not working

**Solutions:**
```bash
# Check if server is running
curl http://localhost:5000/api/health

# If not running, start the server
cd server
npm run dev

# Check server logs for errors
# Look for MongoDB connection issues
```

**Common Causes:**
- Server not started
- Wrong port (should be 5000)
- Firewall blocking connections
- MongoDB not running

### 2. "No crop price data available"

**Symptoms:**
- Dashboard loads but shows empty state
- API returns empty array
- Database queries return no results

**Solutions:**
```bash
# Seed the database with sample data
cd server
npm run seed-prices

# Check if MongoDB is running
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Verify database connection
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/agrictech')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));
"
```

### 3. WebSocket Connection Issues

**Symptoms:**
- Real-time updates not working
- Console shows WebSocket errors
- Price changes don't appear automatically

**Solutions:**
```bash
# Check browser console for WebSocket errors
# Common error: "WebSocket connection failed"

# Verify server WebSocket setup
# Check server logs for WebSocket connections

# Test WebSocket manually
node -e "
const io = require('socket.io-client');
const socket = io('http://localhost:5000');
socket.on('connect', () => console.log('✅ WebSocket connected'));
socket.on('connect_error', (err) => console.error('❌ WebSocket error:', err));
"
```

### 4. Dependencies Installation Issues

**Symptoms:**
- `npm install` fails
- Missing module errors
- Version conflicts

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use specific Node.js version (if needed)
nvm use 16  # or your preferred version

# Check for global package conflicts
npm list -g --depth=0
```

### 5. Environment Configuration Issues

**Symptoms:**
- API calls go to wrong URL
- Database connection fails
- CORS errors

**Solutions:**
```bash
# Verify .env files exist
ls server/.env client/.env

# Check environment variables
cd server && node -e "
require('dotenv').config();
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('PORT:', process.env.PORT);
"

cd client && node -e "
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
"
```

### 6. MongoDB Connection Issues

**Symptoms:**
- "MongoNetworkError" in server logs
- Database operations fail
- Seeding fails

**Solutions:**
```bash
# Check MongoDB status
# Windows
sc query MongoDB

# macOS
brew services list | grep mongodb

# Linux
systemctl status mongod

# Test MongoDB connection
mongo --eval "db.adminCommand('ismaster')"

# Check MongoDB logs
# Windows: C:\Program Files\MongoDB\Server\X.X\log\mongod.log
# macOS: /usr/local/var/log/mongodb/mongo.log
# Linux: /var/log/mongodb/mongod.log
```

### 7. Port Conflicts

**Symptoms:**
- "Port already in use" errors
- Cannot start server or client
- Connection refused errors

**Solutions:**
```bash
# Check what's using port 5000 (server)
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # macOS/Linux

# Check what's using port 3000 (client)
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # macOS/Linux

# Kill process using port (if needed)
# Windows
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>

# Use different ports (modify .env files)
# Server: PORT=5001
# Client: REACT_APP_API_URL=http://localhost:5001/api
```

### 8. CORS Issues

**Symptoms:**
- "CORS policy" errors in browser console
- API requests blocked
- Cross-origin errors

**Solutions:**
```bash
# Verify CORS configuration in server.js
# Should include client URL in CORS options

# Check CLIENT_URL in server .env
CLIENT_URL=http://localhost:3000

# Restart server after CORS changes
cd server
npm run dev
```

## Quick Diagnostic Commands

```bash
# Health check script
echo "=== AgricTech Diagnostic ==="
echo "1. Checking server health..."
curl -s http://localhost:5000/api/health || echo "❌ Server not responding"

echo "2. Checking MongoDB..."
mongo --quiet --eval "print('✅ MongoDB connected')" || echo "❌ MongoDB not accessible"

echo "3. Checking crop prices API..."
curl -s http://localhost:5000/api/crop-prices/featured | head -c 100 || echo "❌ Crop prices API failed"

echo "4. Checking client..."
curl -s http://localhost:3000 | head -c 100 || echo "❌ Client not responding"
```

## Getting Help

If you're still experiencing issues:

1. **Check the logs:**
   - Server logs in terminal where you ran `npm run dev`
   - Browser console (F12 → Console tab)
   - MongoDB logs

2. **Verify the setup:**
   - All dependencies installed (`npm install` in both directories)
   - Environment files created and configured
   - MongoDB running and accessible
   - Correct ports (5000 for server, 3000 for client)

3. **Test step by step:**
   - Start MongoDB
   - Start server (`cd server && npm run dev`)
   - Seed database (`npm run seed-prices`)
   - Test API (`curl http://localhost:5000/api/health`)
   - Start client (`cd client && npm start`)
   - Check dashboard in browser

4. **Common reset procedure:**
   ```bash
   # Stop all processes
   # Delete node_modules in both server and client
   # Reinstall dependencies
   # Recreate .env files
   # Restart MongoDB
   # Follow startup procedure
