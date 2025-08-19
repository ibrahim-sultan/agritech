const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

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
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📡 WebSocket server ready for real-time updates`);
});
