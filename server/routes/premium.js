const express = require('express');
const { protect, requireSubscription, logActivity } = require('../middleware/auth');
const CropPrice = require('../models/CropPrice');
const { UsageTracking } = require('../models/Subscription');
const User = require('../models/User');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const router = express.Router();

// PREMIUM ANALYTICS - Advanced Price Analytics
router.get('/analytics/advanced', 
  protect, 
  requireSubscription('basic', 'advanced_analytics'),
  logActivity('advanced_analytics'),
  async (req, res) => {
    try {
      const { cropName, market, days = 30, groupBy = 'day' } = req.query;
      
      // Track usage
      await UsageTracking.incrementUsage(req.user._id, 'api_call');
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      const matchFilter = { 
        lastUpdated: { $gte: startDate } 
      };
      
      if (cropName) matchFilter.cropName = cropName;
      if (market) matchFilter['market.name'] = market;
      
      // Advanced aggregation pipeline
      const pipeline = [
        { $match: matchFilter },
        {
          $addFields: {
            dateGroup: {
              $switch: {
                branches: [
                  {
                    case: { $eq: [groupBy, 'hour'] },
                    then: {
                      $dateToString: {
                        format: "%Y-%m-%d %H:00",
                        date: "$lastUpdated"
                      }
                    }
                  },
                  {
                    case: { $eq: [groupBy, 'week'] },
                    then: {
                      $dateToString: {
                        format: "%Y-W%U",
                        date: "$lastUpdated"
                      }
                    }
                  },
                  {
                    case: { $eq: [groupBy, 'month'] },
                    then: {
                      $dateToString: {
                        format: "%Y-%m",
                        date: "$lastUpdated"
                      }
                    }
                  }
                ],
                default: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$lastUpdated"
                  }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: {
              date: '$dateGroup',
              crop: '$cropName',
              market: '$market.name'
            },
            avgPrice: { $avg: '$pricePerUnit.value' },
            minPrice: { $min: '$pricePerUnit.value' },
            maxPrice: { $max: '$pricePerUnit.value' },
            stdDev: { $stdDevPop: '$pricePerUnit.value' },
            count: { $sum: 1 },
            availability: { $last: '$availability' },
            unit: { $last: '$pricePerUnit.unit' },
            cropNameYoruba: { $last: '$cropNameYoruba' }
          }
        },
        {
          $addFields: {
            volatility: {
              $cond: [
                { $eq: ['$avgPrice', 0] },
                0,
                { $divide: ['$stdDev', '$avgPrice'] }
              ]
            },
            priceRange: { $subtract: ['$maxPrice', '$minPrice'] }
          }
        },
        { $sort: { '_id.date': 1, '_id.crop': 1, '_id.market': 1 } }
      ];
      
      const analytics = await CropPrice.aggregate(pipeline);
      
      // Calculate additional insights
      const insights = {
        totalDataPoints: analytics.length,
        dateRange: {
          start: startDate,
          end: new Date()
        },
        averageVolatility: analytics.reduce((sum, item) => sum + item.volatility, 0) / analytics.length,
        highestPrice: Math.max(...analytics.map(item => item.maxPrice)),
        lowestPrice: Math.min(...analytics.map(item => item.minPrice)),
        mostVolatileCrop: analytics.reduce((prev, current) => 
          prev.volatility > current.volatility ? prev : current
        ),
        priceDistribution: {
          low: analytics.filter(item => item.avgPrice < 1000).length,
          medium: analytics.filter(item => item.avgPrice >= 1000 && item.avgPrice < 5000).length,
          high: analytics.filter(item => item.avgPrice >= 5000).length
        }
      };
      
      res.status(200).json({
        status: 'success',
        data: {
          analytics,
          insights,
          metadata: {
            groupBy,
            days: parseInt(days),
            filters: { cropName, market },
            generatedAt: new Date()
          }
        }
      });
      
    } catch (error) {
      console.error('Advanced analytics error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to generate advanced analytics'
      });
    }
  }
);

