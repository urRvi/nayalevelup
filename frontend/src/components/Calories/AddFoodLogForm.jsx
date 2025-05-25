import React, { useState, useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import axiosInstance from '../../utils/axiosInstance';
import { CALORIES_API } from '../../utils/apiPaths'; // Assuming this will be added
import toast from 'react-hot-toast';

const AddFoodLogForm = ({ onFoodLogAdded }) => {
  const { user } = useContext(UserContext);
  const [formData, setFormData] = useState({
    foodName: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    mealType: 'Snack',
    eatenAt: new Date().toISOString().split('T')[0], // Defaults to today
  });
  const [isLoading, setIsLoading] = useState(false);

  const { foodName, calories, protein, carbs, fats, mealType, eatenAt } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!foodName || calories === '' || isNaN(parseFloat(calories))) {
      toast.error('Food name and a valid calorie amount are required.');
      setIsLoading(false);
      return;
    }

    const foodLogData = {
      ...formData,
      calories: parseFloat(calories),
      protein: protein === '' ? undefined : parseFloat(protein),
      carbs: carbs === '' ? undefined : parseFloat(carbs),
      fats: fats === '' ? undefined : parseFloat(fats),
    };

    try {
      await axiosInstance.post(CALORIES_API, foodLogData);
      toast.success('Food log added successfully!');
      setFormData({
        foodName: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        mealType: 'Snack',
        eatenAt: new Date().toISOString().split('T')[0],
      });
      if (onFoodLogAdded) {
        onFoodLogAdded();
      }
    } catch (error) {
      console.error('Error adding food log:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to add food log. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <p className="text-center text-red-500">Please log in to add a food entry.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="foodName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Food Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="foodName"
          id="foodName"
          value={foodName}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="calories" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Calories <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="calories"
          id="calories"
          value={calories}
          onChange={handleChange}
          required
          min="0"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="protein" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Protein (g)
          </label>
          <input
            type="number"
            name="protein"
            id="protein"
            value={protein}
            min="0"
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="carbs" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Carbs (g)
          </label>
          <input
            type="number"
            name="carbs"
            id="carbs"
            value={carbs}
            min="0"
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="fats" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fats (g)
          </label>
          <input
            type="number"
            name="fats"
            id="fats"
            value={fats}
            min="0"
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor="mealType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Meal Type
        </label>
        <select
          name="mealType"
          id="mealType"
          value={mealType}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="Breakfast">Breakfast</option>
          <option value="Lunch">Lunch</option>
          <option value="Dinner">Dinner</option>
          <option value="Snack">Snack</option>
        </select>
      </div>

      <div>
        <label htmlFor="eatenAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Date Eaten
        </label>
        <input
          type="date"
          name="eatenAt"
          id="eatenAt"
          value={eatenAt}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? 'Adding...' : 'Add Food Log'}
      </button>
    </form>
  );
};

export default AddFoodLogForm;
