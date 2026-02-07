"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface UploadsChartProps {
  userId?: string;
  dateRange?: number;
  chartType?: "line" | "bar";
}

const UploadsChart: React.FC<UploadsChartProps> = ({
  userId,
  dateRange = 30,
  chartType = "line",
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<"line" | "bar">(chartType);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          dateRange: dateRange.toString(),
          ...(userId && { userId }),
        });
        
        const response = await fetch(`/api/analytics/uploads?${params}`);
        const result = await response.json();
        
        if (result.success) {
          // format dates for display
          const formattedData = result.data.dailyData.map((item: any) => ({
            ...item,
            displayDate: new Date(item.date).toLocaleDateString("en-us", {
              month: "short",
              day: "numeric",
            }).toLowerCase(),
          }));
          setData(formattedData);
        }
      } catch (error) {
        console.error("error fetching upload data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, dateRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="analytics-tooltip">
          <p className="font-medium text-gray-900 dark:text-white mb-2 lowercase">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm lowercase" style={{ color: entry.color }}>
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
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
        </div>
        <div className="h-[300px] bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="analytics-chart-container">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white lowercase">
          daily uploads
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveChart("line")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all lowercase ${
              activeChart === "line"
                ? "bg-[#3c50e0] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            line
          </button>
          <button
            onClick={() => setActiveChart("bar")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all lowercase ${
              activeChart === "bar"
                ? "bg-[#3c50e0] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            bar
          </button>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {activeChart === "line" ? (
            <LineChart data={data}>
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
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => <span className="text-sm lowercase">{value}</span>}
              />
              <Line
                type="monotone"
                dataKey="successfulUploads"
                name="successful"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: "#10b981" }}
              />
              <Line
                type="monotone"
                dataKey="failedUploads"
                name="failed"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: "#ef4444" }}
              />
            </LineChart>
          ) : (
            <BarChart data={data}>
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
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => <span className="text-sm lowercase">{value}</span>}
              />
              <Bar dataKey="successfulUploads" name="successful" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failedUploads" name="failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UploadsChart;
