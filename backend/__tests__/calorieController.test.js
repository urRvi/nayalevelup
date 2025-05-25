// Import necessary modules and the controller
const request = require('supertest');
const express = require('express');
const calorieRoutes = require('../routes/calorieRoutes'); // Assuming your routes are here
const { protect } = require('../middleware/authMiddleware'); // Actual auth middleware
const FoodLog = require('../models/FoodLog');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const fs = require('fs');

// Mock middleware and models
jest.mock('../models/FoodLog');
jest.mock('../models/User');
jest.mock('cloudinary');
jest.mock('axios');
jest.mock('fs');

// Mock the protect middleware to simulate an authenticated user
jest.mock('../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'mockUserId', fullName: 'Mock User' }; // Mock user object
    next();
  }
}));


const app = express();
app.use(express.json());
// Mount the calorie routes under a specific path, e.g., /api/v1/calories
// This should match how it's done in your main server.js
app.use('/api/v1/calories', calorieRoutes); 


describe('Calorie Controller API Tests', () => {
  // --- Mock Data & Setup ---
  let mockFoodLogData;

  beforeEach(() => {
    // Reset mocks before each test
    FoodLog.find.mockClear();
    FoodLog.findById.mockClear();
    FoodLog.prototype.save.mockClear();
    FoodLog.deleteOne.mockClear(); // or FoodLog.findByIdAndDelete.mockClear();
    cloudinary.uploader.upload.mockClear();
    axios.post.mockClear();
    fs.createReadStream.mockClear();
    fs.unlink.mockClear();

    mockFoodLogData = {
      _id: 'logId123',
      user: 'mockUserId',
      foodName: 'Apple',
      calories: 95,
      protein: 0.5,
      carbs: 25,
      fats: 0.3,
      eatenAt: new Date(),
      save: jest.fn().mockResolvedValue(this), // Mock save on instance
      deleteOne: jest.fn().mockResolvedValue({ acknowledged: true, deletedCount: 1 }), // Mock deleteOne on instance
    };

    // Default mock implementations
    FoodLog.find.mockResolvedValue([mockFoodLogData]);
    FoodLog.findById.mockResolvedValue(mockFoodLogData);
    FoodLog.prototype.save = jest.fn().mockResolvedValue(mockFoodLogData); // For new FoodLog().save()
    
    // Mock for fs.unlink
    fs.unlink.mockImplementation((path, callback) => callback(null));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- Test Cases for addFoodLog ---
  describe('POST /api/v1/calories (addFoodLog)', () => {
    it('should successfully create a food log entry', async () => {
      const newLog = { foodName: 'Banana', calories: 105, mealType: 'Snack' };
      FoodLog.prototype.save.mockResolvedValueOnce({ _id: 'newLogId', user: 'mockUserId', ...newLog });

      const res = await request(app)
        .post('/api/v1/calories')
        .send(newLog);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.foodName).toBe('Banana');
      expect(FoodLog.prototype.save).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if required fields (foodName, calories) are missing', async () => {
      const res = await request(app)
        .post('/api/v1/calories')
        .send({ mealType: 'Lunch' }); // Missing foodName and calories

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Food name and calories are required');
    });
  });

  // --- Test Cases for getFoodLogs ---
  describe('GET /api/v1/calories (getFoodLogs)', () => {
    it('should retrieve logs for the authenticated user', async () => {
      const res = await request(app).get('/api/v1/calories');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].foodName).toBe('Apple');
      expect(FoodLog.find).toHaveBeenCalledWith({ user: 'mockUserId' });
    });

    it('should handle date filtering correctly', async () => {
      const startDate = '2023-01-01';
      const endDate = '2023-01-02';
      FoodLog.find.mockResolvedValueOnce([]); // Simulate filtered result

      const res = await request(app)
        .get('/api/v1/calories')
        .query({ startDate, endDate });

      expect(res.statusCode).toEqual(200);
      const expectedQuery = {
        user: 'mockUserId',
        eatenAt: {
          $gte: new Date(startDate + 'T00:00:00.000Z'),
          $lte: new Date(endDate + 'T23:59:59.999Z'),
        },
      };
      expect(FoodLog.find).toHaveBeenCalledWith(expectedQuery);
    });
  });

  // --- Test Cases for deleteFoodLog ---
  describe('DELETE /api/v1/calories/:id (deleteFoodLog)', () => {
    it('should successfully delete a food log', async () => {
      // Ensure findById returns an object that can have deleteOne called on it
      const mockLogInstance = { ...mockFoodLogData, deleteOne: jest.fn().mockResolvedValue({ acknowledged: true, deletedCount: 1 }) };
      FoodLog.findById.mockResolvedValueOnce(mockLogInstance);

      const res = await request(app).delete('/api/v1/calories/logId123');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Food log deleted successfully');
      expect(mockLogInstance.deleteOne).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if log to delete is not found', async () => {
      FoodLog.findById.mockResolvedValueOnce(null);
      const res = await request(app).delete('/api/v1/calories/nonExistentId');
      expect(res.statusCode).toEqual(404);
    });

    it('should return 403 if user tries to delete another user\'s log', async () => {
      const otherUsersLog = { ...mockFoodLogData, user: 'otherUserId', deleteOne: jest.fn() };
      FoodLog.findById.mockResolvedValueOnce(otherUsersLog);
      
      const res = await request(app).delete('/api/v1/calories/logId123');
      expect(res.statusCode).toEqual(403);
    });
  });

   // --- Test Cases for detectFoodWithImage ---
  describe('POST /api/v1/calories/detect (detectFoodWithImage)', () => {
    const mockImagePath = 'backend/temp_food_uploads/mockImage.jpg';

    beforeEach(() => {
        // Mock successful Cloudinary upload
        cloudinary.uploader.upload.mockResolvedValue({ secure_url: 'http://cloudinary.com/mockImage.jpg' });
        // Mock successful Spoonacular response
        axios.post.mockResolvedValue({
            data: { 
                category: { name: 'Detected Food' }, 
                nutrition: { calories: { value: 250 } } 
            }
        });
        // Mock fs.createReadStream
        fs.createReadStream.mockReturnValue('mockStream'); // Simplified mock
    });

    it('should successfully detect food and create a log', async () => {
        FoodLog.prototype.save.mockResolvedValueOnce({ 
            _id: 'detectedLogId', 
            user: 'mockUserId', 
            foodName: 'Detected Food', 
            calories: 250,
            imageUrl: 'http://cloudinary.com/mockImage.jpg'
        });

        const res = await request(app)
            .post('/api/v1/calories/detect')
            .attach('foodImage', Buffer.from('fakeImageData'), 'test.jpg'); // Use .attach for multipart

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('foodName', 'Detected Food');
        expect(res.body).toHaveProperty('imageUrl', 'http://cloudinary.com/mockImage.jpg');
        expect(cloudinary.uploader.upload).toHaveBeenCalled();
        expect(axios.post).toHaveBeenCalled();
        expect(FoodLog.prototype.save).toHaveBeenCalledTimes(1);
        // fs.unlink should be called to clean up the temp file
        // The path check in fs.unlink mock is tricky with dynamic filenames from multer
        // So, we'll just check if it was called.
        expect(fs.unlink).toHaveBeenCalled(); 
    });

    it('should return 400 if no image file is uploaded', async () => {
        const res = await request(app)
            .post('/api/v1/calories/detect'); // No file attached

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'No image file uploaded. Please upload an image.');
    });
    
    it('should handle Cloudinary upload failure', async () => {
        cloudinary.uploader.upload.mockRejectedValueOnce(new Error('Cloudinary error'));

        const res = await request(app)
            .post('/api/v1/calories/detect')
            .attach('foodImage', Buffer.from('fakeImageData'), 'test.jpg');
        
        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty('message', 'Failed to upload image to Cloudinary.');
        expect(fs.unlink).toHaveBeenCalled(); // Ensure cleanup on failure
    });

    it('should handle Spoonacular API failure', async () => {
        axios.post.mockRejectedValueOnce({ response: { status: 502, data: { message: 'Spoonacular error' } } });

        const res = await request(app)
            .post('/api/v1/calories/detect')
            .attach('foodImage', Buffer.from('fakeImageData'), 'test.jpg');

        expect(res.statusCode).toEqual(502);
        expect(res.body).toHaveProperty('message', 'Failed to analyze image with Spoonacular.');
        expect(fs.unlink).toHaveBeenCalled(); // Ensure cleanup on failure
    });
  });

  // --- Test Cases for getTodayCalorieSummary ---
  describe('GET /api/v1/calories/summary/today (getTodayCalorieSummary)', () => {
    it('should retrieve today\'s calorie summary', async () => {
      const todayLogs = [
        { ...mockFoodLogData, calories: 100, protein: 10, carbs: 10, fats: 2 },
        { ...mockFoodLogData, foodName: 'Salad', calories: 200, protein: 5, carbs: 20, fats: 10, eatenAt: new Date() }
      ];
      FoodLog.find.mockResolvedValueOnce(todayLogs); // Mock find to return specific logs for today

      const res = await request(app).get('/api/v1/calories/summary/today');

      expect(res.statusCode).toEqual(200);
      expect(res.body.totalCalories).toBe(300);
      expect(res.body.totalProtein).toBe(15);
      expect(res.body.totalCarbs).toBe(30);
      expect(res.body.totalFats).toBe(12);
      expect(res.body.logCount).toBe(2);

      // Check that FoodLog.find was called with date range for today
      expect(FoodLog.find).toHaveBeenCalledWith(expect.objectContaining({
        user: 'mockUserId',
        eatenAt: expect.objectContaining({
          $gte: expect.any(Date), // Check for Date objects
          $lte: expect.any(Date),
        }),
      }));
    });
  });
});
