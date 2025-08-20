# AgricTech Dashboard - Real-Time Crop Prices Fix

## Issue Description
The dashboard shows "No crop price data available" and "Network Error: Cannot connect to server" because:
1. Missing socket.io dependencies for real-time functionality
2. Server not running
3. Database not seeded with crop price data
4. Environment configuration missing

## Quick Fix Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or connection string)
- Git

### Step 1: Install Dependencies

**Server Dependencies:**
```bash
cd server
npm install
```

**Client Dependencies:**
```bash
cd ../client
npm install
```

### Step 2: Environment Setup

**Server Environment:**
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your MongoDB connection:
```env
MONGODB_URI=mongodb://localhost:27017/agrictech
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**Client Environment:**
```bash
cd ../client
cp .env.example .env
```

The client `.env` should contain:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_DEBUG=true
REACT_APP_ENV=development
```

### Step 3: Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows (if MongoDB is installed as service)
net start MongoDB

# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Step 4: Seed Database with Crop Prices
```bash
cd server
npm run seed-prices
```

### Step 5: Start the Application

**Option A: Manual Start**
```bash
# Terminal 1 - Start Server
cd server
npm run dev

# Terminal 2 - Start Client
cd client
npm start
```

**Option B: Automated Start**
```bash
# Windows
start-app.bat

# macOS/Linux
chmod +x start-app.sh
./start-app.sh
```

### Step 6: Verify Fix
1. Open http://localhost:3000
2. Check that crop prices are displayed on the dashboard
3. Verify real-time updates are working (prices should update automatically)

## What Was Fixed

### 1. Added Missing Dependencies
- **Server**: Added `socket.io` for real-time WebSocket functionality
- **Client**: Added `socket.io-client` for WebSocket client connection

### 2. Environment Configuration
- Created `.env.example` files for both server and client
- Configured proper API URLs and MongoDB connection

### 3. Database Seeding
- Added `npm run seed-prices` script to populate crop price data
- Includes sample data for Igbaja and surrounding markets

### 4. Startup Scripts
- Created automated startup scripts for easy deployment
- Handles dependency installation and environment setup

## Troubleshooting

### "Cannot connect to server"
1. Ensure server is running on port 5000
2. Check MongoDB connection in server logs
3. Verify firewall isn't blocking port 5000

### "No crop price data available"
1. Run `npm run seed-prices` in server directory
2. Check MongoDB is running and accessible
3. Verify database connection string in `.env`

### WebSocket connection issues
1. Check browser console for WebSocket errors
2. Ensure both server and client are running
3. Verify CORS configuration allows client URL

## API Endpoints

### Crop Prices
- `GET /api/crop-prices` - All crop prices
- `GET /api/crop-prices/featured` - Featured prices for dashboard
- `GET /api/crop-prices/analytics` - Price analytics
- `GET /api/health` - Server health check

### WebSocket Events
- `priceUpdate` - Real-time price updates
- `joinPriceUpdates` - Subscribe to price updates
- `subscribeToPriceAlerts` - Subscribe to price alerts

## Architecture

```
Client (React) ←→ Server (Express + Socket.io) ←→ MongoDB
     ↓                        ↓
WebSocket Connection    Real-time Updates
```

## Support
If you continue to experience issues:
1. Check server logs for error messages
2. Verify all dependencies are installed
3. Ensure MongoDB is running and accessible
4. Check network connectivity between client and server

## Next Steps
- Set up production environment variables
- Configure MongoDB Atlas for cloud deployment
- Implement user authentication
- Add more real-time features (weather updates, alerts)
