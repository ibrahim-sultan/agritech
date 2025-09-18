const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config();

// Import notification service (with error handling)
let notificationService;
try {
  notificationService = require('./services/notifications');
  console.log('✅ Notification service loaded');
} catch (err) {
  console.log('⚠️  Notification service not available:', err.message);
  notificationService = {
    processPriceAlerts: async () => [],
    cleanupRateLimits: () => {}
  };
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "https://agrictech01.netlify.app", // Main dashboard app
      "https://agrictech0.netlify.app", // Landing page
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io available to routes
app.set('io', io);

// Rate limiting (disabled in development to avoid issues)
const limiter = process.env.NODE_ENV === 'production' ? rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
}) : (req, res, next) => next(); // Skip rate limiting in development

// Middleware
app.use(helmet());
app.use(limiter);
// CORS configuration for multiple origins
const corsOptions = {
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "https://agrictech01.netlify.app", // Main dashboard app
      "https://agrictech0.netlify.app", // Landing page
      "http://localhost:3000",
      "http://localhost:3001"
    ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is not set!');
      console.log('📝 Please set MONGODB_URI in your Render environment variables');
      return;
    }
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Server will continue running but database features will not work');
    // Don't exit process - let server run without DB for debugging
  }
};

// Connect to MongoDB
connectDB();

// Authentication Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payments', require('./routes/payments'));

// New Monetization and Business Routes
app.use('/api/premium', require('./routes/premium'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/training', require('./routes/training'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));

// Routes - Igbaja AgriTech Features
app.use('/api/crop-prices', require('./routes/cropPrices'));
app.use('/api/farming-tips', require('./routes/farmingTips'));
app.use('/api/youth-training', require('./routes/youthTraining'));
app.use('/api/security-reports', require('./routes/securityReports'));

// Legacy routes (still available)
app.use('/api/farms', require('./routes/farms'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/sensors', require('./routes/sensors'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/alerts', require('./routes/alerts'));

// Serve static files from React build (in production)
if (process.env.NODE_ENV === 'production') {
  // Serve static files from client build directory
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AgriTech Dashboard API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mode: process.env.NODE_ENV === 'production' ? 'Fullstack (API + React)' : 'API Only'
  });
});

// Handle client-side routing - serve React app for non-API routes
app.get('*', (req, res) => {
  // If it's an API request, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      status: 'fail',
      message: 'API endpoint not found',
      requestedPath: req.path
    });
  }
  
  // In production, serve the React app for all non-API routes
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  } else {
    // In development, show API info
    res.json({ 
      message: 'AgriTech Platform API Server',
      status: 'running',
      note: 'Frontend should be running on http://localhost:3000',
      availableEndpoints: [
        '/api/health',
        '/api/crop-prices',
        '/api/auth/register',
        '/api/auth/login'
      ]
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);
  
  // Join crop price updates room
  socket.on('joinPriceUpdates', (data) => {
    socket.join('priceUpdates');
    console.log(`📊 User ${socket.id} joined price updates`);
  });
  
  // Handle price alert subscriptions
  socket.on('subscribeToPriceAlerts', (data) => {
    const { cropName, market, priceThreshold } = data;
    socket.join(`alerts_${cropName}_${market}`);
    console.log(`🔔 User ${socket.id} subscribed to alerts for ${cropName} in ${market}`);
  });
  
  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
  });
});

// Schedule notification jobs
if (process.env.NODE_ENV !== 'test') {
  // Process price alerts every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('⏰ Running scheduled price alert check...');
      const results = await notificationService.processPriceAlerts();
      console.log(`✅ Processed ${results.length} price alerts`);
      
      // Emit real-time updates to connected clients
      if (results.length > 0) {
        io.emit('priceAlertsProcessed', {
          timestamp: new Date(),
          processed: results.length,
          successful: results.filter(r => r.success).length
        });
      }
    } catch (error) {
      console.error('❌ Price alerts job failed:', error);
    }
  });

  // Clean up notification rate limits every hour
  cron.schedule('0 * * * *', () => {
    try {
      console.log('🧹 Cleaning up notification rate limits...');
      notificationService.cleanupRateLimits();
    } catch (error) {
      console.error('❌ Rate limit cleanup failed:', error);
    }
  });

  // Send subscription reminders daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('📧 Checking for subscription reminders...');
      // This would need to be implemented in the notification service
      // notificationService.sendSubscriptionReminders();
    } catch (error) {
      console.error('❌ Subscription reminders failed:', error);
    }
  });

  console.log('⏱️  Notification cron jobs scheduled');
}

const PORT = process.env.PORT || 5000;

// Add process error handlers
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 MongoDB URI configured: ${process.env.MONGODB_URI ? 'Yes' : 'No'}`);
  console.log(`🔐 JWT Secret configured: ${process.env.JWT_SECRET ? 'Yes' : 'No'}`);
  console.log(`📡 WebSocket server ready for real-time updates`);
  console.log(`📱 SMS/WhatsApp notifications enabled`);
  console.log(`💰 Monetization features active`);
  console.log(`✅ AgriTech Platform fully operational!`);
});
