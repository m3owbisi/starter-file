"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import {
  FlaskConical,
  ArrowLeft,
  Loader2,
} from "lucide-react";

const NewExperimentPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("experiment name is required");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.toLowerCase().trim(),
          description: formData.description.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/experiments/${data.data._id}`);
      } else {
        setError(data.error || "failed to create experiment");
      }
    } catch (err) {
      console.error("error creating experiment:", err);
      setError("failed to create experiment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="p-4 md:p-6 2xl:p-10">
        <div className="max-w-2xl mx-auto">
          {/* back link */}
          <Link
            href="/experiments"
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#3c50e0] mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            back to experiments
          </Link>

          {/* form card */}
          <div className="experiment-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3c50e0] to-[#8b5cf6] flex items-center justify-center">
                <FlaskConical size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  create new experiment
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  start tracking your ml experiment
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* error message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* experiment name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  experiment name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="protein binding prediction v1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20 focus:border-[#3c50e0] transition-all"
                  autoFocus
                />
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  choose a descriptive name for your experiment
                </p>
              </div>

              {/* description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="describe the goal of this experiment..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20 focus:border-[#3c50e0] transition-all resize-none"
                />
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  optional: add context about what you're trying to achieve
                </p>
              </div>

              {/* info box */}
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  <strong>tip:</strong> after creating the experiment, you can add runs 
                  with hyperparameters and metrics. all runs support versioning, 
                  branching, and rollback capabilities.
                </p>
              </div>

              {/* buttons */}
              <div className="flex gap-4 pt-2">
                <Link
                  href="/experiments"
                  className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                  className="flex-1 px-6 py-3 bg-[#3c50e0] text-white rounded-xl font-medium hover:bg-[#3c50e0]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      creating...
                    </>
                  ) : (
                    <>
                      <FlaskConical size={18} />
                      create experiment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default NewExperimentPage;