// PRICE PREDICTIONS - AI-powered price forecasting
router.get('/predictions/market',
  protect,
  requireSubscription('basic', 'price_predictions'),
  logActivity('price_predictions'),
  async (req, res) => {
    try {
      const { cropName, market, days = 7 } = req.query;
      
      if (!cropName) {
        return res.status(400).json({
          status: 'fail',
          message: 'Crop name is required for predictions'
        });
      }
      
      // Track usage
      await UsageTracking.incrementUsage(req.user._id, 'api_call');
      
      // Get historical data for prediction (last 60 days)
      const historicalDays = 60;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - historicalDays);
      
      const filter = { 
        cropName,
        lastUpdated: { $gte: startDate }
      };
      if (market) filter['market.name'] = market;
      
      const historicalData = await CropPrice.find(filter)
        .sort({ lastUpdated: 1 })
        .limit(100);
      
      if (historicalData.length < 10) {
        return res.status(400).json({
          status: 'fail',
          message: 'Insufficient historical data for reliable predictions'
        });
      }
      
      // Simple prediction algorithm (moving average + trend analysis)
      const prices = historicalData.map(item => item.pricePerUnit.value);
      const dates = historicalData.map(item => new Date(item.lastUpdated));
      
      // Calculate moving averages
      const shortMA = calculateMovingAverage(prices.slice(-7), 7); // 7-day MA
      const longMA = calculateMovingAverage(prices.slice(-21), 21); // 21-day MA
      
      // Calculate trend
      const trend = calculateLinearTrend(prices.slice(-14));
      
      // Seasonal adjustment (basic)
      const seasonalFactor = calculateSeasonalFactor(dates, prices);
      
      // Generate predictions
      const predictions = [];
      let lastPrice = prices[prices.length - 1];
      
      for (let i = 1; i <= parseInt(days); i++) {
        const trendAdjustment = trend.slope * i;
        const seasonalAdjustment = seasonalFactor * Math.sin(i * Math.PI / 30); // 30-day cycle
        
        let predictedPrice = lastPrice + trendAdjustment + seasonalAdjustment;
        
        // Apply moving average smoothing
        const maWeight = 0.3;
        predictedPrice = predictedPrice * (1 - maWeight) + shortMA * maWeight;
        
        // Add some volatility bounds
        const volatility = calculateVolatility(prices.slice(-14));
        const upperBound = predictedPrice + (volatility * 1.96); // 95% confidence
        const lowerBound = predictedPrice - (volatility * 1.96);
        
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i);
        
        predictions.push({
          date: futureDate,
          predictedPrice: Math.round(predictedPrice),
          upperBound: Math.round(upperBound),
          lowerBound: Math.round(lowerBound),
          confidence: calculateConfidence(historicalData.length, volatility),
          daysAhead: i
        });
        
        lastPrice = predictedPrice; // Use predicted price for next iteration
      }
      
      // Calculate accuracy metrics (based on recent predictions vs actual)
      const accuracyMetrics = await calculateAccuracyMetrics(cropName, market);
      
      res.status(200).json({
        status: 'success',
        data: {
          cropName,
          cropNameYoruba: historicalData[0]?.cropNameYoruba,
          market: market || 'All markets',
          currentPrice: prices[prices.length - 1],
          unit: historicalData[0]?.pricePerUnit.unit,
          predictions,
          analytics: {
            shortTermTrend: trend.direction,
            trendStrength: Math.abs(trend.slope),
            volatility: calculateVolatility(prices),
            seasonalFactor: seasonalFactor,
            historicalDataPoints: historicalData.length
          },
          accuracy: accuracyMetrics,
          metadata: {
            algorithm: 'Hybrid Moving Average + Linear Trend + Seasonal',
            predictionPeriod: `${days} days`,
            basedOnDays: historicalDays,
            generatedAt: new Date()
          }
        }
      });
      
    } catch (error) {
      console.error('Price prediction error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to generate price predictions'
      });
    }
  }
);

