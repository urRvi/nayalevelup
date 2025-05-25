import React, { useState, useEffect, useCallback, useContext } from 'react';
import AddFoodLogForm from '../../components/Calories/AddFoodLogForm';
import FoodLogList from '../../components/Calories/FoodLogList';
import FoodImageUpload from '../../components/Calories/FoodImageUpload';
import CalorieVisualization from '../../components/Calories/CalorieVisualization'; // Import the new component
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import { UserContext } from '../../context/UserContext';
import DashboardLayout from '../../components/Layouts/DashboardLayout'; // Assuming this is the layout

const CaloriePage = () => {
  const { user } = useContext(UserContext);
  const [foodLogs, setFoodLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ startDate: '', endDate: ''});

  const fetchFoodLogs = useCallback(async (startDate, endDate) => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    
    let params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    try {
      const response = await axiosInstance.get(API_PATHS.CALORIES.BASE, { params });
      setFoodLogs(response.data);
      setAppliedFilters({ startDate, endDate }); // Store applied filters
    } catch (err) {
      console.error('Error fetching food logs:', err.response?.data || err.message);
      setError(err.response?.data || err);
      toast.error(err.response?.data?.message || 'Failed to fetch food logs.');
    } finally {
      setIsLoading(false);
    }
  }, [user]); // Removed appliedFilters from dependencies to avoid loop, will call manually

  useEffect(() => {
    // Fetch all logs on initial mount (no filters)
    fetchFoodLogs(); 
  }, [user]); // Only re-run if user changes, fetchFoodLogs is stable due to useCallback without date dependencies

  const handleApplyFilter = () => {
    if (filterStartDate && filterEndDate && new Date(filterStartDate) > new Date(filterEndDate)) {
        toast.error('Start date cannot be after end date.');
        return;
    }
    fetchFoodLogs(filterStartDate, filterEndDate);
  };

  const handleResetFilter = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    fetchFoodLogs(); // Fetch all logs
    setAppliedFilters({ startDate: '', endDate: ''});
  };

  const handleFoodLogAdded = () => {
    fetchFoodLogs(); // Refetch logs after a new one is added
  };

  // This same function can be used by FoodImageUpload to refresh the list
  const handleFoodLogDetectedAndAdded = () => {
    fetchFoodLogs();
  };

  const handleLogDeleted = async (logId) => {
    const originalLogs = [...foodLogs];
    setFoodLogs(foodLogs.filter(log => log._id !== logId)); // Optimistic update

    try {
      await axiosInstance.delete(API_PATHS.CALORIES.DELETE(logId));
      toast.success('Food log deleted successfully!');
      // No need to call fetchFoodLogs() again due to optimistic update,
      // but if there was a server-side change, it would be good to refetch.
    } catch (err) {
      console.error('Error deleting food log:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to delete food log.');
      setFoodLogs(originalLogs); // Revert on error
    }
  };
  
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
          Calorie Tracker
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6"> {/* Added space-y-6 for spacing between cards */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-fit">
              <h2 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-4">Detect Food via Image</h2>
              <FoodImageUpload onFoodLogDetected={handleFoodLogDetectedAndAdded} />
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-fit">
              <h2 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-4">Log Food Manually</h2>
              <AddFoodLogForm onFoodLogAdded={handleFoodLogAdded} />
            </div>
          </div>
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <h2 className="text-xl font-medium text-gray-700 dark:text-gray-200">Logged Entries</h2>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input 
                  type="date" 
                  value={filterStartDate} 
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  aria-label="Start Date"
                />
                <input 
                  type="date" 
                  value={filterEndDate} 
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  aria-label="End Date"
                />
                <button 
                  onClick={handleApplyFilter}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-sm"
                >
                  Apply Filter
                </button>
                <button 
                  onClick={handleResetFilter}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-sm"
                >
                  Reset
                </button>
              </div>
            </div>
            { (appliedFilters.startDate || appliedFilters.endDate) &&
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Showing entries {appliedFilters.startDate ? `from ${appliedFilters.startDate}` : ''} {appliedFilters.endDate ? `to ${appliedFilters.endDate}` : appliedFilters.startDate ? 'to now' : 'for all dates'}.
              </p>
            }
            <FoodLogList
              foodLogs={foodLogs}
              onLogDeleted={handleLogDeleted}
              isLoading={isLoading && foodLogs.length === 0} // Show loading only on initial load
              error={error}
            />
            {/* Visualization Section */}
            <div className="mt-8"> {/* Add some margin-top for spacing */}
              <h2 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-4">
                Data Visualization
              </h2>
              <CalorieVisualization foodLogs={foodLogs} dateRange={appliedFilters} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CaloriePage;
