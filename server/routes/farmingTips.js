const express = require('express');
const router = express.Router();
const FarmingTip = require('../models/FarmingTip');

// GET /api/farming-tips - Get all farming tips
router.get('/', async (req, res) => {
  try {
    const { category, targetCrops, difficulty, season, featured, limit = 20 } = req.query;
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (targetCrops) filter.targetCrops = { $in: [targetCrops] };
    if (difficulty) filter.difficulty = difficulty;
    if (season) filter.season = { $in: [season] };
    if (featured === 'true') filter.isFeatured = true;

    const farmingTips = await FarmingTip.find(filter)
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(farmingTips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/farming-tips/featured - Get featured tips for dashboard
router.get('/featured', async (req, res) => {
  try {
    const featuredTips = await FarmingTip.find({
      isActive: true,
      isFeatured: true
    })
    .sort({ createdAt: -1 })
    .limit(5);
    
    res.json(featuredTips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/farming-tips/weekly - Get weekly tips
router.get('/weekly', async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyTips = await FarmingTip.find({
      isActive: true,
      createdAt: { $gte: oneWeekAgo }
    })
    .sort({ createdAt: -1 })
    .limit(10);
    
    res.json(weeklyTips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/farming-tips/search - Search farming tips
router.get('/search', async (req, res) => {
  try {
    const { q, lang = 'english' } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const searchField = lang === 'yoruba' ? 'title.yoruba' : 'title.english';
    const contentField = lang === 'yoruba' ? 'content.yoruba' : 'content.english';
    
    const tips = await FarmingTip.find({
      isActive: true,
      $or: [
        { [searchField]: { $regex: q, $options: 'i' } },
        { [contentField]: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    })
    .sort({ views: -1, likes: -1 })
    .limit(15);
    
    res.json(tips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/farming-tips/:id - Get single farming tip
router.get('/:id', async (req, res) => {
  try {
    const tip = await FarmingTip.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    
    if (!tip) {
      return res.status(404).json({ message: 'Farming tip not found' });
    }
    res.json(tip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/farming-tips - Create new farming tip
router.post('/', async (req, res) => {
  try {
    const tip = new FarmingTip(req.body);
    const savedTip = await tip.save();
    res.status(201).json(savedTip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/farming-tips/:id - Update farming tip
router.put('/:id', async (req, res) => {
  try {
    const updatedTip = await FarmingTip.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedTip) {
      return res.status(404).json({ message: 'Farming tip not found' });
    }
    res.json(updatedTip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/farming-tips/:id/like - Like a farming tip
router.put('/:id/like', async (req, res) => {
  try {
    const tip = await FarmingTip.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    
    if (!tip) {
      return res.status(404).json({ message: 'Farming tip not found' });
    }
    res.json(tip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/farming-tips/categories/stats - Get category statistics
router.get('/categories/stats', async (req, res) => {
  try {
    const stats = await FarmingTip.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' },
          avgRating: { $avg: '$effectiveness.rating' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
