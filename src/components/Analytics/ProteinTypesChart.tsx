"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProteinTypesChartProps {
  userId?: string;
}

const ProteinTypesChart: React.FC<ProteinTypesChartProps> = ({ userId }) => {
  const [chartData, setChartData] = useState<ChartData<"doughnut"> | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          ...(userId && { userId }),
        });
        
        const response = await fetch(`/api/analytics/proteins?${params}`);
        const result = await response.json();
        
        if (result.success) {
          const distribution = result.data.distribution;
          
          setChartData({
            labels: distribution.map((item: any) => item.name),
            datasets: [
              {
                data: distribution.map((item: any) => item.count),
                backgroundColor: distribution.map((item: any) => item.color),
                borderColor: distribution.map((item: any) => item.color),
                borderWidth: 0,
                hoverOffset: 8,
              },
            ],
          });
          
          setSummary(result.data.summary);
        }
      } catch (error) {
        console.error("error fetching protein data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 12,
          },
          color: "#9ca3af",
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels && data.datasets.length) {
              return data.labels.map((label, i) => ({
                text: `${label}`.toLowerCase(),
                fillStyle: (data.datasets[0].backgroundColor as string[])[i],
                strokeStyle: (data.datasets[0].borderColor as string[])[i],
                lineWidth: 0,
                pointStyle: "circle",
                hidden: false,
                index: i,
              }));
            }
            return [];
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        titleColor: "#fff",
        bodyColor: "#9ca3af",
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return ` ${value.toLocaleString()} (${percentage}%)`.toLowerCase();
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="analytics-chart-container">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-6 animate-pulse"></div>
        <div className="flex items-center justify-center h-[300px]">
          <div className="w-48 h-48 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-chart-container">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white lowercase">
          protein type distribution
        </h3>
        {summary && (
          <span className="text-sm text-gray-500 dark:text-gray-400 lowercase">
            {summary.totalProteins.toLocaleString()} total
          </span>
        )}
      </div>

      <div className="h-[300px] relative">
        {chartData && <Doughnut data={chartData} options={options} />}
        
        {/* center label */}
        <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          {summary && (
            <>
              <p className="text-2xl font-bold text-gray-900 dark:text-white lowercase">
                {summary.uniqueTypes}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 lowercase">types</p>
            </>
          )}
        </div>
      </div>

      {/* top protein indicator */}
      {summary && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400 lowercase">
              most common
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white lowercase">
              {summary.topProteinType} ({summary.topProteinPercentage}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProteinTypesChart;
