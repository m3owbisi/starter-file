"use client";

import React from "react";
import { Upload, Target, Activity, TrendingUp, Clock, FileText } from "lucide-react";
import MetricsCard from "./MetricsCard";
import UploadsChart from "./UploadsChart";
import ProteinTypesChart from "./ProteinTypesChart";
import BindingSuccessChart from "./BindingSuccessChart";
import ActivityGraph from "./ActivityGraph";
import ExportButton from "./ExportButton";

interface UserDashboardProps {
  userId?: string;
  dateRange?: number;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ userId, dateRange = 30 }) => {
  const [metrics, setMetrics] = React.useState({
    myUploads: 0,
    myPredictions: 0,
    successRate: 0,
    lastActivity: "today",
    uploadsLoading: true,
    predictionsLoading: true,
    activityLoading: true,
  });

  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // fetch uploads (with userId for personal stats)
        const uploadsRes = await fetch(
          `/api/analytics/uploads?dateRange=${dateRange}${userId ? `&userId=${userId}` : ""}`
        );
        const uploadsData = await uploadsRes.json();
        if (uploadsData.success) {
          setMetrics((prev) => ({
            ...prev,
            myUploads: uploadsData.data.summary.totalUploads,
            uploadsLoading: false,
          }));
        }

        // fetch bindings
        const bindingsRes = await fetch(
          `/api/analytics/bindings?dateRange=${dateRange}${userId ? `&userId=${userId}` : ""}`
        );
        const bindingsData = await bindingsRes.json();
        if (bindingsData.success) {
          setMetrics((prev) => ({
            ...prev,
            myPredictions: bindingsData.data.summary.totalPredictions,
            successRate: bindingsData.data.summary.overallSuccessRate,
            predictionsLoading: false,
          }));
        }

        // fetch activity
        const activityRes = await fetch(
          `/api/analytics/activity?dateRange=${dateRange}${userId ? `&userId=${userId}` : ""}`
        );
        const activityData = await activityRes.json();
        if (activityData.success) {
          setMetrics((prev) => ({
            ...prev,
            lastActivity: activityData.data.recentActivity?.[0]?.time || "today",
            activityLoading: false,
          }));
        }
      } catch (error) {
        console.error("error fetching metrics:", error);
      }
    };

    fetchMetrics();
  }, [userId, dateRange]);

  return (
    <div className="space-y-6">
      {/* header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white lowercase">
            my analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 lowercase">
            your personal activity and statistics
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

      {/* personal metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="my uploads"
          value={metrics.myUploads.toLocaleString()}
          trend={5.2}
          trendLabel="this month"
          icon={<Upload size={20} />}
          color="primary"
          loading={metrics.uploadsLoading}
        />
        <MetricsCard
          title="my predictions"
          value={metrics.myPredictions.toLocaleString()}
          trend={12.8}
          trendLabel="this month"
          icon={<Target size={20} />}
          color="success"
          loading={metrics.predictionsLoading}
        />
        <MetricsCard
          title="my success rate"
          value={`${metrics.successRate}%`}
          trend={3.5}
          trendLabel="vs last month"
          icon={<TrendingUp size={20} />}
          color="warning"
          loading={metrics.predictionsLoading}
        />
        <MetricsCard
          title="last activity"
          value={metrics.lastActivity}
          icon={<Clock size={20} />}
          color="info"
          loading={metrics.activityLoading}
        />
      </div>

      {/* personal charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UploadsChart userId={userId} dateRange={dateRange} />
        <ProteinTypesChart userId={userId} />
      </div>

      {/* binding success */}
      <BindingSuccessChart userId={userId} dateRange={dateRange} />

      {/* activity timeline */}
      <ActivityGraph userId={userId} dateRange={dateRange} showRecentActivity={true} />

      {/* quick actions card */}
      <div className="analytics-chart-container">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white lowercase mb-4">
          quick actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="/dataset-upload"
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#3c50e0]/10 to-[#3c50e0]/5 rounded-xl border border-[#3c50e0]/20 hover:border-[#3c50e0]/40 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#3c50e0] flex items-center justify-center text-white">
              <Upload size={18} />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white lowercase">upload dataset</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 lowercase">add new protein data</p>
            </div>
          </a>
          <a
            href="/binding-prediction"
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#10b981]/10 to-[#10b981]/5 rounded-xl border border-[#10b981]/20 hover:border-[#10b981]/40 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#10b981] flex items-center justify-center text-white">
              <Target size={18} />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white lowercase">new prediction</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 lowercase">run binding analysis</p>
            </div>
          </a>
          <a
            href="/protein-viewer"
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#8b5cf6]/10 to-[#8b5cf6]/5 rounded-xl border border-[#8b5cf6]/20 hover:border-[#8b5cf6]/40 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#8b5cf6] flex items-center justify-center text-white">
              <FileText size={18} />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white lowercase">view proteins</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 lowercase">explore 3d structures</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
