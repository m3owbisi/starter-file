"use client";

import React, { useState } from "react";
import {
  GitBranch,
  Plus,
  GitMerge,
  Activity,
  Calendar,
  Loader2,
} from "lucide-react";
import { ExperimentBranch } from "./types";

interface BranchViewerProps {
  experimentId: string;
  branches: ExperimentBranch[];
  onBranchCreated: (branch: ExperimentBranch) => void;
}

const BranchViewer: React.FC<BranchViewerProps> = ({
  experimentId,
  branches,
  onBranchCreated,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    parentBranch: "main",
    description: "",
  });

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setCreating(true);
      const response = await fetch(`/api/experiments/${experimentId}/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        onBranchCreated(data.data);
        setFormData({ name: "", parentBranch: "main", description: "" });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error("error creating branch:", error);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-us", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).toLowerCase();
  };

  // build branch hierarchy for visualization
  const branchTree = branches.reduce((acc, branch) => {
    const parentBranch = branch.parentBranch || "root";
    if (!acc[parentBranch]) acc[parentBranch] = [];
    acc[parentBranch].push(branch);
    return acc;
  }, {} as Record<string, ExperimentBranch[]>);

  const renderBranchNode = (branch: ExperimentBranch, depth: number = 0) => {
    const children = branchTree[branch.name] || [];
    const isMain = branch.name === "main";

    return (
      <div key={branch._id} className="relative">
        {/* connection line */}
        {depth > 0 && (
          <div className="absolute left-4 -top-4 w-0.5 h-4 bg-gray-300 dark:bg-gray-600" />
        )}
        
        <div
          className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all ${
            isMain
              ? "bg-[#3c50e0]/5 border-[#3c50e0]/20"
              : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
          }`}
          style={{ marginLeft: depth * 24 }}
        >
          {/* branch icon */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isMain
                ? "bg-[#3c50e0] text-white"
                : "bg-purple-500/10 text-purple-500"
            }`}
          >
            <GitBranch size={20} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {branch.name}
              </h4>
              {isMain && (
                <span className="px-2 py-0.5 bg-[#3c50e0] text-white text-xs rounded">
                  default
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {branch.description || "no description"}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Activity size={12} />
                <span>{branch.runCount || 0} runs</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{formatDate(branch.createdAt)}</span>
              </div>
              {branch.parentBranch && (
                <div className="flex items-center gap-1">
                  <GitMerge size={12} />
                  <span>from {branch.parentBranch}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* child branches */}
        {children.length > 0 && (
          <div className="mt-4 space-y-4 relative">
            <div
              className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"
              style={{ height: "calc(100% - 20px)" }}
            />
            {children.map((child) => renderBranchNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const mainBranch = branches.find((b) => b.name === "main");
  const orphanBranches = branches.filter(
    (b) => b.name !== "main" && !b.parentBranch && !branchTree[b.name]?.length
  );

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="experiment-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <GitBranch size={18} className="text-[#3c50e0]" />
            branches
          </h3>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3c50e0] text-white rounded-lg text-sm font-medium hover:bg-[#3c50e0]/90 transition-colors"
          >
            <Plus size={16} />
            new branch
          </button>
        </div>

        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          organize your experiment runs into separate branches for parallel experimentation
        </p>

        {/* branch visualization */}
        <div className="space-y-4">
          {mainBranch && renderBranchNode(mainBranch)}
          {orphanBranches.map((branch) => renderBranchNode(branch))}
        </div>

        {branches.length === 0 && (
          <div className="text-center py-12">
            <GitBranch size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">no branches yet</p>
          </div>
        )}
      </div>

      {/* create branch modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <GitBranch size={20} className="text-[#3c50e0]" />
              create new branch
            </h3>

            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                  branch name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value.toLowerCase() })
                  }
                  placeholder="feature-experiment"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20 focus:border-[#3c50e0]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                  parent branch
                </label>
                <select
                  value={formData.parentBranch}
                  onChange={(e) =>
                    setFormData({ ...formData, parentBranch: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20 focus:border-[#3c50e0]"
                >
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                  description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value.toLowerCase() })
                  }
                  placeholder="describe the purpose of this branch..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20 focus:border-[#3c50e0] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !formData.name.trim()}
                  className="flex-1 px-4 py-2.5 bg-[#3c50e0] text-white rounded-xl font-medium hover:bg-[#3c50e0]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      creating...
                    </>
                  ) : (
                    "create branch"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchViewer;
