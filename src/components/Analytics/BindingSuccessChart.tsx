"use client";

import React, { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface BindingSuccessChartProps {
  userId?: string;
  dateRange?: number;
}

const BindingSuccessChart: React.FC<BindingSuccessChartProps> = ({
  userId,
  dateRange = 30,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          dateRange: dateRange.toString(),
          ...(userId && { userId }),
        });
        
        const response = await fetch(`/api/analytics/bindings?${params}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("error fetching binding data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, dateRange]);

  const getGaugeOptions = (): EChartsOption => {
    if (!data) return {};

    const successRate = data.summary.overallSuccessRate;

    return {
      series: [
        {
          type: "gauge",
          startAngle: 180,
          endAngle: 0,
          center: ["50%", "70%"],
          radius: "100%",
          min: 0,
          max: 100,
          splitNumber: 5,
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [0.5, "#ef4444"],
                [0.7, "#f59e0b"],
                [0.85, "#10b981"],
                [1, "#059669"],
              ],
            },
          },
          pointer: {
            icon: "path://M12.8,0.7l12,40.1H0.7L12.8,0.7z",
            length: "60%",
            width: 12,
            offsetCenter: [0, "-10%"],
            itemStyle: {
              color: "auto",
            },
          },
          axisTick: {
            length: 8,
            lineStyle: {
              color: "auto",
              width: 1.5,
            },
          },
          splitLine: {
            length: 15,
            lineStyle: {
              color: "auto",
              width: 2,
            },
          },
          axisLabel: {
            color: "#9ca3af",
            fontSize: 11,
            distance: -50,
            formatter: (value: number) => {
              return `${value}%`;
            },
          },
          title: {
            offsetCenter: [0, "20%"],
            fontSize: 14,
            color: "#9ca3af",
          },
          detail: {
            fontSize: 32,
            offsetCenter: [0, "-20%"],
            valueAnimation: true,
            formatter: (value: number) => {
              return `${value.toFixed(1)}%`;
            },
            color: "auto",
          },
          data: [
            {
              value: successRate,
              name: "success rate",
            },
          ],
        },
      ],
    };
  };

  const getAffinityChartOptions = (): EChartsOption => {
    if (!data?.affinityDistribution) return {};

    return {
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        borderColor: "transparent",
        textStyle: {
          color: "#fff",
        },
        formatter: (params: any) => {
          return `<div style="text-transform: lowercase;">
            <strong>${params.name}</strong><br/>
            ${params.value} predictions (${params.data.percentage}%)
          </div>`;
        },
      },
      legend: {
        show: false,
      },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderWidth: 2,
            borderColor: "transparent",
          },
          label: {
            show: true,
            position: "outside",
            color: "#9ca3af",
            fontSize: 11,
            formatter: (params: any) => params.name.toLowerCase(),
          },
          labelLine: {
            show: true,
            lineStyle: {
              color: "#6b7280",
            },
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: "bold",
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
          data: data.affinityDistribution.map((item: any, index: number) => ({
            value: item.count,
            name: item.range,
            percentage: item.percentage,
            itemStyle: {
              color: ["#059669", "#10b981", "#f59e0b", "#f97316", "#ef4444"][index],
            },
          })),
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="analytics-chart-container">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-6 animate-pulse"></div>
        <div className="h-[250px] bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="analytics-chart-container">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white lowercase mb-6">
        binding prediction success
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* gauge chart */}
        <div>
          <div className="h-[220px]">
            <ReactECharts
              option={getGaugeOptions()}
              style={{ height: "100%", width: "100%" }}
              opts={{ renderer: "canvas" }}
            />
          </div>
          
          {/* stats below gauge */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white lowercase">
                {data?.summary.totalPredictions.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 lowercase">total</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[#10b981] lowercase">
                {data?.summary.successfulPredictions.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 lowercase">successful</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[#ef4444] lowercase">
                {data?.summary.failedPredictions.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 lowercase">failed</p>
            </div>
          </div>
        </div>

        {/* affinity distribution (admin only) */}
        {data?.affinityDistribution && (
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 lowercase text-center">
              affinity distribution
            </p>
            <div className="h-[250px]">
              <ReactECharts
                option={getAffinityChartOptions()}
                style={{ height: "100%", width: "100%" }}
                opts={{ renderer: "canvas" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* trend indicator */}
      {data?.summary.trend !== undefined && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 lowercase">
            7-day trend:
          </span>
          <span className={`text-sm font-medium lowercase ${
            data.summary.trend >= 0 ? "text-[#10b981]" : "text-[#ef4444]"
          }`}>
            {data.summary.trend >= 0 ? "+" : ""}{data.summary.trend}%
          </span>
        </div>
      )}
    </div>
  );
};

export default BindingSuccessChart;
