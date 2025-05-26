// const express = require('express');
const router = express.Router();
const {
  addFoodLog,
  getFoodLogs,
  deleteFoodLog,
  detectFoodWithImage,
  getTodayCalorieSummary,
} = require('../controllers/calorieController');

const { protect } = require('../middleware/authMiddleware');
const { uploadFoodImage } = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(protect);

// @route   POST /api/v1/calories/detect
// @desc    Upload food image, detect items + calories
// @access  Private
router.post('/detect', uploadFoodImage.single('foodImage'), detectFoodWithImage);

// @route   POST /api/v1/calories
// @desc    Log food manually or after detection
// @access  Private
router.post('/', addFoodLog);

// @route   GET /api/v1/calories
// @desc    Get all food logs for user
// @access  Private
router.get('/', getFoodLogs);

// @route   DELETE /api/v1/calories/:id
// @desc    Delete a food log
// @access  Private
router.delete('/:id', deleteFoodLog);

// @route   GET /api/v1/calories/summary/today
// @desc    Get today's total calories
// @access  Private
router.get('/summary/today', getTodayCalorieSummary);

module.exports = router;
