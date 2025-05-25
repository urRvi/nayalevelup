const express = require('express');
const router = express.Router();
const {
  addFoodLog,
  getFoodLogs,
  deleteFoodLog,
  detectFoodWithImage,
  getTodayCalorieSummary, // Added new controller function
} = require('../controllers/calorieController');
const { protect } = require('../middleware/authMiddleware');
const { uploadFoodImage } = require('../middleware/uploadMiddleware'); // Correctly import the named export

// All routes are protected
router.use(protect);

// @route   GET /api/calories/summary/today
// @desc    Get today's calorie summary
// @access  Private
router.get('/summary/today', getTodayCalorieSummary);

// @route   POST /api/calories/detect
// @desc    Detect food from an image and log it
// @access  Private
router.post('/detect', uploadFoodImage.single('foodImage'), detectFoodWithImage);

// @route   POST /api/calories
// @desc    Add a food log entry
// @access  Private
router.post('/', addFoodLog);

// @route   GET /api/calories
// @desc    Get all food log entries for a user
// @access  Private
router.get('/', getFoodLogs);

// @route   DELETE /api/calories/:id
// @desc    Delete a food log entry
// @access  Private
router.delete('/:id', deleteFoodLog);

module.exports = router;
