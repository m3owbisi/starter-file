"use client";

import React from "react";
import { Upload, Target, Users, Activity, TrendingUp, Database } from "lucide-react";
import MetricsCard from "./MetricsCard";
import UploadsChart from "./UploadsChart";
import ProteinTypesChart from "./ProteinTypesChart";
import UserDemographics from "./UserDemographics";
import BindingSuccessChart from "./BindingSuccessChart";
import ActivityGraph from "./ActivityGraph";
import ExportButton from "./ExportButton";

interface AdminDashboardProps {
  dateRange?: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ dateRange = 30 }) => {
  const [metrics, setMetrics] = React.useState({
    totalUploads: 0,
    totalPredictions: 0,
    activeUsers: 0,
    successRate: 0,
    uploadsLoading: true,
    predictionsLoading: true,
    usersLoading: true,
    activityLoading: true,
  });

  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // fetch uploads
        const uploadsRes = await fetch(`/api/analytics/uploads?dateRange=${dateRange}`);
        const uploadsData = await uploadsRes.json();
        if (uploadsData.success) {
          setMetrics((prev) => ({
            ...prev,
            totalUploads: uploadsData.data.summary.totalUploads,
            uploadsLoading: false,
          }));
        }

        // fetch bindings
        const bindingsRes = await fetch(`/api/analytics/bindings?dateRange=${dateRange}`);
        const bindingsData = await bindingsRes.json();
        if (bindingsData.success) {
          setMetrics((prev) => ({
            ...prev,
            totalPredictions: bindingsData.data.summary.totalPredictions,
            successRate: bindingsData.data.summary.overallSuccessRate,
            predictionsLoading: false,
          }));
        }

        // fetch users
        const usersRes = await fetch("/api/analytics/users");
        const usersData = await usersRes.json();
        if (usersData.success) {
          setMetrics((prev) => ({
            ...prev,
            activeUsers: usersData.data.summary.activeUsers,
            usersLoading: false,
          }));
        }

        // fetch activity
        const activityRes = await fetch(`/api/analytics/activity?dateRange=${dateRange}`);
        const activityData = await activityRes.json();
        if (activityData.success) {
          setMetrics((prev) => ({
            ...prev,
            activityLoading: false,
          }));
        }
      } catch (error) {
        console.error("error fetching metrics:", error);
      }
    };

    fetchMetrics();
  }, [dateRange]);

  return (
    <div className="space-y-6">
      {/* header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white lowercase">
            analytics dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 lowercase">
            complete platform metrics and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20 lowercase"
            defaultValue="30"
          >
            <option value="7">last 7 days</option>
            <option value="30">last 30 days</option>
            <option value="90">last 90 days</option>
          </select>
          <ExportButton metrics="uploads" dateRange={dateRange} />
        </div>
      </div>

      {/* metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="total uploads"
          value={metrics.totalUploads.toLocaleString()}
          trend={12.5}
          trendLabel="vs last period"
          icon={<Upload size={20} />}
          color="primary"
          loading={metrics.uploadsLoading}
        />
        <MetricsCard
          title="binding predictions"
          value={metrics.totalPredictions.toLocaleString()}
          trend={8.3}
          trendLabel="vs last period"
          icon={<Target size={20} />}
          color="success"
          loading={metrics.predictionsLoading}
        />
        <MetricsCard
          title="active users"
          value={metrics.activeUsers.toLocaleString()}
          trend={15.2}
          trendLabel="vs last period"
          icon={<Users size={20} />}
          color="info"
          loading={metrics.usersLoading}
        />
        <MetricsCard
          title="success rate"
          value={`${metrics.successRate}%`}
          trend={2.1}
          trendLabel="vs last period"
          icon={<TrendingUp size={20} />}
          color="warning"
          loading={metrics.predictionsLoading}
        />
      </div>

      {/* main charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UploadsChart dateRange={dateRange} />
        <ProteinTypesChart />
      </div>

      {/* binding success and demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BindingSuccessChart dateRange={dateRange} />
        <UserDemographics />
      </div>

      {/* activity graph - full width */}
      <ActivityGraph dateRange={dateRange} showRecentActivity={true} />
    </div>
  );
};

export default AdminDashboard;
