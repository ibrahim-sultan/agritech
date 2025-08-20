const express = require('express');
const router = express.Router();
const YouthTraining = require('../models/YouthTraining');

// GET /api/youth-training - Get all training courses
router.get('/', async (req, res) => {
  try {
    const { category, level, targetAudience, isFree, limit = 20 } = req.query;
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (targetAudience) filter.targetAudience = { $in: [targetAudience] };
    if (isFree === 'true') filter.isFree = true;

    const courses = await YouthTraining.find(filter)
      .sort({ enrollments: -1, rating: -1 })
      .limit(parseInt(limit));
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/youth-training/featured - Get featured courses
router.get('/featured', async (req, res) => {
  try {
    const featured = await YouthTraining.find({
      isActive: true,
      isFree: true,
      targetAudience: { $in: ['rural_youth', 'all'] }
    })
    .sort({ rating: -1, enrollments: -1 })
    .limit(6);
    
    res.json(featured);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/youth-training/:id - Get single course
router.get('/:id', async (req, res) => {
  try {
    const course = await YouthTraining.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/youth-training/:id/enroll - Enroll in course
router.post('/:id/enroll', async (req, res) => {
  try {
    const course = await YouthTraining.findByIdAndUpdate(
      req.params.id,
      { $inc: { enrollments: 1 } },
      { new: true }
    );
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Enrolled successfully', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
