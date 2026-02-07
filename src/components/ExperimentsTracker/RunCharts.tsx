"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import {
  TrendingUp,
  BarChart2,
  Circle,
  Loader2,
} from "lucide-react";
import { ExperimentRun, RunComparison } from "./types";

interface RunChartsProps {
  runs: ExperimentRun[];
  selectedRuns: string[];
  experimentId: string;
}

const COLORS = [
  "#3c50e0",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
];

const RunCharts: React.FC<RunChartsProps> = ({
  runs,
  selectedRuns,
  experimentId,
}) => {
  const [chartType, setChartType] = useState<"line" | "bar" | "scatter">("line");
  const [comparison, setComparison] = useState<RunComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>("");

  // get all unique metric keys
  const metricKeys = useMemo(() => {
    return Array.from(
      new Set(runs.flatMap((run) => Object.keys(run.metrics)))
    );
  }, [runs]);

  // get all unique parameter keys
  const parameterKeys = useMemo(() => {
    return Array.from(
      new Set(runs.flatMap((run) => Object.keys(run.parameters)))
    );
  }, [runs]);

  useEffect(() => {
    if (metricKeys.length > 0 && !selectedMetric) {
      setSelectedMetric(metricKeys[0]);
    }
  }, [metricKeys, selectedMetric]);

  useEffect(() => {
    if (selectedRuns.length >= 2) {
      fetchComparison();
    } else {
      setComparison(null);
    }
  }, [selectedRuns, experimentId]);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/experiments/${experimentId}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runIds: selectedRuns }),
      });
      const data = await response.json();
      if (data.success) {
        setComparison(data.data);
      }
    } catch (error) {
      console.error("error fetching comparison:", error);
    } finally {
      setLoading(false);
    }
  };

  // prepare data for charts
  const lineChartData = useMemo(() => {
    const runsToShow = selectedRuns.length >= 2
      ? runs.filter((r) => selectedRuns.includes(r._id))
      : runs.slice(0, 10);

    return runsToShow.map((run) => ({
      name: `run #${run.runNumber}`,
      runNumber: run.runNumber,
      ...run.metrics,
    }));
  }, [runs, selectedRuns]);

  const barChartData = useMemo(() => {
    if (!selectedMetric) return [];
    
    const runsToShow = selectedRuns.length >= 2
      ? runs.filter((r) => selectedRuns.includes(r._id))
      : runs.slice(0, 10);

    return runsToShow.map((run) => ({
      name: `#${run.runNumber}`,
      [selectedMetric]: run.metrics[selectedMetric] || 0,
    }));
  }, [runs, selectedRuns, selectedMetric]);

  const scatterData = useMemo(() => {
    if (parameterKeys.length === 0 || metricKeys.length === 0) return [];

    const xParam = parameterKeys[0];
    const yMetric = selectedMetric || metricKeys[0];

    return runs
      .filter((run) => run.parameters[xParam] !== undefined && run.metrics[yMetric] !== undefined)
      .map((run) => ({
        x: run.parameters[xParam],
        y: run.metrics[yMetric],
        z: run.runNumber,
        name: `run #${run.runNumber}`,
      }));
  }, [runs, parameterKeys, metricKeys, selectedMetric]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-900 dark:text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-500 dark:text-gray-400">{entry.name}:</span>
              <span className="text-gray-900 dark:text-white font-mono">
                {typeof entry.value === "number" ? entry.value.toFixed(4) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (runs.length === 0) {
    return (
      <div className="experiment-card text-center py-16">
        <TrendingUp size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          no data to visualize
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          create some runs to see charts here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* chart controls */}
      <div className="experiment-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-[#3c50e0]" />
            metrics visualization
          </h3>
          
          <div className="flex items-center gap-4">
            {/* metric selector */}
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20"
            >
              {metricKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>

            {/* chart type selector */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setChartType("line")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  chartType === "line"
                    ? "bg-white dark:bg-gray-700 text-[#3c50e0] shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                <TrendingUp size={16} />
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  chartType === "bar"
                    ? "bg-white dark:bg-gray-700 text-[#3c50e0] shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                <BarChart2 size={16} />
              </button>
              <button
                onClick={() => setChartType("scatter")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  chartType === "scatter"
                    ? "bg-white dark:bg-gray-700 text-[#3c50e0] shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                <Circle size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* comparison stats */}
      {comparison && (
        <div className="experiment-card">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            comparison statistics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(comparison.statistics).slice(0, 4).map(([key, stats]) => (
              <div
                key={key}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{key}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">min:</span>
                    <span className="text-gray-900 dark:text-white font-mono">
                      {stats.min.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">max:</span>
                    <span className="text-gray-900 dark:text-white font-mono">
                      {stats.max.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">avg:</span>
                    <span className="text-gray-900 dark:text-white font-mono">
                      {stats.avg.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* charts */}
      <div className="experiment-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="text-[#3c50e0] animate-spin" />
          </div>
        ) : (
          <div className="h-[400px]">
            {chartType === "line" && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {metricKeys.slice(0, 4).map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}

            {chartType === "bar" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey={selectedMetric}
                    fill="#3c50e0"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartType === "scatter" && scatterData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis
                    dataKey="x"
                    name={parameterKeys[0]}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                    label={{
                      value: parameterKeys[0],
                      position: "insideBottomRight",
                      offset: -10,
                      fill: "#9ca3af",
                    }}
                  />
                  <YAxis
                    dataKey="y"
                    name={selectedMetric}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                    label={{
                      value: selectedMetric,
                      angle: -90,
                      position: "insideLeft",
                      fill: "#9ca3af",
                    }}
                  />
                  <ZAxis dataKey="z" range={[60, 200]} name="run #" />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-xl border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-900 dark:text-white font-medium mb-2">
                              {data.name}
                            </p>
                            <div className="text-sm">
                              <p className="text-gray-500">
                                {parameterKeys[0]}: <span className="text-gray-900 dark:text-white">{data.x}</span>
                              </p>
                              <p className="text-gray-500">
                                {selectedMetric}: <span className="text-gray-900 dark:text-white">{data.y?.toFixed(4)}</span>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                    name="runs"
                    data={scatterData}
                    fill="#3c50e0"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            )}

            {chartType === "scatter" && scatterData.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">
                  not enough data for scatter plot
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RunCharts;
