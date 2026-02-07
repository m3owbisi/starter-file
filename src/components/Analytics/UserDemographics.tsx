"use client";

import React, { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface UserDemographicsProps {
  showMap?: boolean;
}

const UserDemographics: React.FC<UserDemographicsProps> = ({ showMap = true }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"country" | "institution" | "role">("country");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/analytics/users");
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("error fetching demographics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getBarChartOptions = (): EChartsOption => {
    if (!data) return {};

    let chartData: any[] = [];
    let title = "";

    switch (activeTab) {
      case "country":
        chartData = data.demographics.byCountry.slice(0, 8);
        title = "users by country";
        break;
      case "institution":
        chartData = data.demographics.byInstitution;
        title = "users by institution type";
        break;
      case "role":
        chartData = data.demographics.byRole;
        title = "users by role";
        break;
    }

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        borderColor: "transparent",
        textStyle: {
          color: "#fff",
        },
        formatter: (params: any) => {
          const item = params[0];
          return `<div style="text-transform: lowercase;">
            <strong>${item.name}</strong><br/>
            ${item.value.toLocaleString()} users (${chartData.find((d: any) => 
              (d.country || d.type || d.role) === item.name
            )?.percentage || 0}%)
          </div>`;
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: chartData.map((item: any) => item.country || item.type || item.role),
        axisLabel: {
          color: "#9ca3af",
          fontSize: 11,
          rotate: 30,
          formatter: (value: string) => value.toLowerCase(),
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: "#9ca3af",
          fontSize: 11,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: "#374151",
            opacity: 0.3,
          },
        },
      },
      series: [
        {
          type: "bar",
          data: chartData.map((item: any) => item.users || item.count),
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#3c50e0" },
                { offset: 1, color: "#6366f1" },
              ],
            },
          },
          emphasis: {
            itemStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "#6366f1" },
                  { offset: 1, color: "#818cf8" },
                ],
              },
            },
          },
          barWidth: "60%",
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="analytics-chart-container">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-6 animate-pulse"></div>
        <div className="h-[350px] bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="analytics-chart-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white lowercase">
          user demographics
        </h3>
        <div className="flex gap-2">
          {(["country", "institution", "role"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all lowercase ${
                activeTab === tab
                  ? "bg-[#3c50e0] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[350px]">
        <ReactECharts
          option={getBarChartOptions()}
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer: "canvas" }}
        />
      </div>

      {/* summary stats */}
      {data?.summary && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white lowercase">
              {data.summary.totalUsers.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 lowercase">total users</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white lowercase">
              {data.summary.activeUsers.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 lowercase">active users</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-[#10b981] lowercase">
              +{data.summary.newUsersThisMonth}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 lowercase">new this month</p>
          </div>
          <div className="text-center">
            <p className={`text-xl font-bold lowercase ${data.summary.userGrowth > 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
              {data.summary.userGrowth > 0 ? "+" : ""}{data.summary.userGrowth}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 lowercase">growth rate</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDemographics;
