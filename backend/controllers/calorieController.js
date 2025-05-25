const FoodLog = require('../models/FoodLog');
const User = require('../models/User'); // Required for checking user existence
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Optional, but recommended for https URLs
});
// Note: uploadFoodImage is a middleware, so it's used in routes, not directly imported for use here.

// @desc    Add a food log entry
// @route   POST /api/calories
// @access  Private
exports.addFoodLog = async (req, res) => {
  try {
    const { foodName, calories, protein, carbs, fats, mealType, eatenAt, imageUrl } = req.body;
    const userId = req.user.id;

    // Basic validation
    if (!foodName || calories === undefined) {
      return res.status(400).json({ message: 'Food name and calories are required' });
    }

    const newFoodLog = new FoodLog({
      user: userId,
      foodName,
      calories,
      protein,
      carbs,
      fats,
      mealType,
      eatenAt,
      imageUrl,
    });

    const savedFoodLog = await newFoodLog.save();
    res.status(201).json(savedFoodLog);
  } catch (error) {
    console.error('Error adding food log:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while adding food log' });
  }
};

// @desc    Get all food log entries for a user
// @route   GET /api/calories
// @access  Private
exports.getFoodLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    let query = { user: userId };

    if (startDate) {
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0); // Set to the beginning of the day
      query.eatenAt = { ...query.eatenAt, $gte: startOfDay };
    }

    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999); // Set to the end of the day
      query.eatenAt = { ...query.eatenAt, $lte: endOfDay };
    }
    
    // If only startDate is provided, and no endDate, consider it a query for a single day
    // (Mongoose handles $gte and $lte correctly if only one is present in the object for eatenAt)

    const foodLogs = await FoodLog.find(query).sort({ eatenAt: -1 });
    res.status(200).json(foodLogs);
  } catch (error) {
    console.error('Error fetching food logs with date filter:', error);
    if (error instanceof URIError || error.message.includes('date')) { // Basic check for invalid date strings
        return res.status(400).json({ message: 'Invalid date format provided for filtering.' });
    }
    res.status(500).json({ message: 'Server error while fetching food logs' });
  }
};

// @desc    Delete a food log entry
// @route   DELETE /api/calories/:id
// @access  Private
exports.deleteFoodLog = async (req, res) => {
  try {
    const foodLogId = req.params.id;
    const userId = req.user.id;

    const foodLog = await FoodLog.findById(foodLogId);

    if (!foodLog) {
      return res.status(404).json({ message: 'Food log not found' });
    }

    // Ensure the user owns this food log
    if (foodLog.user.toString() !== userId) {
      return res.status(403).json({ message: 'User not authorized to delete this log' });
    }

    await foodLog.deleteOne(); // Corrected from remove() which is deprecated

    res.status(200).json({ message: 'Food log deleted successfully' });
  } catch (error) {
    console.error('Error deleting food log:', error);
    if (error.name === 'CastError') { // Handle invalid ObjectId for foodLogId
        return res.status(400).json({ message: 'Invalid food log ID format' });
    }
    res.status(500).json({ message: 'Server error while deleting food log' });
  }
};

