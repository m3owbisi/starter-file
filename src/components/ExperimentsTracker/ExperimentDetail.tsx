"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FlaskConical,
  ArrowLeft,
  Settings,
  GitBranch,
  Activity,
  Clock,
  Calendar,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Archive,
  Play,
} from "lucide-react";
import { Experiment, ExperimentRun, ExperimentBranch } from "./types";
import RunHistory from "./RunHistory";
import RunTable from "./RunTable";
import RunCharts from "./RunCharts";
import FilteringPanel from "./FilteringPanel";
import BranchViewer from "./BranchViewer";
import RunForm from "./RunForm";

interface ExperimentDetailProps {
  experimentId: string;
}

const ExperimentDetail: React.FC<ExperimentDetailProps> = ({ experimentId }) => {
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const [branches, setBranches] = useState<ExperimentBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"runs" | "charts" | "branches">("runs");
  const [selectedBranch, setSelectedBranch] = useState<string>("main");
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: "",
    tags: [] as string[],
  });
  const [showRunForm, setShowRunForm] = useState(false);

  useEffect(() => {
    fetchExperimentData();
  }, [experimentId, selectedBranch, filters]);

  const fetchExperimentData = async () => {
    try {
      setLoading(true);
      
      // fetch experiment details
      const expResponse = await fetch(`/api/experiments/${experimentId}`);
      const expData = await expResponse.json();
      
      if (expData.success) {
        setExperiment(expData.data);
        setBranches(expData.data.branches || []);
      }

      // build query params for runs
      const params = new URLSearchParams();
      if (selectedBranch) params.set("branch", selectedBranch);
      if (filters.status) params.set("status", filters.status);
      if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));

      // fetch runs
      const runsResponse = await fetch(`/api/experiments/${experimentId}/runs?${params}`);
      const runsData = await runsResponse.json();
      
      if (runsData.success) {
        setRuns(runsData.data.runs);
      }
    } catch (error) {
      console.error("error fetching experiment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSelect = (runId: string) => {
    setSelectedRuns((prev) =>
      prev.includes(runId)
        ? prev.filter((id) => id !== runId)
        : [...prev, runId]
    );
  };

  const handleRunCreated = (newRun: ExperimentRun) => {
    setRuns((prev) => [newRun, ...prev]);
    setShowRunForm(false);
  };

  const handleStatusUpdate = async (runId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/experiments/${experimentId}/runs/${runId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setRuns((prev) =>
          prev.map((run) =>
            run._id === runId ? { ...run, status: newStatus as any } : run
          )
        );
      }
    } catch (error) {
      console.error("error updating run status:", error);
    }
  };

  const handleRollback = async (runId: string) => {
    try {
      const response = await fetch(
        `/api/experiments/${experimentId}/runs/${runId}/rollback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ branchName: selectedBranch }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setRuns((prev) => [data.data, ...prev]);
      }
    } catch (error) {
      console.error("error performing rollback:", error);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-us", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).toLowerCase();
  };

  if (loading && !experiment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-[#3c50e0] animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">loading experiment...</p>
        </div>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="text-center py-16">
        <XCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          experiment not found
        </h3>
        <Link href="/experiments" className="text-[#3c50e0] hover:underline">
          back to experiments
        </Link>
      </div>
    );
  }

  return (
    <div className="experiment-detail">
      {/* header */}
      <div className="mb-8">
        <Link
          href="/experiments"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#3c50e0] mb-4 transition-colors"
        >
          <ArrowLeft size={18} />
          back to experiments
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3c50e0] to-[#8b5cf6] flex items-center justify-center">
                <FlaskConical size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {experiment.name}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    experiment.status === "active"
                      ? "bg-green-500/10 text-green-500"
                      : experiment.status === "completed"
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-gray-500/10 text-gray-500"
                  }`}>
                    {experiment.status}
                  </span>
                  <span className="text-gray-400 text-sm">•</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                    <GitBranch size={14} />
                    {selectedBranch}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {experiment.description || "no description"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRunForm(true)}
              className="experiment-btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all"
            >
              <Plus size={18} />
              new run
            </button>
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="experiment-stat-card">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Activity size={16} />
              <span className="text-sm">total runs</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {runs.length}
            </p>
          </div>
          <div className="experiment-stat-card">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Play size={16} />
              <span className="text-sm">running</span>
            </div>
            <p className="text-2xl font-bold text-green-500">
              {runs.filter((r) => r.status === "running").length}
            </p>
          </div>
          <div className="experiment-stat-card">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <CheckCircle2 size={16} />
              <span className="text-sm">completed</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">
              {runs.filter((r) => r.status === "completed").length}
            </p>
          </div>
          <div className="experiment-stat-card">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <GitBranch size={16} />
              <span className="text-sm">branches</span>
            </div>
            <p className="text-2xl font-bold text-purple-500">
              {branches.length}
            </p>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab("runs")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "runs"
              ? "text-[#3c50e0]"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          runs
          {activeTab === "runs" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3c50e0]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("charts")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "charts"
              ? "text-[#3c50e0]"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          charts
          {activeTab === "charts" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3c50e0]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("branches")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "branches"
              ? "text-[#3c50e0]"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          branches
          {activeTab === "branches" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3c50e0]" />
          )}
        </button>
      </div>

      {/* content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* filtering panel */}
        <div className="lg:col-span-1">
          <FilteringPanel
            branches={branches}
            selectedBranch={selectedBranch}
            onBranchChange={setSelectedBranch}
            filters={filters}
            onFiltersChange={setFilters}
            runs={runs}
          />
        </div>

        {/* main content */}
        <div className="lg:col-span-3">
          {activeTab === "runs" && (
            <div className="space-y-6">
              <RunTable
                runs={runs}
                selectedRuns={selectedRuns}
                onRunSelect={handleRunSelect}
                onStatusUpdate={handleStatusUpdate}
                onRollback={handleRollback}
                experimentId={experimentId}
              />
              {runs.length > 0 && (
                <RunHistory
                  runs={runs}
                  onRollback={handleRollback}
                />
              )}
            </div>
          )}

          {activeTab === "charts" && (
            <RunCharts
              runs={runs}
              selectedRuns={selectedRuns}
              experimentId={experimentId}
            />
          )}

          {activeTab === "branches" && (
            <BranchViewer
              experimentId={experimentId}
              branches={branches}
              onBranchCreated={(branch: ExperimentBranch) => setBranches((prev) => [...prev, branch])}
            />
          )}
        </div>
      </div>

      {/* run form modal */}
      {showRunForm && (
        <RunForm
          experimentId={experimentId}
          branchName={selectedBranch}
          onClose={() => setShowRunForm(false)}
          onRunCreated={handleRunCreated}
        />
      )}
    </div>
  );
};

export default ExperimentDetail;
