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

// Import notification service
const notificationService = require('./services/notifications');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AgriTech Dashboard API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
} else {
  // Development mode - just handle API 404s
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
  });
}

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
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📡 WebSocket server ready for real-time updates`);
  console.log(`📱 SMS/WhatsApp notifications enabled`);
  console.log(`💰 Monetization features active`);
});
