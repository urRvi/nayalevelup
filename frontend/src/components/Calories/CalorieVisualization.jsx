import React from 'react';
import { format, parseISO, eachDayOfInterval, isValid } from 'date-fns';
import CustomBarChart from '../Charts/CustomBarChart';
import CustomPieChart from '../Charts/CustomPieChart';

// Constants for calorie conversion
const CALORIES_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fats: 9,
};

const CalorieVisualization = ({ foodLogs, dateRange }) => {
  if (!foodLogs || foodLogs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No food log data available for the selected period to display visualizations.
      </div>
    );
  }

  // --- Process data for Daily Calorie Intake (Bar Chart) ---
  const dailyCalories = {};
  let minDate, maxDate;

  if (dateRange && dateRange.startDate && dateRange.endDate && isValid(parseISO(dateRange.startDate)) && isValid(parseISO(dateRange.endDate))) {
    minDate = parseISO(dateRange.startDate);
    maxDate = parseISO(dateRange.endDate);
  } else {
    // If no valid date range, try to infer from foodLogs
    const datesFromLogs = foodLogs.map(log => parseISO(log.eatenAt)).filter(isValid);
    if (datesFromLogs.length > 0) {
        minDate = datesFromLogs.reduce((min, d) => d < min ? d : min, datesFromLogs[0]);
        maxDate = datesFromLogs.reduce((max, d) => d > max ? d : max, datesFromLogs[0]);
    }
  }
  
  // Initialize dailyCalories for all days in the range (or all days with logs if no range)
  if (minDate && maxDate && isValid(minDate) && isValid(maxDate)) {
    const intervalDays = eachDayOfInterval({ start: minDate, end: maxDate });
    intervalDays.forEach(day => {
      dailyCalories[format(day, 'yyyy-MM-dd')] = 0;
    });
  }


  foodLogs.forEach(log => {
    const day = format(parseISO(log.eatenAt), 'yyyy-MM-dd');
    dailyCalories[day] = (dailyCalories[day] || 0) + log.calories;
  });

  const dailyCalorieChartData = {
    labels: Object.keys(dailyCalories).sort(), // Sort dates for chronological order
    datasets: [
      {
        label: 'Total Calories Consumed',
        data: Object.values(dailyCalories),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  // --- Process data for Nutrient Breakdown (Pie Chart) ---
  let totalProteinCalories = 0;
  let totalCarbCalories = 0;
  let totalFatCalories = 0;

  foodLogs.forEach(log => {
    totalProteinCalories += (log.protein || 0) * CALORIES_PER_GRAM.protein;
    totalCarbCalories += (log.carbs || 0) * CALORIES_PER_GRAM.carbs;
    totalFatCalories += (log.fats || 0) * CALORIES_PER_GRAM.fats;
  });

  const totalNutrientCalories = totalProteinCalories + totalCarbCalories + totalFatCalories;
  
  let nutrientChartData;
  if (totalNutrientCalories > 0) {
    nutrientChartData = {
      labels: ['Protein (kcal)', 'Carbs (kcal)', 'Fats (kcal)'],
      datasets: [
        {
          data: [totalProteinCalories, totalCarbCalories, totalFatCalories],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
          hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        },
      ],
    };
  } else {
     nutrientChartData = {
      labels: ['No Nutrient Data'],
      datasets: [{ data: [1], backgroundColor: ['#E0E0E0']}]
     };
  }


  return (
    <div className="space-y-8 mt-6">
      <div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3">
          Daily Calorie Intake
        </h3>
        {Object.keys(dailyCalories).length > 0 ? (
           <CustomBarChart data={dailyCalorieChartData} title="Daily Calories" />
        ) : (
           <p className="text-sm text-gray-500 dark:text-gray-400">No daily calorie data to display for this period.</p>
        )}
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3">
          Nutrient Breakdown (Calories)
        </h3>
        {totalNutrientCalories > 0 ? (
          <div className="max-w-xs mx-auto"> {/* Constrain pie chart size */}
            <CustomPieChart data={nutrientChartData} title="Nutrient Calories" />
          </div>
        ) : (
           <p className="text-sm text-gray-500 dark:text-gray-400">No nutrient data (protein, carbs, fats) logged for this period to display chart.</p>
        )}
      </div>
    </div>
  );
};

export default CalorieVisualization;
