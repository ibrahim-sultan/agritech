const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

// GET /api/farms - Get all farms
router.get('/', async (req, res) => {
  try {
    const farms = await Farm.find().sort({ createdAt: -1 });
    res.json(farms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/farms/:id - Get single farm
router.get('/:id', async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }
    res.json(farm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/farms - Create new farm
router.post('/', async (req, res) => {
  try {
    const farm = new Farm(req.body);
    const savedFarm = await farm.save();
    res.status(201).json(savedFarm);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/farms/:id - Update farm
router.put('/:id', async (req, res) => {
  try {
    const updatedFarm = await Farm.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedFarm) {
      return res.status(404).json({ message: 'Farm not found' });
    }
    res.json(updatedFarm);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/farms/:id - Delete farm
router.delete('/:id', async (req, res) => {
  try {
    const deletedFarm = await Farm.findByIdAndDelete(req.params.id);
    if (!deletedFarm) {
      return res.status(404).json({ message: 'Farm not found' });
    }
    res.json({ message: 'Farm deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/farms/:id/stats - Get farm statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const Crop = require('../models/Crop');
    const { Sensor } = require('../models/Sensor');
    const Alert = require('../models/Alert');

    const farm = await Farm.findById(req.params.id);
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    const [crops, sensors, alerts] = await Promise.all([
      Crop.find({ farm: req.params.id }),
      Sensor.find({ farm: req.params.id }),
      Alert.find({ farm: req.params.id, status: 'active' })
    ]);

    const stats = {
      totalCrops: crops.length,
      activeSensors: sensors.filter(s => s.status === 'active').length,
      activeAlerts: alerts.length,
      totalArea: crops.reduce((sum, crop) => sum + crop.area.value, 0),
      healthyCreops: crops.filter(c => c.healthScore > 80).length,
      harvestedCrops: crops.filter(c => c.status === 'harvested').length
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
