import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/Layouts/DashboardLayout";

import { LuHandCoins, LuWalletMinimal, LuApple } from "react-icons/lu"; // Added LuApple for calories
import { IoMdCard } from "react-icons/io";

import { useNavigate } from "react-router-dom";
import InfoCard from "../../components/Cards/InfoCard";
import { useUserAuth } from "../../hooks/useUserAuth";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { addThousandsSeparator } from "../../utils/helper";
import RecentTransactions from "../../components/Dashboard/RecentTransactions";
import FinanceOverview from "../../components/Dashboard/FinanceOverview";
import ExpenseTransactions from "../../components/Dashboard/ExpenseTransactions";
import Last30DaysExpenses from "../../components/Dashboard/Last30DaysExpenses";
import RecentIncome from "../../components/Dashboard/RecentIncome";
import RecentIncomeWithChart from "../../components/Dashboard/RecentIncomeWithChart";

const Home = () => {
  useUserAuth();

  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [todayCalorieSummary, setTodayCalorieSummary] = useState({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
    logCount: 0,
  });
  const [loading, setLoading] = useState(false); // Combined loading state
  const [calorieLoading, setCalorieLoading] = useState(false);


  const fetchDashboardData = async () => {
    // setLoading(true) is now handled by the combined fetch function
    try {
      const response = await axiosInstance.get(API_PATHS.DASHBOARD.GET_DATA);
      if (response.data) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.log("Error fetching dashboard data. Please try again.", error);
      // toast.error("Could not load dashboard data.");
    }
    // setLoading(false) is now handled by the combined fetch function
  };

  const fetchTodayCalorieSummary = async () => {
    // setCalorieLoading(true) is now handled by the combined fetch function
    try {
      const response = await axiosInstance.get(API_PATHS.CALORIES.TODAY_SUMMARY);
      if (response.data) {
        setTodayCalorieSummary(response.data);
      }
    } catch (error) {
      console.log("Error fetching today's calorie summary. Please try again.", error);
      // toast.error("Could not load today's calorie summary.");
    }
    // setCalorieLoading(false) is now handled by the combined fetch function
  };
  
  constfetchAllData = async () => {
    if (loading || calorieLoading) return; // Prevent re-fetching if already loading
    setLoading(true);
    setCalorieLoading(true);
    await Promise.all([fetchDashboardData(), fetchTodayCalorieSummary()]);
    setLoading(false);
    setCalorieLoading(false);
  };


  useEffect(() => {
    fetchAllData();
    return () => {};
  }, []);

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="my-5 mx-auto">
        {/* Adjusted grid to md:grid-cols-4 to accommodate the new card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <InfoCard
            icon={<IoMdCard />}
            label="Total Balance"
            value={addThousandsSeparator(dashboardData?.totalBalance || 0)}
            color="bg-primary"
          />

          <InfoCard
            icon={<LuWalletMinimal />}
            label="Total Income"
            value={addThousandsSeparator(dashboardData?.totalIncome || 0)}
            color="bg-orange-500"
          />

          <InfoCard
            icon={<LuHandCoins />}
            label="Total Expenses"
            value={addThousandsSeparator(dashboardData?.totalExpenses || 0)}
            color="bg-red-500"
          />
          <InfoCard
            icon={<LuApple />} // Using LuApple icon
            label="Today's Calories"
            value={`${addThousandsSeparator(todayCalorieSummary?.totalCalories || 0)} kcal`}
            color="bg-green-500" // Example color
            loading={calorieLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <RecentTransactions
            transactions={dashboardData?.recentTransactions}
            onSeeMore={() => navigate("/expense")}
          />

          <FinanceOverview
            totalBalance={dashboardData?.totalBalance || 0}
            totalIncome={dashboardData?.totalIncome || 0}
            totalExpense={dashboardData?.totalExpenses || 0}
          />

          <ExpenseTransactions
            transactions={dashboardData?.last30DaysExpenses?.transactions || []}
            onSeeMore={() => navigate("/expense")}
          />

          <Last30DaysExpenses
            data={dashboardData?.last30DaysExpenses?.transactions || []}
          />

          <RecentIncomeWithChart
            data={dashboardData?.last60DaysIncome?.transactions?.slice(0,4) || []}
            totalIncome={dashboardData?.totalIncome || 0}
          />

          <RecentIncome
            transactions={dashboardData?.last60DaysIncome?.transactions || []}
            onSeeMore={() => navigate("/income")}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;
