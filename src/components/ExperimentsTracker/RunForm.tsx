"use client";

import React, { useState } from "react";
import {
  FlaskConical,
  X,
  Plus,
  Minus,
  Loader2,
} from "lucide-react";
import { ExperimentRun, RunFormData } from "./types";

interface RunFormProps {
  experimentId: string;
  branchName: string;
  onClose: () => void;
  onRunCreated: (run: ExperimentRun) => void;
}

const defaultParameters = {
  learningRate: 0.001,
  batchSize: 32,
  epochs: 100,
  optimizer: "adam",
};

const defaultMetrics = {
  accuracy: 0,
  loss: 0,
  valAccuracy: 0,
  valLoss: 0,
};

const RunForm: React.FC<RunFormProps> = ({
  experimentId,
  branchName,
  onClose,
  onRunCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RunFormData>({
    name: "",
    parameters: { ...defaultParameters },
    metrics: { ...defaultMetrics },
    branchName,
    commitMessage: "",
    tags: [],
  });
  const [newParamKey, setNewParamKey] = useState("");
  const [newParamValue, setNewParamValue] = useState("");
  const [newMetricKey, setNewMetricKey] = useState("");
  const [newMetricValue, setNewMetricValue] = useState("");
  const [newTag, setNewTag] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await fetch(`/api/experiments/${experimentId}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          name: formData.name.toLowerCase() || undefined,
          commitMessage: formData.commitMessage.toLowerCase(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        onRunCreated(data.data);
      }
    } catch (error) {
      console.error("error creating run:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateParameter = (key: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      parameters: { ...prev.parameters, [key]: value },
    }));
  };

  const removeParameter = (key: string) => {
    const { [key]: _, ...rest } = formData.parameters;
    setFormData((prev) => ({ ...prev, parameters: rest }));
  };

  const addParameter = () => {
    if (newParamKey.trim() && newParamValue.trim()) {
      const value = isNaN(Number(newParamValue)) ? newParamValue : Number(newParamValue);
      setFormData((prev) => ({
        ...prev,
        parameters: { ...prev.parameters, [newParamKey.toLowerCase()]: value },
      }));
      setNewParamKey("");
      setNewParamValue("");
    }
  };

  const updateMetric = (key: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      metrics: { ...prev.metrics, [key]: value },
    }));
  };

  const removeMetric = (key: string) => {
    const { [key]: _, ...rest } = formData.metrics;
    setFormData((prev) => ({ ...prev, metrics: rest }));
  };

  const addMetric = () => {
    if (newMetricKey.trim() && newMetricValue.trim()) {
      setFormData((prev) => ({
        ...prev,
        metrics: { ...prev.metrics, [newMetricKey.toLowerCase()]: Number(newMetricValue) },
      }));
      setNewMetricKey("");
      setNewMetricValue("");
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim().toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FlaskConical size={20} className="text-[#3c50e0]" />
            create new run
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* run name */}
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              run name (optional)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="baseline model"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20 focus:border-[#3c50e0]"
            />
          </div>

          {/* commit message */}
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              commit message
            </label>
            <input
              type="text"
              value={formData.commitMessage}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, commitMessage: e.target.value }))
              }
              placeholder="initial experiment with default hyperparameters"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20 focus:border-[#3c50e0]"
            />
          </div>

          {/* parameters */}
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
              hyperparameters
            </label>
            <div className="space-y-2 mb-3">
              {Object.entries(formData.parameters).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-32">
                    {key}
                  </span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                      const val = isNaN(Number(e.target.value))
                        ? e.target.value
                        : Number(e.target.value);
                      updateParameter(key, val);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeParameter(key)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                  >
                    <Minus size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newParamKey}
                onChange={(e) => setNewParamKey(e.target.value)}
                placeholder="parameter name"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20"
              />
              <input
                type="text"
                value={newParamValue}
                onChange={(e) => setNewParamValue(e.target.value)}
                placeholder="value"
                className="w-32 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20"
              />
              <button
                type="button"
                onClick={addParameter}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* metrics */}
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
              initial metrics
            </label>
            <div className="space-y-2 mb-3">
              {Object.entries(formData.metrics).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-32">
                    {key}
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={value}
                    onChange={(e) => updateMetric(key, Number(e.target.value))}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeMetric(key)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                  >
                    <Minus size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMetricKey}
                onChange={(e) => setNewMetricKey(e.target.value)}
                placeholder="metric name"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20"
              />
              <input
                type="number"
                step="any"
                value={newMetricValue}
                onChange={(e) => setNewMetricValue(e.target.value)}
                placeholder="value"
                className="w-32 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20"
              />
              <button
                type="button"
                onClick={addMetric}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* tags */}
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
              tags
            </label>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#3c50e0]/10 text-[#3c50e0] text-sm rounded-lg"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:bg-[#3c50e0]/20 rounded p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="add tag"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* branch info */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              this run will be created on branch:{" "}
              <span className="text-gray-900 dark:text-white font-medium">
                {branchName}
              </span>
            </p>
          </div>

          {/* buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-[#3c50e0] text-white rounded-xl font-medium hover:bg-[#3c50e0]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  creating...
                </>
              ) : (
                <>
                  <FlaskConical size={16} />
                  create run
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RunForm;
