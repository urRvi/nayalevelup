import React from 'react';
import { FaTrashAlt } from 'react-icons/fa';
import { format } from 'date-fns';

const FoodLogList = ({ foodLogs, onLogDeleted, isLoading, error }) => {
  if (isLoading) {
    return <p className="text-center text-gray-500 dark:text-gray-400">Loading food logs...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">Error loading food logs: {error.message || 'Please try again.'}</p>;
  }

  if (!foodLogs || foodLogs.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400">No food logs found. Add some to get started!</p>;
  }

  return (
    <div className="space-y-4">
      {foodLogs.map((log) => (
        <div
          key={log._id}
          className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow flex justify-between items-center"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{log.foodName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {log.calories} kcal - {log.mealType}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Logged on: {format(new Date(log.eatenAt), 'MMM dd, yyyy')}
            </p>
            {(log.protein || log.carbs || log.fats) && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                P: {log.protein || 0}g, C: {log.carbs || 0}g, F: {log.fats || 0}g
              </p>
            )}
          </div>
          <button
            onClick={() => onLogDeleted(log._id)}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
            aria-label="Delete food log"
          >
            <FaTrashAlt size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default FoodLogList;
