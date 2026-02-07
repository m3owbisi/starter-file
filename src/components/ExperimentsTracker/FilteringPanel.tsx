"use client";

import React, { useState } from "react";
import {
  Filter,
  GitBranch,
  Tag,
  Activity,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
import { ExperimentBranch, ExperimentRun } from "./types";

interface FilteringPanelProps {
  branches: ExperimentBranch[];
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
  filters: {
    status: string;
    tags: string[];
  };
  onFiltersChange: (filters: { status: string; tags: string[] }) => void;
  runs: ExperimentRun[];
}

const FilteringPanel: React.FC<FilteringPanelProps> = ({
  branches,
  selectedBranch,
  onBranchChange,
  filters,
  onFiltersChange,
  runs,
}) => {
  const [tagInput, setTagInput] = useState("");

  // collect all unique tags from runs
  const allTags = Array.from(new Set(runs.flatMap((run) => run.tags)));

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: filters.status === status ? "" : status,
    });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim().toLowerCase())) {
      onFiltersChange({
        ...filters,
        tags: [...filters.tags, tagInput.trim().toLowerCase()],
      });
      setTagInput("");
    }
  };

  const clearFilters = () => {
    onFiltersChange({ status: "", tags: [] });
  };

  const statusOptions = [
    { value: "running", icon: PlayCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
    { value: "completed", icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
    { value: "failed", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
    { value: "cancelled", icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  ];

  const hasActiveFilters = filters.status || filters.tags.length > 0;

  return (
    <div className="experiment-filter-panel space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Filter size={16} className="text-[#3c50e0]" />
          filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-[#3c50e0] transition-colors"
          >
            clear all
          </button>
        )}
      </div>

      {/* branch selector */}
      <div>
        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-2 flex items-center gap-1.5">
          <GitBranch size={12} />
          branch
        </label>
        <select
          value={selectedBranch}
          onChange={(e) => onBranchChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20 focus:border-[#3c50e0] transition-all"
        >
          {branches.map((branch) => (
            <option key={branch._id} value={branch.name}>
              {branch.name} ({branch.runCount || 0})
            </option>
          ))}
        </select>
      </div>

      {/* status filter */}
      <div>
        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-2 flex items-center gap-1.5">
          <Activity size={12} />
          status
        </label>
        <div className="space-y-2">
          {statusOptions.map((status) => {
            const Icon = status.icon;
            const isSelected = filters.status === status.value;
            return (
              <button
                key={status.value}
                onClick={() => handleStatusChange(status.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  isSelected
                    ? `${status.bg} ${status.color} font-medium`
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Icon size={14} />
                {status.value}
              </button>
            );
          })}
        </div>
      </div>

      {/* tags filter */}
      <div>
        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-2 flex items-center gap-1.5">
          <Tag size={12} />
          tags
        </label>
        
        {/* selected tags */}
        {filters.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {filters.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[#3c50e0]/10 text-[#3c50e0] text-xs rounded-lg"
              >
                {tag}
                <button
                  onClick={() => handleTagToggle(tag)}
                  className="hover:bg-[#3c50e0]/20 rounded p-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* available tags */}
        {allTags.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">available tags:</p>
            <div className="flex flex-wrap gap-1.5">
              {allTags
                .filter((tag) => !filters.tags.includes(tag))
                .slice(0, 10)
                .map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* tag input */}
        <div className="mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="add tag filter..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20"
            />
            <button
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              className="px-3 py-2 bg-[#3c50e0] text-white rounded-lg text-sm font-medium hover:bg-[#3c50e0]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              add
            </button>
          </div>
        </div>
      </div>

      {/* run stats */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          showing {runs.length} run{runs.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};

export default FilteringPanel;
