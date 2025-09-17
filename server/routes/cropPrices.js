const express = require('express');
const router = express.Router();
const CropPrice = require('../models/CropPrice');
const { protect, restrictTo } = require('../middleware/auth');

// Helper function to calculate price trends
const calculateTrend = (currentPrice, previousPrice) => {
  if (!previousPrice || previousPrice === 0) return { direction: 'stable', percentage: 0 };
  
  const change = ((currentPrice - previousPrice) / previousPrice) * 100;
  let direction = 'stable';
  
  if (change > 2) direction = 'rising';
  else if (change < -2) direction = 'falling';
  
  return { direction, percentage: Math.round(change * 100) / 100 };
};

// Helper function for price predictions (simple moving average)
const predictPrice = (historicalPrices, days = 7) => {
  if (historicalPrices.length < 3) return null;
  
  const recentPrices = historicalPrices.slice(-5).map(p => p.pricePerUnit.value);
  const average = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
  
  // Simple trend calculation
  const trend = recentPrices[recentPrices.length - 1] - recentPrices[0];
  const prediction = average + (trend * 0.3); // Conservative prediction
  
  return Math.round(prediction);
};

// GET /api/crop-prices - Get all crop prices
router.get('/', async (req, res) => {
  try {
    const { cropName, market, season, availability, limit = 50 } = req.query;
    const filter = {};
    
    if (cropName) filter.cropName = cropName;
    if (market) filter['market.name'] = market;
    if (season) filter.season = season;
    if (availability) filter.availability = availability;

    const cropPrices = await CropPrice.find(filter)
      .sort({ lastUpdated: -1 })
      .limit(parseInt(limit));
    
    res.json(cropPrices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/crop-prices/featured - Get featured crop prices for dashboard
router.get('/featured', async (req, res) => {
  try {
    const featuredCrops = await CropPrice.find({
      cropName: { $in: ['yam', 'cassava', 'maize', 'tomatoes', 'beans'] },
      'market.name': { $in: ['Igbaja Local Market', 'Ilorin Central Market'] }
    })
    .sort({ lastUpdated: -1 })
    .limit(10);
    
    res.json(featuredCrops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/crop-prices/analytics - Get comprehensive price analytics
router.get('/analytics', async (req, res) => {
  try {
    const { cropName, market, days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const filter = { lastUpdated: { $gte: startDate } };
    if (cropName) filter.cropName = cropName;
    if (market) filter['market.name'] = market;
    
    const analytics = await CropPrice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$cropName',
          averagePrice: { $avg: '$pricePerUnit.value' },
          minPrice: { $min: '$pricePerUnit.value' },
          maxPrice: { $max: '$pricePerUnit.value' },
          priceVolatility: { $stdDevPop: '$pricePerUnit.value' },
          totalRecords: { $sum: 1 },
          markets: { $addToSet: '$market.name' },
          latestPrice: { $last: '$pricePerUnit.value' },
          unit: { $last: '$pricePerUnit.unit' },
          cropNameYoruba: { $last: '$cropNameYoruba' }
        }
      },
      { $sort: { averagePrice: -1 } }
    ]);
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/crop-prices/predictions - Get price predictions
router.get('/predictions', async (req, res) => {
  try {
    const { cropName, market } = req.query;
    
    if (!cropName) {
      return res.status(400).json({ message: 'Crop name is required for predictions' });
    }
    
    const filter = { cropName };
    if (market) filter['market.name'] = market;
    
    // Get historical data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filter.lastUpdated = { $gte: thirtyDaysAgo };
    
    const historicalData = await CropPrice.find(filter)
      .sort({ lastUpdated: 1 });
    
    if (historicalData.length < 3) {
      return res.json({
        cropName,
        market: market || 'All markets',
        prediction: null,
        confidence: 'low',
        message: 'Insufficient historical data for prediction'
      });
    }
    
    const prediction = predictPrice(historicalData);
    const currentPrice = historicalData[historicalData.length - 1].pricePerUnit.value;
    const trend = calculateTrend(prediction, currentPrice);
    
    res.json({
      cropName,
      cropNameYoruba: historicalData[0].cropNameYoruba,
      market: market || 'All markets',
      currentPrice,
      predictedPrice: prediction,
      trend,
      confidence: historicalData.length > 10 ? 'high' : 'medium',
      predictionPeriod: '7 days',
      unit: historicalData[0].pricePerUnit.unit,
      historicalDataPoints: historicalData.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/crop-prices/market-analysis - Advanced market analysis
router.get('/market-analysis', async (req, res) => {
  try {
    const { cropName } = req.query;
    
    if (!cropName) {
      return res.status(400).json({ message: 'Crop name is required for market analysis' });
    }
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const analysis = await CropPrice.aggregate([
      { $match: { cropName, lastUpdated: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: '$market.name',
          averagePrice: { $avg: '$pricePerUnit.value' },
          minPrice: { $min: '$pricePerUnit.value' },
          maxPrice: { $max: '$pricePerUnit.value' },
          latestPrice: { $last: '$pricePerUnit.value' },
          availability: { $last: '$availability' },
          quality: { $last: '$quality' },
          unit: { $last: '$pricePerUnit.unit' },
          lastUpdated: { $last: '$lastUpdated' },
          priceCount: { $sum: 1 }
        }
      },
      { $sort: { averagePrice: 1 } }
    ]);
    
    // Calculate market insights
    const insights = {
      bestMarket: analysis[0],
      mostExpensive: analysis[analysis.length - 1],
      averageAcrossMarkets: analysis.reduce((sum, market) => sum + market.averagePrice, 0) / analysis.length,
      totalMarkets: analysis.length,
      priceRange: {
        min: Math.min(...analysis.map(m => m.minPrice)),
        max: Math.max(...analysis.map(m => m.maxPrice))
      }
    };
    
    res.json({
      cropName,
      analysis,
      insights,
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/crop-prices/trends - Get price trends
router.get('/trends', async (req, res) => {
  try {
    const { cropName, days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const filter = {
      lastUpdated: { $gte: startDate }
    };
    
    if (cropName) filter.cropName = cropName;
    
    const trends = await CropPrice.find(filter)
      .sort({ lastUpdated: 1 });
    
    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/crop-prices/:id - Get single crop price
router.get('/:id', async (req, res) => {
  try {
    const cropPrice = await CropPrice.findById(req.params.id);
    if (!cropPrice) {
      return res.status(404).json({ message: 'Crop price not found' });
    }
    res.json(cropPrice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/crop-prices - Create new crop price entry
router.post('/', async (req, res) => {
  try {
    const cropPrice = new CropPrice(req.body);
    const savedCropPrice = await cropPrice.save();
    
    // Emit real-time update (will be handled by socket.io)
    if (req.app.get('io')) {
      req.app.get('io').emit('priceUpdate', {
        type: 'new',
        data: savedCropPrice
      });
    }
    
    res.status(201).json(savedCropPrice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/crop-prices/:id - Update crop price
router.put('/:id', async (req, res) => {
  try {
    const updatedCropPrice = await CropPrice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedCropPrice) {
      return res.status(404).json({ message: 'Crop price not found' });
    }
    
    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('priceUpdate', {
        type: 'update',
        data: updatedCropPrice
      });
    }
    
    res.json(updatedCropPrice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/crop-prices/:id - Delete crop price
router.delete('/:id', async (req, res) => {
  try {
    const deletedCropPrice = await CropPrice.findByIdAndDelete(req.params.id);
    if (!deletedCropPrice) {
      return res.status(404).json({ message: 'Crop price not found' });
    }
    res.json({ message: 'Crop price deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/crop-prices/markets/comparison - Compare prices across markets
router.get('/markets/comparison', async (req, res) => {
  try {
    const { cropName } = req.query;
    
    if (!cropName) {
      return res.status(400).json({ message: 'Crop name is required' });
    }
    
    const comparison = await CropPrice.aggregate([
      { $match: { cropName: cropName } },
      {
        $group: {
          _id: '$market.name',
          averagePrice: { $avg: '$pricePerUnit.value' },
          latestPrice: { $last: '$pricePerUnit.value' },
          unit: { $last: '$pricePerUnit.unit' },
          lastUpdated: { $last: '$lastUpdated' },
          availability: { $last: '$availability' }
        }
      },
      { $sort: { averagePrice: 1 } }
    ]);
    
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE /api/crop-prices - Admin creates a new crop price
router.post('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const doc = await CropPrice.create(req.body);

    // Emit socket update if available
    try {
      const io = req.app.get('io');
      if (io) io.emit('priceUpdate', { type: 'new', data: doc });
    } catch (_) {}

    res.status(201).json(doc);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to create crop price' });
  }
});

// UPDATE /api/crop-prices/:id - Admin updates an existing crop price
router.put('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const updates = { ...req.body, lastUpdated: new Date() };
    const doc = await CropPrice.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!doc) return res.status(404).json({ message: 'Crop price not found' });

    // Emit socket update if available
    try {
      const io = req.app.get('io');
      if (io) io.emit('priceUpdate', { type: 'update', data: doc });
    } catch (_) {}

    res.json(doc);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to update crop price' });
  }
});

// DELETE /api/crop-prices/:id - Admin deletes a crop price
router.delete('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const doc = await CropPrice.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Crop price not found' });

    try {
      const io = req.app.get('io');
      if (io) io.emit('priceUpdate', { type: 'delete', data: { _id: req.params.id } });
    } catch (_) {}

    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to delete crop price' });
  }
});

module.exports = router;
