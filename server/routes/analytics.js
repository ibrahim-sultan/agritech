const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const { Sensor, SensorData } = require('../models/Sensor');
const Weather = require('../models/Weather');
const Alert = require('../models/Alert');

// GET /api/analytics/dashboard - Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const { farm } = req.query;
    const filter = farm ? { farm } : {};

    // Basic counts
    const [
      totalFarms,
      totalCrops,
      totalSensors,
      activeAlerts
    ] = await Promise.all([
      farm ? 1 : Farm.countDocuments(),
      Crop.countDocuments(filter),
      Sensor.countDocuments(filter),
      Alert.countDocuments({ ...filter, status: 'active' })
    ]);

    // Crop health distribution
    const cropHealth = await Crop.aggregate([
      ...(farm ? [{ $match: { farm: farm } }] : []),
      {
        $bucket: {
          groupBy: '$healthScore',
          boundaries: [0, 50, 70, 90, 100],
          default: 'other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // Growth stage distribution
    const growthStages = await Crop.aggregate([
      ...(farm ? [{ $match: { farm: farm } }] : []),
      {
        $group: {
          _id: '$growthStage',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent sensor readings (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentSensorData = await SensorData.aggregate([
      { $match: { timestamp: { $gte: yesterday } } },
      {
        $lookup: {
          from: 'sensors',
          localField: 'sensor',
          foreignField: '_id',
          as: 'sensorInfo'
        }
      },
      { $unwind: '$sensorInfo' },
      ...(farm ? [{ $match: { 'sensorInfo.farm': farm } }] : []),
      {
        $group: {
          _id: '$sensorInfo.type',
          avgValue: { $avg: '$value' },
          latestValue: { $last: '$value' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Alert severity distribution
    const alertSeverity = await Alert.aggregate([
      { $match: { ...filter, status: 'active' } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: {
        totalFarms,
        totalCrops,
        totalSensors,
        activeAlerts
      },
      cropHealth: cropHealth.reduce((acc, item) => {
        const key = item._id === 'other' ? 'other' : 
          item._id < 50 ? 'poor' :
          item._id < 70 ? 'fair' :
          item._id < 90 ? 'good' : 'excellent';
        acc[key] = item.count;
        return acc;
      }, {}),
      growthStages: growthStages.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      sensorReadings: recentSensorData.reduce((acc, item) => {
        acc[item._id] = {
          average: parseFloat(item.avgValue.toFixed(2)),
          latest: item.latestValue,
          readingsCount: item.count
        };
        return acc;
      }, {}),
      alertSeverity: alertSeverity.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/analytics/yield - Get yield analytics
router.get('/yield', async (req, res) => {
  try {
    const { farm, period = '12months' } = req.query;
    const filter = farm ? { farm } : {};

    // Calculate date range
    let startDate = new Date();
    if (period === '1month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === '6months') {
      startDate.setMonth(startDate.getMonth() - 6);
    } else {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const yieldData = await Crop.aggregate([
      {
        $match: {
          ...filter,
          status: 'harvested',
          actualHarvestDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$actualHarvestDate' },
            year: { $year: '$actualHarvestDate' },
            cropName: '$name'
          },
          totalYield: {
            $sum: '$yield.actual.value'
          },
          avgYield: {
            $avg: '$yield.actual.value'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json(yieldData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/analytics/weather-impact - Get weather impact on crops
router.get('/weather-impact', async (req, res) => {
  try {
    const { farm } = req.query;
    const filter = farm ? { farm } : {};

    const weatherImpact = await Weather.aggregate([
      { $match: { ...filter } },
      {
        $group: {
          _id: '$conditions',
          avgTemperature: { $avg: '$temperature.current' },
          avgHumidity: { $avg: '$humidity' },
          avgPrecipitation: { $avg: '$precipitation.amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(weatherImpact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/analytics/resource-usage - Get resource usage analytics
router.get('/resource-usage', async (req, res) => {
  try {
    const { farm } = req.query;
    const filter = farm ? { farm } : {};

    const [waterUsage, fertilizerUsage] = await Promise.all([
      Crop.aggregate([
        { $match: filter },
        { $unwind: '$irrigation' },
        {
          $group: {
            _id: '$irrigation.type',
            totalCrops: { $sum: 1 }
          }
        }
      ]),
      Crop.aggregate([
        { $match: filter },
        { $unwind: '$fertilizers' },
        {
          $group: {
            _id: '$fertilizers.type',
            totalApplications: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      irrigation: waterUsage.reduce((acc, item) => {
        acc[item._id] = item.totalCrops;
        return acc;
      }, {}),
      fertilizers: fertilizerUsage.reduce((acc, item) => {
        acc[item._id] = item.totalApplications;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/analytics/trends - Get trend analysis
router.get('/trends', async (req, res) => {
  try {
    const { farm, metric = 'health' } = req.query;
    const filter = farm ? { farm } : {};

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    let trends = [];

    if (metric === 'health') {
      trends = await Crop.aggregate([
        { $match: { ...filter, updatedAt: { $gte: last30Days } } },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } }
            },
            avgHealth: { $avg: '$healthScore' },
            cropCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.day': 1 } }
      ]);
    } else if (metric === 'alerts') {
      trends = await Alert.aggregate([
        { $match: { ...filter, createdAt: { $gte: last30Days } } },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              severity: '$severity'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.day': 1 } }
      ]);
    }

    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
