"use client";

import React from "react";
import {
  Clock,
  GitCommit,
  RotateCcw,
  Tag,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
import { ExperimentRun } from "./types";

interface RunHistoryProps {
  runs: ExperimentRun[];
  onRollback: (runId: string) => void;
}

const RunHistory: React.FC<RunHistoryProps> = ({ runs, onRollback }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={16} className="text-green-500" />;
      case "failed":
        return <XCircle size={16} className="text-red-500" />;
      case "cancelled":
        return <AlertCircle size={16} className="text-yellow-500" />;
      case "running":
        return <PlayCircle size={16} className="text-blue-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return "—";
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-us", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).toLowerCase();
  };

  return (
    <div className="experiment-card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Clock size={18} className="text-[#3c50e0]" />
        version history
      </h3>

      <div className="relative">
        {/* timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-4">
          {runs.map((run, index) => (
            <div key={run._id} className="relative pl-10">
              {/* timeline dot */}
              <div className={`absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 ${
                run.versionInfo.isLatest
                  ? "bg-[#3c50e0] border-[#3c50e0]"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              }`} />

              <div className={`p-4 rounded-xl border transition-all ${
                run.versionInfo.isLatest
                  ? "bg-[#3c50e0]/5 border-[#3c50e0]/20"
                  : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <GitCommit size={14} className="text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        v{run.versionInfo.version}
                      </span>
                      {run.versionInfo.isLatest && (
                        <span className="px-2 py-0.5 bg-[#3c50e0] text-white text-xs rounded-full">
                          latest
                        </span>
                      )}
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        run #{run.runNumber}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {run.versionInfo.commitMessage || run.name || `run ${run.runNumber}`}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(run.status)}
                        <span>{run.status}</span>
                      </div>
                      <span>{formatDate(run.startTime)}</span>
                      <span>duration: {formatDuration(run.duration)}</span>
                    </div>

                    {/* tags */}
                    {run.tags.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Tag size={12} className="text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {run.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* key metrics preview */}
                    {Object.keys(run.metrics).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {Object.entries(run.metrics).slice(0, 4).map(([key, value]) => (
                          <div key={key} className="text-xs">
                            <span className="text-gray-500 dark:text-gray-400">{key}: </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {typeof value === "number" ? value.toFixed(4) : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* rollback button */}
                  {!run.versionInfo.isLatest && run.status === "completed" && (
                    <button
                      onClick={() => onRollback(run._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#3c50e0] hover:bg-[#3c50e0]/10 rounded-lg transition-colors"
                    >
                      <RotateCcw size={14} />
                      rollback
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RunHistory;
