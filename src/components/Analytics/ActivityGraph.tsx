"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Activity, LogIn, Upload, Target, Eye, Download } from "lucide-react";

interface ActivityGraphProps {
  userId?: string;
  dateRange?: number;
  showRecentActivity?: boolean;
}

const actionIcons: Record<string, React.ReactNode> = {
  login: <LogIn size={14} />,
  upload: <Upload size={14} />,
  prediction: <Target size={14} />,
  view_protein: <Eye size={14} />,
  export: <Download size={14} />,
};

const actionColors: Record<string, string> = {
  login: "#3c50e0",
  upload: "#10b981",
  prediction: "#f59e0b",
  view_protein: "#8b5cf6",
  export: "#06b6d4",
};

const ActivityGraph: React.FC<ActivityGraphProps> = ({
  userId,
  dateRange = 30,
  showRecentActivity = true,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedActions, setSelectedActions] = useState<string[]>([
    "login",
    "upload",
    "prediction",
    "view_protein",
    "export",
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          dateRange: dateRange.toString(),
          ...(userId && { userId }),
        });
        
        const response = await fetch(`/api/analytics/activity?${params}`);
        const result = await response.json();
        
        if (result.success) {
          // format dates for display
          const formattedData = {
            ...result.data,
            dailyData: result.data.dailyData.map((item: any) => ({
              ...item,
              displayDate: new Date(item.date).toLocaleDateString("en-us", {
                month: "short",
                day: "numeric",
              }).toLowerCase(),
            })),
          };
          setData(formattedData);
        }
      } catch (error) {
        console.error("error fetching activity data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, dateRange]);

  const toggleAction = (action: string) => {
    setSelectedActions((prev) =>
      prev.includes(action)
        ? prev.filter((a) => a !== action)
        : [...prev, action]
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="analytics-tooltip">
          <p className="font-medium text-gray-900 dark:text-white mb-2 lowercase">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm flex items-center gap-2 lowercase" style={{ color: entry.color }}>
              {actionIcons[entry.dataKey]}
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="analytics-chart-container">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-40 mb-6 animate-pulse"></div>
        <div className="h-[300px] bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="analytics-chart-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white lowercase">
          user activity
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.keys(actionColors).map((action) => (
            <button
              key={action}
              onClick={() => toggleAction(action)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-all lowercase ${
                selectedActions.includes(action)
                  ? "text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500"
              }`}
              style={{
                backgroundColor: selectedActions.includes(action)
                  ? actionColors[action]
                  : undefined,
              }}
            >
              {actionIcons[action]}
              {action.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data?.dailyData || []}>
            <defs>
              {Object.entries(actionColors).map(([action, color]) => (
                <linearGradient key={action} id={`gradient-${action}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="displayDate"
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedActions.map((action) => (
              <Area
                key={action}
                type="monotone"
                dataKey={action}
                name={action.replace("_", " ")}
                stroke={actionColors[action]}
                strokeWidth={2}
                fill={`url(#gradient-${action})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* recent activity feed */}
      {showRecentActivity && data?.recentActivity && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4 lowercase">
            recent activity
          </h4>
          <div className="space-y-3">
            {data.recentActivity.slice(0, 5).map((activity: any, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full text-white"
                  style={{ backgroundColor: actionColors[activity.action] }}
                >
                  {actionIcons[activity.action]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white lowercase truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 lowercase">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* action summary */}
      {data?.actionBreakdown && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-5 gap-4">
          {Object.entries(data.actionBreakdown).map(([action, count]) => (
            <div key={action} className="text-center">
              <div
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white mb-2"
                style={{ backgroundColor: actionColors[action.replace("s", "").replace("view", "view_protein")] || "#6b7280" }}
              >
                {actionIcons[action.replace("s", "").replace("view", "view_protein")] || <Activity size={14} />}
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white lowercase">
                {(count as number).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 lowercase">{action}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityGraph;
