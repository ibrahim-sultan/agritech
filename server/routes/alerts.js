const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

// GET /api/alerts - Get all alerts
router.get('/', async (req, res) => {
  try {
    const { farm, status, severity, type, limit = 50 } = req.query;
    const filter = {};
    
    if (farm) filter.farm = farm;
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;

    const alerts = await Alert.find(filter)
      .populate('farm', 'name location')
      .populate('crop', 'name variety')
      .populate('sensor', 'name type')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/alerts/:id - Get single alert
router.get('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('farm')
      .populate('crop')
      .populate('sensor');
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/alerts - Create new alert
router.post('/', async (req, res) => {
  try {
    const alert = new Alert(req.body);
    const savedAlert = await alert.save();
    const populatedAlert = await Alert.findById(savedAlert._id)
      .populate('farm')
      .populate('crop')
      .populate('sensor');
    
    res.status(201).json(populatedAlert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/alerts/:id - Update alert
router.put('/:id', async (req, res) => {
  try {
    const updatedAlert = await Alert.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('farm')
    .populate('crop')
    .populate('sensor');
    
    if (!updatedAlert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.json(updatedAlert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/alerts/:id/acknowledge - Acknowledge alert
router.put('/:id/acknowledge', async (req, res) => {
  try {
    const { acknowledgedBy } = req.body;
    
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'acknowledged',
        acknowledgedAt: new Date(),
        acknowledgedBy
      },
      { new: true }
    )
    .populate('farm')
    .populate('crop')
    .populate('sensor');
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    res.json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/alerts/:id/resolve - Resolve alert
router.put('/:id/resolve', async (req, res) => {
  try {
    const { actionTaken } = req.body;
    
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedAt: new Date(),
        actionTaken: {
          description: actionTaken.description,
          timestamp: new Date(),
          takenBy: actionTaken.takenBy
        }
      },
      { new: true }
    )
    .populate('farm')
    .populate('crop')
    .populate('sensor');
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    res.json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/alerts/:id - Delete alert
router.delete('/:id', async (req, res) => {
  try {
    const deletedAlert = await Alert.findByIdAndDelete(req.params.id);
    if (!deletedAlert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/alerts/stats - Get alert statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { farm } = req.query;
    const filter = {};
    if (farm) filter.farm = farm;

    const [total, active, critical, resolved] = await Promise.all([
      Alert.countDocuments(filter),
      Alert.countDocuments({ ...filter, status: 'active' }),
      Alert.countDocuments({ ...filter, severity: 'critical', status: 'active' }),
      Alert.countDocuments({ ...filter, status: 'resolved' })
    ]);

    const typeStats = await Alert.aggregate([
      { $match: filter },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const severityStats = await Alert.aggregate([
      { $match: { ...filter, status: 'active' } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    res.json({
      total,
      active,
      critical,
      resolved,
      byType: typeStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      bySeverity: severityStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
