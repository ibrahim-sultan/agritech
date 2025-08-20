const express = require('express');
const router = express.Router();
const Weather = require('../models/Weather');

// GET /api/weather - Get weather data
router.get('/', async (req, res) => {
  try {
    const { farm, forecast, limit = 10 } = req.query;
    const filter = {};
    
    if (farm) filter.farm = farm;
    if (forecast) filter.forecast = forecast;

    const weatherData = await Weather.find(filter)
      .populate('farm', 'name location')
      .sort({ date: -1 })
      .limit(parseInt(limit));
    
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/weather/:id - Get single weather record
router.get('/:id', async (req, res) => {
  try {
    const weather = await Weather.findById(req.params.id).populate('farm');
    if (!weather) {
      return res.status(404).json({ message: 'Weather data not found' });
    }
    res.json(weather);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/weather - Create weather record
router.post('/', async (req, res) => {
  try {
    const weather = new Weather(req.body);
    const savedWeather = await weather.save();
    const populatedWeather = await Weather.findById(savedWeather._id).populate('farm');
    res.status(201).json(populatedWeather);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/weather/:id - Update weather record
router.put('/:id', async (req, res) => {
  try {
    const updatedWeather = await Weather.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('farm');
    
    if (!updatedWeather) {
      return res.status(404).json({ message: 'Weather data not found' });
    }
    res.json(updatedWeather);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/weather/:id - Delete weather record
router.delete('/:id', async (req, res) => {
  try {
    const deletedWeather = await Weather.findByIdAndDelete(req.params.id);
    if (!deletedWeather) {
      return res.status(404).json({ message: 'Weather data not found' });
    }
    res.json({ message: 'Weather data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/weather/farm/:farmId/current - Get current weather for a farm
router.get('/farm/:farmId/current', async (req, res) => {
  try {
    const currentWeather = await Weather.findOne({
      farm: req.params.farmId,
      forecast: 'current'
    })
    .populate('farm')
    .sort({ date: -1 });
    
    if (!currentWeather) {
      return res.status(404).json({ message: 'Current weather data not found' });
    }
    
    res.json(currentWeather);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/weather/farm/:farmId/forecast - Get weather forecast for a farm
router.get('/farm/:farmId/forecast', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const forecast = await Weather.find({
      farm: req.params.farmId,
      forecast: { $in: ['1_day', '3_day', '7_day'] }
    })
    .populate('farm')
    .sort({ date: 1 })
    .limit(parseInt(days));
    
    res.json(forecast);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
