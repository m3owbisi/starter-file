"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Plus,
  Search,
  Archive,
  CheckCircle2,
  Activity,
  ChevronRight,
  Trash2,
  MoreVertical,
  Calendar,
  GitBranch,
  Loader2,
} from "lucide-react";
import { Experiment } from "./types";

interface ExperimentsListProps {
  experiments?: Experiment[];
  loading?: boolean;
  onDelete?: (id: string) => void;
}

const ExperimentsList: React.FC<ExperimentsListProps> = ({
  experiments: propExperiments,
  loading: propLoading,
  onDelete,
}) => {
  const [experiments, setExperiments] = useState<Experiment[]>(propExperiments || []);
  const [loading, setLoading] = useState(propLoading ?? true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);

  useEffect(() => {
    if (propExperiments) {
      setExperiments(propExperiments);
      setLoading(propLoading ?? false);
      return;
    }

    fetchExperiments();
  }, [propExperiments, propLoading]);

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/experiments");
      const data = await response.json();

      if (data.success) {
        setExperiments(data.data.experiments);
      }
    } catch (error) {
      console.error("error fetching experiments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (onDelete) {
      onDelete(id);
    } else {
      try {
        const response = await fetch(`/api/experiments/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setExperiments(experiments.filter((e) => e._id !== id));
        }
      } catch (error) {
        console.error("error deleting experiment:", error);
      }
    }
    setShowDeleteMenu(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Activity size={16} className="text-green-500" />;
      case "completed":
        return <CheckCircle2 size={16} className="text-blue-500" />;
      case "archived":
        return <Archive size={16} className="text-gray-500" />;
      default:
        return <Activity size={16} className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "active":
        return `${baseClasses} bg-green-500/10 text-green-500`;
      case "completed":
        return `${baseClasses} bg-blue-500/10 text-blue-500`;
      case "archived":
        return `${baseClasses} bg-gray-500/10 text-gray-500`;
      default:
        return `${baseClasses} bg-gray-500/10 text-gray-500`;
    }
  };

  const filteredExperiments = experiments.filter((exp) => {
    const matchesSearch = exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || exp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-us", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).toLowerCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-[#3c50e0] animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">loading experiments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="experiments-list">
      {/* header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FlaskConical size={28} className="text-[#3c50e0]" />
            experiments
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            track and compare your ml experiments
          </p>
        </div>
        <Link
          href="/experiments/new"
          className="experiment-btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all"
        >
          <Plus size={18} />
          new experiment
        </Link>
      </div>

      {/* filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="search experiments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20 focus:border-[#3c50e0] transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20 focus:border-[#3c50e0] transition-all"
        >
          <option value="all">all status</option>
          <option value="active">active</option>
          <option value="completed">completed</option>
          <option value="archived">archived</option>
        </select>
      </div>

      {/* experiments grid */}
      {filteredExperiments.length === 0 ? (
        <div className="experiment-empty-state text-center py-16">
          <FlaskConical size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            no experiments found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchQuery || statusFilter !== "all"
              ? "try adjusting your filters"
              : "create your first experiment to get started"}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Link
              href="/experiments/new"
              className="experiment-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium"
            >
              <Plus size={18} />
              create experiment
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredExperiments.map((experiment) => (
            <div
              key={experiment._id}
              className="experiment-card group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3c50e0] to-[#8b5cf6] flex items-center justify-center">
                    <FlaskConical size={20} className="text-white" />
                  </div>
                  <div>
                    <Link
                      href={`/experiments/${experiment._id}`}
                      className="font-semibold text-gray-900 dark:text-white hover:text-[#3c50e0] transition-colors"
                    >
                      {experiment.name}
                    </Link>
                    <span className={getStatusBadge(experiment.status)}>
                      {experiment.status}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowDeleteMenu(showDeleteMenu === experiment._id ? null : experiment._id)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical size={16} className="text-gray-500" />
                  </button>
                  {showDeleteMenu === experiment._id && (
                    <div className="absolute right-0 top-10 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                      <button
                        onClick={() => handleDelete(experiment._id)}
                        className="w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 text-sm"
                      >
                        <Trash2 size={14} />
                        delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                {experiment.description || "no description"}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-1.5">
                  <Activity size={14} />
                  <span>{experiment.runCount || 0} runs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <GitBranch size={14} />
                  <span>{experiment.defaultBranch}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar size={12} />
                  <span>{formatDate(experiment.updatedAt)}</span>
                </div>
                <Link
                  href={`/experiments/${experiment._id}`}
                  className="flex items-center gap-1 text-sm text-[#3c50e0] font-medium hover:gap-2 transition-all"
                >
                  view details
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExperimentsList;
