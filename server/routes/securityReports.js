const express = require('express');
const router = express.Router();
const SecurityReport = require('../models/SecurityReport');

// GET /api/security-reports - Get security reports (public ones only)
router.get('/', async (req, res) => {
  try {
    const { reportType, location, severity, status, limit = 20 } = req.query;
    const filter = { isPublic: true, verificationStatus: { $ne: 'false_report' } };
    
    if (reportType) filter.reportType = reportType;
    if (location) filter['location.area'] = location;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;

    const reports = await SecurityReport.find(filter)
      .select('-reporter -witnesses -evidence') // Exclude sensitive info
      .sort({ incidentTime: -1 })
      .limit(parseInt(limit));
    
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/security-reports/stats - Get security statistics
router.get('/stats', async (req, res) => {
  try {
    const { area } = req.query;
    const filter = { verificationStatus: { $ne: 'false_report' } };
    if (area) filter['location.area'] = area;

    const stats = await SecurityReport.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
          thisMonth: {
            $sum: {
              $cond: [{
                $gte: ['$incidentTime.reported', new Date(new Date().getFullYear(), new Date().getMonth(), 1)]
              }, 1, 0]
            }
          }
        }
      }
    ]);

    const typeStats = await SecurityReport.aggregate([
      { $match: filter },
      { $group: { _id: '$reportType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      overview: stats[0] || { total: 0, resolved: 0, critical: 0, thisMonth: 0 },
      byType: typeStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/security-reports - Create new security report
router.post('/', async (req, res) => {
  try {
    const report = new SecurityReport(req.body);
    const savedReport = await report.save();
    res.status(201).json({ 
      message: 'Report submitted successfully',
      reportId: savedReport._id 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/security-reports/:id - Get single report (limited info if not admin)
router.get('/:id', async (req, res) => {
  try {
    const report = await SecurityReport.findById(req.params.id)
      .select('-reporter -witnesses'); // Exclude sensitive info
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