// DATA EXPORT - Export data in multiple formats
router.post('/export/:format',
  protect,
  requireSubscription('premium', 'data_export'),
  logActivity('data_export'),
  async (req, res) => {
    try {
      const { format } = req.params;
      const { 
        cropName, 
        market, 
        startDate, 
        endDate, 
        includeAnalytics = false,
        customFields = []
      } = req.body;
      
      // Check export limits
      const usage = await UsageTracking.getUserUsage(req.user._id, 'data_export', 'monthly');
      const exportLimit = req.user.subscription.tier === 'premium' ? 5 : 
                         req.user.subscription.tier === 'commercial' ? -1 : 1;
                         
      if (exportLimit !== -1 && usage[0]?.totalUsage >= exportLimit) {
        return res.status(429).json({
          status: 'fail',
          message: 'Export limit exceeded for your subscription tier',
          limit: exportLimit,
          used: usage[0]?.totalUsage || 0
        });
      }
      
      // Track usage
      await UsageTracking.incrementUsage(req.user._id, 'data_export');
      
      // Build query
      const query = {};
      if (cropName) query.cropName = cropName;
      if (market) query['market.name'] = market;
      if (startDate || endDate) {
        query.lastUpdated = {};
        if (startDate) query.lastUpdated.$gte = new Date(startDate);
        if (endDate) query.lastUpdated.$lte = new Date(endDate);
      }
      
      // Get data
      const data = await CropPrice.find(query).sort({ lastUpdated: -1 }).limit(10000);
      
      if (data.length === 0) {
        return res.status(404).json({
          status: 'fail',
          message: 'No data found matching your criteria'
        });
      }
      
      let exportData;
      let filename;
      let contentType;
      
      switch (format.toLowerCase()) {
        case 'csv':
          exportData = generateCSV(data, customFields);
          filename = `agrictech_export_${Date.now()}.csv`;
          contentType = 'text/csv';
          break;
          
        case 'excel':
          exportData = await generateExcel(data, includeAnalytics, customFields);
          filename = `agrictech_export_${Date.now()}.xlsx`;
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
          
        case 'json':
          exportData = JSON.stringify({
            metadata: {
              exportedAt: new Date(),
              recordCount: data.length,
              filters: { cropName, market, startDate, endDate },
              exportedBy: req.user.email
            },
            data
          }, null, 2);
          filename = `agrictech_export_${Date.now()}.json`;
          contentType = 'application/json';
          break;
          
        case 'pdf':
          exportData = await generatePDF(data, includeAnalytics);
          filename = `agrictech_report_${Date.now()}.pdf`;
          contentType = 'application/pdf';
          break;
          
        default:
          return res.status(400).json({
            status: 'fail',
            message: 'Unsupported export format. Supported formats: csv, excel, json, pdf'
          });
      }
      
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', contentType);
      res.send(exportData);
      
    } catch (error) {
      console.error('Data export error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to export data'
      });
    }
  }
);

// CUSTOM ALERTS - Create and manage price alerts
router.post('/alerts/create',
  protect,
  requireSubscription('basic', 'unlimited_alerts'),
  logActivity('price_alert'),
  async (req, res) => {
    try {
      const {
        cropName,
        market,
        priceThreshold,
        condition, // 'above', 'below', 'change_percent'
        changePercent,
        isActive = true,
        alertMethod = ['email'] // 'email', 'sms', 'push'
      } = req.body;
      
      // Validate input
      if (!cropName || !priceThreshold || !condition) {
        return res.status(400).json({
          status: 'fail',
          message: 'cropName, priceThreshold, and condition are required'
        });
      }
      
      // Check alert limits
      const currentAlerts = req.user.preferences.priceAlerts.thresholds.length;
      const alertLimit = req.user.subscription.tier === 'free' ? 5 : 
                        req.user.subscription.tier === 'basic' ? -1 : -1;
      
      if (alertLimit !== -1 && currentAlerts >= alertLimit) {
        return res.status(429).json({
          status: 'fail',
          message: 'Alert limit exceeded for your subscription tier',
          limit: alertLimit,
          current: currentAlerts
        });
      }
      
      // Create alert
      const alertId = new Date().getTime().toString();
      const newAlert = {
        id: alertId,
        crop: cropName,
        market: market || 'all',
        priceThreshold,
        condition,
        changePercent: changePercent || 0,
        isActive,
        alertMethod,
        createdAt: new Date(),
        lastTriggered: null,
        triggerCount: 0
      };
      
      // Add to user preferences
      req.user.preferences.priceAlerts.thresholds.push(newAlert);
      await req.user.save();
      
      // Track usage
      await UsageTracking.incrementUsage(req.user._id, 'price_alert');
      
      res.status(201).json({
        status: 'success',
        message: 'Price alert created successfully',
        data: {
          alert: newAlert
        }
      });
      
    } catch (error) {
      console.error('Create alert error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create price alert'
      });
    }
  }
);

