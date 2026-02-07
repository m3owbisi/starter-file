"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Table,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  BarChart2,
  RotateCcw,
  Tag,
  MoreVertical,
  CheckCircle,
  XCircle,
  PlayCircle,
  AlertCircle,
  Eye,
} from "lucide-react";
import { ExperimentRun } from "./types";
import TagManager from "./TagManager";

interface RunTableProps {
  runs: ExperimentRun[];
  selectedRuns: string[];
  onRunSelect: (runId: string) => void;
  onStatusUpdate: (runId: string, status: string) => void;
  onRollback: (runId: string) => void;
  experimentId: string;
}

const RunTable: React.FC<RunTableProps> = ({
  runs,
  selectedRuns,
  onRunSelect,
  onStatusUpdate,
  onRollback,
  experimentId,
}) => {
  const [sortField, setSortField] = useState<string>("runNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [showTagManager, setShowTagManager] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedRuns = [...runs].sort((a, b) => {
    let aValue: any = a[sortField as keyof ExperimentRun];
    let bValue: any = b[sortField as keyof ExperimentRun];

    // handle nested values for metrics
    if (sortField.startsWith("metrics.")) {
      const metricKey = sortField.replace("metrics.", "");
      aValue = a.metrics[metricKey] ?? -Infinity;
      bValue = b.metrics[metricKey] ?? -Infinity;
    }

    if (typeof aValue === "string") {
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={16} className="text-green-500" />;
      case "failed":
        return <XCircle size={16} className="text-red-500" />;
      case "cancelled":
        return <AlertCircle size={16} className="text-yellow-500" />;
      case "running":
        return <PlayCircle size={16} className="text-blue-500 animate-pulse" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1";
    switch (status) {
      case "completed":
        return `${baseClasses} bg-green-500/10 text-green-500`;
      case "failed":
        return `${baseClasses} bg-red-500/10 text-red-500`;
      case "cancelled":
        return `${baseClasses} bg-yellow-500/10 text-yellow-500`;
      case "running":
        return `${baseClasses} bg-blue-500/10 text-blue-500`;
      default:
        return `${baseClasses} bg-gray-500/10 text-gray-500`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-us", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).toLowerCase();
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return "—";
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // get all unique metric keys
  const metricKeys = Array.from(
    new Set(runs.flatMap((run) => Object.keys(run.metrics)))
  ).slice(0, 4);

  const selectAll = () => {
    if (selectedRuns.length === runs.length) {
      runs.forEach((run) => onRunSelect(run._id));
    } else {
      runs.forEach((run) => {
        if (!selectedRuns.includes(run._id)) {
          onRunSelect(run._id);
        }
      });
    }
  };

  return (
    <div className="experiment-card overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Table size={18} className="text-[#3c50e0]" />
          runs
        </h3>
        {selectedRuns.length >= 2 && (
          <Link
            href={`/experiments/${experimentId}?compare=${selectedRuns.join(",")}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3c50e0] text-white rounded-lg text-sm font-medium hover:bg-[#3c50e0]/90 transition-colors"
          >
            <BarChart2 size={16} />
            compare ({selectedRuns.length})
          </Link>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-3 px-2 text-left">
                <button
                  onClick={selectAll}
                  className="text-gray-500 hover:text-[#3c50e0]"
                >
                  {selectedRuns.length === runs.length ? (
                    <CheckSquare size={18} />
                  ) : (
                    <Square size={18} />
                  )}
                </button>
              </th>
              <th
                className="py-3 px-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-[#3c50e0]"
                onClick={() => handleSort("runNumber")}
              >
                <div className="flex items-center gap-1">
                  run
                  {sortField === "runNumber" &&
                    (sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                status
              </th>
              <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                version
              </th>
              {metricKeys.map((key) => (
                <th
                  key={key}
                  className="py-3 px-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-[#3c50e0]"
                  onClick={() => handleSort(`metrics.${key}`)}
                >
                  <div className="flex items-center gap-1">
                    {key}
                    {sortField === `metrics.${key}` &&
                      (sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
              ))}
              <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                started
              </th>
              <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                duration
              </th>
              <th className="py-3 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {sortedRuns.map((run) => (
              <React.Fragment key={run._id}>
                <tr
                  className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                    selectedRuns.includes(run._id) ? "bg-[#3c50e0]/5" : ""
                  }`}
                >
                  <td className="py-3 px-2">
                    <button
                      onClick={() => onRunSelect(run._id)}
                      className="text-gray-500 hover:text-[#3c50e0]"
                    >
                      {selectedRuns.includes(run._id) ? (
                        <CheckSquare size={18} className="text-[#3c50e0]" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => setExpandedRun(expandedRun === run._id ? null : run._id)}
                      className="flex items-center gap-2 text-gray-900 dark:text-white font-medium hover:text-[#3c50e0]"
                    >
                      <span>#{run.runNumber}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm font-normal">
                        {run.name || `run ${run.runNumber}`}
                      </span>
                      {run.versionInfo.isLatest && (
                        <span className="px-1.5 py-0.5 bg-[#3c50e0] text-white text-xs rounded">
                          latest
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-2">
                    <span className={getStatusBadge(run.status)}>
                      {getStatusIcon(run.status)}
                      {run.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-300">
                    v{run.versionInfo.version}
                  </td>
                  {metricKeys.map((key) => (
                    <td key={key} className="py-3 px-2 text-sm text-gray-900 dark:text-white font-mono">
                      {run.metrics[key] !== undefined
                        ? typeof run.metrics[key] === "number"
                          ? run.metrics[key].toFixed(4)
                          : run.metrics[key]
                        : "—"}
                    </td>
                  ))}
                  <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(run.startTime)}
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">
                    {formatDuration(run.duration)}
                  </td>
                  <td className="py-3 px-2">
                    <div className="relative">
                      <button
                        onClick={() => setActionMenu(actionMenu === run._id ? null : run._id)}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {actionMenu === run._id && (
                        <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                          <button
                            onClick={() => {
                              setExpandedRun(run._id);
                              setActionMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center gap-2"
                          >
                            <Eye size={14} />
                            view details
                          </button>
                          <button
                            onClick={() => {
                              setShowTagManager(run._id);
                              setActionMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center gap-2"
                          >
                            <Tag size={14} />
                            manage tags
                          </button>
                          {run.status === "running" && (
                            <>
                              <button
                                onClick={() => {
                                  onStatusUpdate(run._id, "completed");
                                  setActionMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 text-sm flex items-center gap-2"
                              >
                                <CheckCircle size={14} />
                                mark completed
                              </button>
                              <button
                                onClick={() => {
                                  onStatusUpdate(run._id, "failed");
                                  setActionMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm flex items-center gap-2"
                              >
                                <XCircle size={14} />
                                mark failed
                              </button>
                            </>
                          )}
                          {!run.versionInfo.isLatest && run.status === "completed" && (
                            <button
                              onClick={() => {
                                onRollback(run._id);
                                setActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-[#3c50e0] hover:bg-[#3c50e0]/10 text-sm flex items-center gap-2"
                            >
                              <RotateCcw size={14} />
                              rollback to this
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                {/* expanded details */}
                {expandedRun === run._id && (
                  <tr>
                    <td colSpan={8 + metricKeys.length} className="py-4 px-4 bg-gray-50 dark:bg-gray-800/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* parameters */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            parameters
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(run.parameters).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex justify-between text-sm bg-white dark:bg-gray-800 px-3 py-2 rounded-lg"
                              >
                                <span className="text-gray-500 dark:text-gray-400">{key}</span>
                                <span className="text-gray-900 dark:text-white font-mono">
                                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                            {Object.keys(run.parameters).length === 0 && (
                              <p className="text-gray-500 dark:text-gray-400 text-sm">no parameters</p>
                            )}
                          </div>
                        </div>
                        {/* metrics */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            all metrics
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(run.metrics).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex justify-between text-sm bg-white dark:bg-gray-800 px-3 py-2 rounded-lg"
                              >
                                <span className="text-gray-500 dark:text-gray-400">{key}</span>
                                <span className="text-gray-900 dark:text-white font-mono">
                                  {typeof value === "number" ? value.toFixed(4) : String(value)}
                                </span>
                              </div>
                            ))}
                            {Object.keys(run.metrics).length === 0 && (
                              <p className="text-gray-500 dark:text-gray-400 text-sm">no metrics</p>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* tags */}
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {run.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {run.tags.length === 0 && (
                            <p className="text-gray-500 dark:text-gray-400 text-sm">no tags</p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {runs.length === 0 && (
          <div className="text-center py-12">
            <Table size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">no runs yet</p>
          </div>
        )}
      </div>

      {/* tag manager modal */}
      {showTagManager && (
        <TagManager
          experimentId={experimentId}
          runId={showTagManager}
          currentTags={runs.find((r) => r._id === showTagManager)?.tags || []}
          onClose={() => setShowTagManager(null)}
        />
      )}
    </div>
  );
};

export default RunTable;
