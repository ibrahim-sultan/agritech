const express = require('express');
const router = express.Router();
const Crop = require('../models/Crop');

// GET /api/crops - Get all crops
router.get('/', async (req, res) => {
  try {
    const { farm, status, growthStage } = req.query;
    const filter = {};
    
    if (farm) filter.farm = farm;
    if (status) filter.status = status;
    if (growthStage) filter.growthStage = growthStage;

    const crops = await Crop.find(filter)
      .populate('farm', 'name location')
      .sort({ createdAt: -1 });
    
    res.json(crops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/crops/:id - Get single crop
router.get('/:id', async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id).populate('farm');
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }
    res.json(crop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/crops - Create new crop
router.post('/', async (req, res) => {
  try {
    const crop = new Crop(req.body);
    const savedCrop = await crop.save();
    const populatedCrop = await Crop.findById(savedCrop._id).populate('farm');
    res.status(201).json(populatedCrop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/crops/:id - Update crop
router.put('/:id', async (req, res) => {
  try {
    const updatedCrop = await Crop.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('farm');
    
    if (!updatedCrop) {
      return res.status(404).json({ message: 'Crop not found' });
    }
    res.json(updatedCrop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/crops/:id - Delete crop
router.delete('/:id', async (req, res) => {
  try {
    const deletedCrop = await Crop.findByIdAndDelete(req.params.id);
    if (!deletedCrop) {
      return res.status(404).json({ message: 'Crop not found' });
    }
    res.json({ message: 'Crop deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/crops/:id/growth-stage - Update crop growth stage
router.put('/:id/growth-stage', async (req, res) => {
  try {
    const { growthStage, healthScore } = req.body;
    const updatedCrop = await Crop.findByIdAndUpdate(
      req.params.id,
      { growthStage, healthScore },
      { new: true, runValidators: true }
    ).populate('farm');
    
    if (!updatedCrop) {
      return res.status(404).json({ message: 'Crop not found' });
    }
    res.json(updatedCrop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/crops/:id/irrigation - Record irrigation
router.post('/:id/irrigation', async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    crop.irrigation.lastWatered = new Date();
    if (req.body.frequency) {
      crop.irrigation.frequency = req.body.frequency;
    }
    
    const savedCrop = await crop.save();
    const populatedCrop = await Crop.findById(savedCrop._id).populate('farm');
    res.json(populatedCrop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/crops/:id/fertilizers - Add fertilizer application
router.post('/:id/fertilizers', async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    crop.fertilizers.push({
      ...req.body,
      applicationDate: new Date()
    });
    
    const savedCrop = await crop.save();
    const populatedCrop = await Crop.findById(savedCrop._id).populate('farm');
    res.json(populatedCrop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/crops/:id/pesticides - Add pesticide application
router.post('/:id/pesticides', async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    crop.pesticides.push({
      ...req.body,
      applicationDate: new Date()
    });
    
    const savedCrop = await crop.save();
    const populatedCrop = await Crop.findById(savedCrop._id).populate('farm');
    res.json(populatedCrop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