// @desc    Detect food from image and log it
// @route   POST /api/calories/detect
// @access  Private
exports.detectFoodWithImage = async (req, res) => {
  const apiKey = process.env.SPOONACULAR_API_KEY;

  if (!apiKey) {
    console.error('Spoonacular API key is missing.');
    return res.status(500).json({ message: 'Server configuration error: Missing API key.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded. Please upload an image.' });
  }

  const imagePath = req.file.path;
  let cloudinaryUrl; // To store the Cloudinary URL

  try {
    // Step 2: Upload image to Cloudinary
    try {
      const cloudinaryResult = await cloudinary.uploader.upload(imagePath, {
        folder: 'food_logs', // Optional: organize in Cloudinary
      });
      cloudinaryUrl = cloudinaryResult.secure_url;
    } catch (cloudinaryError) {
      console.error('Cloudinary upload failed:', cloudinaryError);
      // Cleanup the local temp file
      fs.unlink(imagePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting temp image file after Cloudinary failure:', unlinkErr);
      });
      return res.status(500).json({ message: 'Failed to upload image to Cloudinary.', details: cloudinaryError.message });
    }

    // Step 4: Make Spoonacular API call (Spoonacular still uses the local path for now)
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));

    const spoonacularUrl = `https://api.spoonacular.com/food/images/analyze?apiKey=${apiKey}`;

    let spoonacularResponse;
    try {
      spoonacularResponse = await axios.post(spoonacularUrl, formData, {
        headers: {
          ...formData.getHeaders(), // Important for multipart/form-data
        },
      });
    } catch (apiError) {
      console.error('Spoonacular API request failed:', apiError.response?.data || apiError.message);
      // Do not delete imagePath here yet, as Spoonacular might still need it.
      // The main finally block or explicit deletion later will handle it.
      return res.status(apiError.response?.status || 502).json({
        message: 'Failed to analyze image with Spoonacular.',
        details: apiError.response?.data?.message || apiError.message
      });
    }

    // --- Process Spoonacular API Response (HYPOTHETICAL STRUCTURE) ---
    // This part remains dependent on the actual Spoonacular API response.
    // Assuming: { category: { name: "burger", probability: 0.9 }, nutrition: { calories: { value: 300 } }, ... }
    // Or for a simpler response: { results: [{ name: "sushi", calories: 200 }] }
    // Or: { annotation: "sushi", calories: 200 }

    let foodName, calories, protein, carbs, fats;

    // Example 1: Based on a common structure for image analysis
    if (spoonacularResponse.data.category && spoonacularResponse.data.nutrition) {
        foodName = spoonacularResponse.data.category.name;
        calories = spoonacularResponse.data.nutrition.calories?.value;
        protein = spoonacularResponse.data.nutrition.protein?.value; // Assuming 'value' sub-property
        carbs = spoonacularResponse.data.nutrition.carbs?.value;
        fats = spoonacularResponse.data.nutrition.fat?.value; // Spoonacular often uses 'fat'
    } 
    // Example 2: A simpler, direct structure or array of results
    else if (spoonacularResponse.data.results && spoonacularResponse.data.results.length > 0) {
        const primaryResult = spoonacularResponse.data.results[0];
        foodName = primaryResult.name;
        calories = primaryResult.calories; // Assuming calories is directly available
        // Nutritional data might not be present here, or need further parsing
    }
    // Example 3: Direct annotation and calories
    else if (spoonacularResponse.data.annotation && spoonacularResponse.data.calories) {
        foodName = spoonacularResponse.data.annotation;
        calories = spoonacularResponse.data.calories;
    }
     else {
      console.warn('Spoonacular response structure not recognized or missing key data:', spoonacularResponse.data);
      // Do not delete imagePath here.
      return res.status(502).json({ message: 'Could not extract food data from Spoonacular response. Unexpected format.' });
    }

    if (!foodName || calories === undefined) {
      // Do not delete imagePath here.
      return res.status(400).json({ message: 'Spoonacular API did not return essential food name or calorie data.' });
    }
    // --- End of Hypothetical Processing ---

    // Step 6: Create FoodLog with Cloudinary URL
    const newFoodLog = new FoodLog({
      user: req.user.id,
      foodName: foodName,
      calories: parseFloat(calories),
      protein: protein ? parseFloat(protein) : undefined,
      carbs: carbs ? parseFloat(carbs) : undefined,
      fats: fats ? parseFloat(fats) : undefined,
      imageUrl: cloudinaryUrl, // Add the Cloudinary URL
      // mealType and eatenAt can use defaults or be sent from client
    });

    // Step 7: Save FoodLog
    const savedFoodLog = await newFoodLog.save();
    
    // Step 9: Respond (cleanup is in finally)
    res.status(201).json(savedFoodLog);

  } catch (error) {
    console.error('Error in detectFoodWithImage:', error);
    // Generic error handling - specific errors (Cloudinary, Spoonacular) handled above.
    // The file might have been deleted by more specific error handlers already.
    if (error.name === 'ValidationError') { // If save fails due to validation
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Server error while detecting food from image.' });
  } finally {
    // Step 8: Delete local temp file (ensure it still exists before unlinking)
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlink(imagePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting temporary image file in finally block:', unlinkErr);
        }
      });
    }
  }
};

// @desc    Get today's calorie summary for the user
// @route   GET /api/calories/summary/today
// @access  Private
exports.getTodayCalorieSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const foodLogsToday = await FoodLog.find({
      user: userId,
      eatenAt: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    });

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    foodLogsToday.forEach(log => {
      totalCalories += log.calories || 0;
      totalProtein += log.protein || 0;
      totalCarbs += log.carbs || 0;
      totalFats += log.fats || 0;
    });

    res.status(200).json({
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
      logCount: foodLogsToday.length,
    });

  } catch (error) {
    console.error("Error fetching today's calorie summary:", error);
    res.status(500).json({ message: "Server error while fetching today's calorie summary." });
  }
};
