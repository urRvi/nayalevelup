import React, { useState, useContext } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import { UserContext } from '../../context/UserContext'; // For user context if needed

const FoodImageUpload = ({ onFoodLogDetected }) => {
  const { user } = useContext(UserContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detectedFood, setDetectedFood] = useState(null); // To store and display results

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDetectedFood(null); // Clear previous results
    } else {
      setSelectedFile(null);
      setPreviewUrl('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error('Please select an image file first.');
      return;
    }

    setIsLoading(true);
    setDetectedFood(null);
    const formData = new FormData();
    formData.append('foodImage', selectedFile); // Key 'foodImage' must match backend

    try {
      // API_PATHS.CALORIES.BASE is '/api/v1/calories', so we append '/detect'
      const response = await axiosInstance.post(`${API_PATHS.CALORIES.BASE}/detect`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Food detected and logged successfully!');
      setDetectedFood(response.data); // Store the detected food log entry
      setSelectedFile(null); // Clear the file input
      setPreviewUrl(''); // Clear preview
      event.target.reset(); // Reset the form to clear the file input visually

      if (onFoodLogDetected) {
        onFoodLogDetected(); // Callback to refresh the list on CaloriePage
      }
    } catch (error) {
      console.error('Error detecting food from image:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Failed to detect food. Please try again.';
      const errorDetails = error.response?.data?.details;
      toast.error(<div>{errorMessage}{errorDetails && <br />}{errorDetails}</div>);
      setDetectedFood(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <p className="text-center text-red-500 dark:text-gray-300">Please log in to use food detection.</p>;
  }

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="foodImage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload Food Image
          </label>
          <input
            type="file"
            name="foodImage"
            id="foodImage"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300
                       hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800"
          />
        </div>

        {previewUrl && (
          <div className="mt-4">
            <img src={previewUrl} alt="Selected food preview" className="max-h-60 w-auto rounded-md shadow-md mx-auto" />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !selectedFile}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isLoading ? 'Detecting...' : 'Detect Food & Log'}
        </button>
      </form>

      {detectedFood && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Detection Result:</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Food:</strong> {detectedFood.foodName}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Calories:</strong> {detectedFood.calories} kcal
          </p>
          {detectedFood.protein && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Protein:</strong> {detectedFood.protein} g
            </p>
          )}
          {detectedFood.carbs && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Carbs:</strong> {detectedFood.carbs} g
            </p>
          )}
          {detectedFood.fats && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Fats:</strong> {detectedFood.fats} g
            </p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Logged to your entries.
          </p>
        </div>
      )}
    </div>
  );
};

export default FoodImageUpload;