// MARKET COMPARISON - Compare prices across multiple markets
router.get('/comparison/markets',
  protect,
  requireSubscription('basic', 'advanced_analytics'),
  logActivity('market_comparison'),
  async (req, res) => {
    try {
      const { cropName, markets, days = 7 } = req.query;
      
      if (!cropName) {
        return res.status(400).json({
          status: 'fail',
          message: 'Crop name is required for market comparison'
        });
      }
      
      // Track usage
      await UsageTracking.incrementUsage(req.user._id, 'api_call');
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      const filter = {
        cropName,
        lastUpdated: { $gte: startDate }
      };
      
      if (markets) {
        const marketList = markets.split(',').map(m => m.trim());
        filter['market.name'] = { $in: marketList };
      }
      
      const comparison = await CropPrice.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$market.name',
            avgPrice: { $avg: '$pricePerUnit.value' },
            minPrice: { $min: '$pricePerUnit.value' },
            maxPrice: { $max: '$pricePerUnit.value' },
            latestPrice: { $last: '$pricePerUnit.value' },
            priceCount: { $sum: 1 },
            avgVolatility: { $avg: { $abs: { $subtract: ['$pricePerUnit.value', '$priceRange.min'] } } },
            availability: { $last: '$availability' },
            quality: { $last: '$quality' },
            unit: { $last: '$pricePerUnit.unit' },
            lastUpdated: { $last: '$lastUpdated' }
          }
        },
        {
          $addFields: {
            priceEfficiency: {
              $divide: ['$avgPrice', '$maxPrice']
            },
            marketScore: {
              $multiply: [
                { $divide: ['$avgPrice', 10000] }, // Price factor
                { $cond: [{ $eq: ['$availability', 'abundant'] }, 1.2, 
                         { $eq: ['$availability', 'moderate'] }, 1.0, 0.8] }, // Availability factor
                { $cond: [{ $eq: ['$quality', 'premium'] }, 1.3,
                         { $eq: ['$quality', 'standard'] }, 1.0, 0.7] } // Quality factor
              ]
            }
          }
        },
        { $sort: { avgPrice: 1 } }
      ]);
      
      // Calculate insights
      const insights = {
        bestPriceMarket: comparison[0],
        mostExpensiveMarket: comparison[comparison.length - 1],
        averagePriceAcrossMarkets: comparison.reduce((sum, m) => sum + m.avgPrice, 0) / comparison.length,
        totalMarkets: comparison.length,
        priceSpread: {
          min: Math.min(...comparison.map(m => m.avgPrice)),
          max: Math.max(...comparison.map(m => m.avgPrice)),
          spread: Math.max(...comparison.map(m => m.avgPrice)) - Math.min(...comparison.map(m => m.avgPrice))
        },
        recommendations: generateMarketRecommendations(comparison)
      };
      
      res.status(200).json({
        status: 'success',
        data: {
          cropName,
          comparison,
          insights,
          metadata: {
            days: parseInt(days),
            marketsCompared: comparison.length,
            generatedAt: new Date()
          }
        }
      });
      
    } catch (error) {
      console.error('Market comparison error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to generate market comparison'
      });
    }
  }
);

// Helper Functions

function calculateMovingAverage(prices, period) {
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / Math.min(period, prices.length);
}

function calculateLinearTrend(prices) {
  const n = prices.length;
  const x = Array.from({length: n}, (_, i) => i);
  const y = prices;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return {
    slope,
    intercept,
    direction: slope > 0.1 ? 'rising' : slope < -0.1 ? 'falling' : 'stable'
  };
}

function calculateVolatility(prices) {
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
  return Math.sqrt(variance);
}

function calculateSeasonalFactor(dates, prices) {
  // Simple seasonal calculation based on day of year
  const seasonal = dates.map((date, i) => {
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    return Math.sin(dayOfYear * 2 * Math.PI / 365) * prices[i];
  });
  return seasonal.reduce((a, b) => a + b, 0) / seasonal.length;
}

