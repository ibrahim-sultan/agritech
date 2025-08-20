const express = require('express');
const router = express.Router();
const { Sensor, SensorData } = require('../models/Sensor');

// GET /api/sensors - Get all sensors
router.get('/', async (req, res) => {
  try {
    const { farm, type, status } = req.query;
    const filter = {};
    
    if (farm) filter.farm = farm;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const sensors = await Sensor.find(filter)
      .populate('farm', 'name location')
      .sort({ createdAt: -1 });
    
    res.json(sensors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/sensors/:id - Get single sensor
router.get('/:id', async (req, res) => {
  try {
    const sensor = await Sensor.findById(req.params.id).populate('farm');
    if (!sensor) {
      return res.status(404).json({ message: 'Sensor not found' });
    }
    res.json(sensor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/sensors - Create new sensor
router.post('/', async (req, res) => {
  try {
    const sensor = new Sensor(req.body);
    const savedSensor = await sensor.save();
    const populatedSensor = await Sensor.findById(savedSensor._id).populate('farm');
    res.status(201).json(populatedSensor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/sensors/:id - Update sensor
router.put('/:id', async (req, res) => {
  try {
    const updatedSensor = await Sensor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('farm');
    
    if (!updatedSensor) {
      return res.status(404).json({ message: 'Sensor not found' });
    }
    res.json(updatedSensor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/sensors/:id - Delete sensor
router.delete('/:id', async (req, res) => {
  try {
    const deletedSensor = await Sensor.findByIdAndDelete(req.params.id);
    if (!deletedSensor) {
      return res.status(404).json({ message: 'Sensor not found' });
    }
    
    // Also delete all sensor data
    await SensorData.deleteMany({ sensor: req.params.id });
    
    res.json({ message: 'Sensor and all its data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/sensors/:id/data - Get sensor data
router.get('/:id/data', async (req, res) => {
  try {
    const { from, to, limit = 100 } = req.query;
    const filter = { sensor: req.params.id };
    
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const sensorData = await SensorData.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json(sensorData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/sensors/:id/data - Add sensor reading
router.post('/:id/data', async (req, res) => {
  try {
    const sensor = await Sensor.findById(req.params.id);
    if (!sensor) {
      return res.status(404).json({ message: 'Sensor not found' });
    }

    const sensorData = new SensorData({
      sensor: req.params.id,
      ...req.body
    });

    const savedData = await sensorData.save();
    
    // Update sensor's last reading
    sensor.lastReading = {
      value: savedData.value,
      unit: savedData.unit,
      timestamp: savedData.timestamp
    };
    await sensor.save();

    res.status(201).json(savedData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/sensors/:id/analytics - Get sensor analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    // Calculate time range
    let startDate = new Date();
    switch (period) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setHours(startDate.getHours() - 24);
    }

    const sensorData = await SensorData.find({
      sensor: req.params.id,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });

    if (sensorData.length === 0) {
      return res.json({
        average: 0,
        min: 0,
        max: 0,
        latest: 0,
        trend: 'stable',
        dataPoints: []
      });
    }

    const values = sensorData.map(d => d.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const latest = values[values.length - 1];
    
    // Simple trend calculation
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    let trend = 'stable';
    if (secondAvg > firstAvg * 1.05) trend = 'increasing';
    else if (secondAvg < firstAvg * 0.95) trend = 'decreasing';

    res.json({
      average: parseFloat(average.toFixed(2)),
      min,
      max,
      latest,
      trend,
      dataPoints: sensorData.map(d => ({
        timestamp: d.timestamp,
        value: d.value,
        quality: d.quality
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