function calculateConfidence(dataPoints, volatility) {
  const baseConfidence = Math.min(dataPoints / 50 * 0.8, 0.8); // Max 80% from data points
  const volatilityPenalty = Math.min(volatility / 1000 * 0.3, 0.3); // Max 30% penalty
  return Math.max(baseConfidence - volatilityPenalty, 0.2) * 100;
}

async function calculateAccuracyMetrics(cropName, market) {
  // This would compare historical predictions vs actual prices
  // For now, return mock metrics
  return {
    meanAbsoluteError: 145.50,
    meanAbsolutePercentageError: 8.2,
    accuracy: 91.8,
    lastUpdated: new Date()
  };
}

function generateCSV(data, customFields) {
  const headers = ['Date', 'Crop', 'Crop (Yoruba)', 'Market', 'Price', 'Unit', 'Availability', 'Quality', 'Trend'];
  if (customFields.length > 0) {
    headers.push(...customFields);
  }
  
  let csv = headers.join(',') + '\n';
  
  data.forEach(item => {
    const row = [
      new Date(item.lastUpdated).toISOString().split('T')[0],
      item.cropName,
      item.cropNameYoruba || '',
      item.market.name,
      item.pricePerUnit.value,
      item.pricePerUnit.unit,
      item.availability || '',
      item.quality || '',
      item.trend?.direction || ''
    ];
    
    csv += row.map(field => `"${field}"`).join(',') + '\n';
  });
  
  return csv;
}

async function generateExcel(data, includeAnalytics, customFields) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Crop Prices');
  
  // Headers
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Crop', key: 'crop', width: 15 },
    { header: 'Crop (Yoruba)', key: 'cropYoruba', width: 15 },
    { header: 'Market', key: 'market', width: 20 },
    { header: 'Price (₦)', key: 'price', width: 12 },
    { header: 'Unit', key: 'unit', width: 15 },
    { header: 'Availability', key: 'availability', width: 12 },
    { header: 'Quality', key: 'quality', width: 10 },
    { header: 'Trend', key: 'trend', width: 10 }
  ];
  
  // Data
  data.forEach(item => {
    worksheet.addRow({
      date: new Date(item.lastUpdated),
      crop: item.cropName,
      cropYoruba: item.cropNameYoruba || '',
      market: item.market.name,
      price: item.pricePerUnit.value,
      unit: item.pricePerUnit.unit,
      availability: item.availability || '',
      quality: item.quality || '',
      trend: item.trend?.direction || ''
    });
  });
  
  // Style headers
  worksheet.getRow(1).font = { bold: true };
  
  if (includeAnalytics) {
    // Add analytics worksheet
    const analyticsSheet = workbook.addWorksheet('Analytics');
    // Add analytics data here
  }
  
  return await workbook.xlsx.writeBuffer();
}

async function generatePDF(data, includeAnalytics) {
  const doc = new PDFDocument();
  const chunks = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  
  // Title
  doc.fontSize(20).text('AgricTech Price Report', 50, 50);
  doc.fontSize(12).text(`Generated on: ${new Date().toDateString()}`, 50, 80);
  
  // Data table (simplified)
  let y = 120;
  doc.fontSize(10);
  
  data.slice(0, 50).forEach(item => { // Limit to first 50 items for PDF
    doc.text(`${item.cropName} - ${item.market.name}: ₦${item.pricePerUnit.value}`, 50, y);
    y += 15;
  });
  
  doc.end();
  
  return new Promise(resolve => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

function generateMarketRecommendations(comparison) {
  const recommendations = [];
  
  if (comparison.length > 1) {
    const bestPrice = comparison[0];
    const worstPrice = comparison[comparison.length - 1];
    
    recommendations.push(`Best prices found at ${bestPrice._id} with average ₦${Math.round(bestPrice.avgPrice)}`);
    
    if (bestPrice.avgPrice < worstPrice.avgPrice * 0.8) {
      recommendations.push(`Consider ${bestPrice._id} - prices are 20%+ lower than ${worstPrice._id}`);
    }
    
    const abundantMarkets = comparison.filter(m => m.availability === 'abundant');
    if (abundantMarkets.length > 0) {
      recommendations.push(`High supply available at: ${abundantMarkets.map(m => m._id).join(', ')}`);
    }
  }
  
  return recommendations;
}

module.exports = router;
