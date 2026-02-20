"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Dna,
  Database,
  Beaker,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  Cpu,
  SlidersHorizontal,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Layers,
  Sparkles,
} from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import PredictionResults from "./PredictionResults";
import { useDataset } from "@/app/context/DatasetContext";
import type { PredictionRecord } from "@/app/context/DatasetContext";

// ─────────────────────────────────────────────────────────────────────
// types
// ─────────────────────────────────────────────────────────────────────
interface ChemicalProperties {
  molecular_weight?: number;
  isoelectric_point?: number;
  hydrophobicity?: number;
}

interface PredictionData {
  binding_affinity: number;
  unit: string;
  confidence_score: number;
  interaction_type: string;
  binding_sites: Array<{ residue: string; contribution: number }>;
}

interface PredictionResponse {
  success: boolean;
  prediction?: PredictionData;
  error?: string;
  code?: string;
  datasetId?: string;
}

// ─────────────────────────────────────────────────────────────────────
// available ml models
// ─────────────────────────────────────────────────────────────────────
const ML_MODELS = [
  {
    id: "proteinbind-v1.0",
    name: "proteinbind v1.0",
    description: "general-purpose binding prediction",
    badge: "stable",
  },
  {
    id: "proteinbind-v2.0-beta",
    name: "proteinbind v2.0 (beta)",
    description: "enhanced with transformer architecture",
    badge: "beta",
  },
  {
    id: "deepbind-ensemble",
    name: "deepbind ensemble",
    description: "multi-model consensus prediction",
    badge: "experimental",
  },
];

// ─────────────────────────────────────────────────────────────────────
// status badge component
// ─────────────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    ready: {
      bg: "bg-green-500/10 border-green-500/30",
      text: "text-green-500",
      icon: <CheckCircle2 size={12} />,
    },
    processing: {
      bg: "bg-yellow-500/10 border-yellow-500/30",
      text: "text-yellow-500",
      icon: <Clock size={12} />,
    },
    completed: {
      bg: "bg-blue-500/10 border-blue-500/30",
      text: "text-blue-500",
      icon: <CheckCircle2 size={12} />,
    },
    error: {
      bg: "bg-red-500/10 border-red-500/30",
      text: "text-red-500",
      icon: <AlertTriangle size={12} />,
    },
  };

  const c = config[status] || config.ready;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}
    >
      {c.icon}
      {status}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────
// main component
// ─────────────────────────────────────────────────────────────────────
const BindingPrediction: React.FC = () => {
  // centralized dataset
  const { activeDataset, predictions, addPrediction } = useDataset();

  // form state
  const [aminoAcidSequence, setAminoAcidSequence] = useState("");
  const [selectedModel, setSelectedModel] = useState(ML_MODELS[0].id);
  const [temperature, setTemperature] = useState(0.8);
  const [threshold, setThreshold] = useState(0.5);
  const [maxIterations, setMaxIterations] = useState(1000);
  const [chemicalProperties, setChemicalProperties] = useState<ChemicalProperties>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // prediction state
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // dataset history for this dataset
  const datasetPredictions = useMemo(() => {
    if (!activeDataset) return [];
    return predictions.filter((p) => p.datasetId === activeDataset.id);
  }, [activeDataset, predictions]);

  // handle chemical property changes
  const handleChemicalPropertyChange = useCallback(
    (property: keyof ChemicalProperties, value: string) => {
      const numValue = value === "" ? undefined : parseFloat(value);
      setChemicalProperties((prev) => ({
        ...prev,
        [property]: numValue,
      }));
    },
    []
  );

  // submit prediction
  const handleSubmit = useCallback(async () => {
    if (!activeDataset) {
      setError({
        message: "no dataset selected. please upload a protein structure in the protein viewer first.",
        code: "no_dataset",
      });
      return;
    }

    if (!aminoAcidSequence || aminoAcidSequence.trim().length < 10) {
      setError({
        message: "please enter an amino acid sequence (minimum 10 characters)",
        code: "invalid_input",
      });
      return;
    }

    // prevent double submission
    if (isSubmitting) return;
    setIsSubmitting(true);

    // clear previous state
    setError(null);
    setPrediction(null);
    setIsLoading(true);
    setProgress(0);

    // simulate progress for ux (actual prediction may take variable time)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const requestBody: Record<string, unknown> = {
        amino_acid_sequence: aminoAcidSequence.trim().toUpperCase(),
        pdb_data: activeDataset.pdbContent,
        model_version: selectedModel,
        parameters: {
          temperature,
          threshold,
          max_iterations: maxIterations,
        },
      };

      // add chemical properties if any are set
      const hasChemicalProperties = Object.values(chemicalProperties).some(
        (v) => v !== undefined
      );
      if (hasChemicalProperties) {
        requestBody.chemical_properties = chemicalProperties;
      }

      const response = await fetch(`/api/predict/${activeDataset.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data: PredictionResponse = await response.json();

      clearInterval(progressInterval);
      setProgress(100);

      if (!data.success || !data.prediction) {
        setError({
          message: data.error || "prediction failed. please try again.",
          code: data.code,
        });
      } else {
        setPrediction(data.prediction);

        // store in prediction history
        const record: PredictionRecord = {
          id: `pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          datasetId: activeDataset.id,
          modelVersion: selectedModel,
          parameters: { temperature, threshold, maxIterations },
          affinityScore: data.prediction.binding_affinity,
          confidenceScore: data.prediction.confidence_score,
          interactionType: data.prediction.interaction_type,
          predictedBindingSites: data.prediction.binding_sites,
          createdAt: new Date(),
        };
        addPrediction(record);
      }
    } catch {
      clearInterval(progressInterval);
      setError({
        message: "network error. please check your connection and try again.",
        code: "network_error",
      });
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
      // reset progress after a delay so the bar completes visually
      setTimeout(() => setProgress(0), 1000);
    }
  }, [
    activeDataset,
    aminoAcidSequence,
    selectedModel,
    temperature,
    threshold,
    maxIterations,
    chemicalProperties,
    isSubmitting,
    addPrediction,
  ]);

  // retry prediction
  const handleRetry = useCallback(() => {
    setError(null);
    handleSubmit();
  }, [handleSubmit]);

  // clear all inputs
  const handleClear = useCallback(() => {
    setAminoAcidSequence("");
    setChemicalProperties({});
    setPrediction(null);
    setError(null);
    setProgress(0);
  }, []);

  return (
    <div className="space-y-6">
      {/* ──── dataset info card ──── */}
      <div className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-black dark:text-white">
            active dataset
          </h3>
        </div>

        {activeDataset ? (
          <div className="space-y-4">
            {/* dataset summary row */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-base font-semibold text-black dark:text-white">
                    {activeDataset.name}
                  </p>
                  <p className="text-xs text-body dark:text-bodydark">
                    {activeDataset.fileName}
                  </p>
                </div>
              </div>
              <StatusBadge status={activeDataset.status} />
            </div>

            {/* dataset metadata grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-boxdark-2">
                <p className="text-lg font-bold text-primary">
                  {activeDataset.metadata?.chains ?? "—"}
                </p>
                <p className="text-xs text-body dark:text-bodydark">chains</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-boxdark-2">
                <p className="text-lg font-bold text-green-500">
                  {activeDataset.metadata?.residues ?? "—"}
                </p>
                <p className="text-xs text-body dark:text-bodydark">residues</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-boxdark-2">
                <p className="text-lg font-bold text-blue-500">
                  {activeDataset.metadata?.atoms ?? "—"}
                </p>
                <p className="text-xs text-body dark:text-bodydark">atoms</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-boxdark-2">
                <p className="text-lg font-bold text-yellow-500">
                  {activeDataset.metadata?.helices ?? "—"}
                </p>
                <p className="text-xs text-body dark:text-bodydark">helices</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-boxdark-2">
                <p className="text-lg font-bold text-purple-500">
                  {activeDataset.metadata?.sheets ?? "—"}
                </p>
                <p className="text-xs text-body dark:text-bodydark">sheets</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-boxdark-2">
                <p className="text-lg font-bold text-body dark:text-bodydark">
                  .{activeDataset.fileType}
                </p>
                <p className="text-xs text-body dark:text-bodydark">format</p>
              </div>
            </div>

            {/* dataset id + upload date */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-body dark:text-bodydark">
              <span className="flex items-center gap-1">
                <Database size={12} />
                id: <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-boxdark-2">{activeDataset.id}</code>
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                uploaded: {activeDataset.uploadDate.toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          /* ──── no dataset selected state ──── */
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-12 dark:border-gray-600">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-boxdark-2">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="mb-1 text-sm font-semibold text-black dark:text-white">
              no dataset selected
            </p>
            <p className="max-w-sm text-center text-xs text-body dark:text-bodydark">
              upload a protein structure (pdb file) in the{" "}
              <a href="/protein-viewer" className="text-primary underline hover:text-primary/80">
                protein viewer
              </a>{" "}
              to begin. the dataset will be automatically available here for prediction.
            </p>
          </div>
        )}
      </div>

      {/* ──── prediction configuration ──── */}
      {activeDataset && (
        <div className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          {/* model selection */}
          <div className="mb-6">
            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-black dark:text-white">
              <Cpu className="h-4 w-4 text-primary" />
              prediction model
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              {ML_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  disabled={isLoading}
                  className={`relative rounded-xl border p-4 text-left transition-all duration-200 ${
                    selectedModel === m.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-stroke bg-gray-50 hover:border-primary/50 hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark-2 dark:hover:border-primary/50"
                  } ${isLoading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-black dark:text-white">
                      {m.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        m.badge === "stable"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : m.badge === "beta"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      }`}
                    >
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-xs text-body dark:text-bodydark">
                    {m.description}
                  </p>
                  {selectedModel === m.id && (
                    <div className="absolute right-3 top-3">
                      <CheckCircle2 size={16} className="text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* amino acid sequence input */}
          <div className="mb-6">
            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-black dark:text-white">
              <Dna className="h-4 w-4 text-primary" />
              amino acid sequence
              <span className="text-red-500">*</span>
            </label>
            <textarea
              value={aminoAcidSequence}
              onChange={(e) => setAminoAcidSequence(e.target.value)}
              placeholder="enter amino acid sequence (e.g., mvlspadktnvkaawgkvgahageygaealermflsfpttk...)"
              className="h-32 w-full resize-none rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-mono text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-body dark:text-bodydark">
              minimum 10 characters required. standard single-letter amino acid codes.
            </p>
          </div>

          {/* ──── parameter sliders ──── */}
          <div className="mb-6">
            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-black dark:text-white">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              prediction parameters
            </label>
            <div className="grid gap-6 rounded-xl border border-stroke bg-gray-50 p-5 dark:border-form-strokedark dark:bg-form-input md:grid-cols-3">
              {/* temperature */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-body dark:text-bodydark">
                    temperature
                  </span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {temperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-primary dark:bg-gray-700"
                  disabled={isLoading}
                />
                <p className="mt-1 text-[10px] text-body/60 dark:text-bodydark/60">
                  controls randomness in sampling. lower = more deterministic.
                </p>
              </div>

              {/* threshold */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-body dark:text-bodydark">
                    confidence threshold
                  </span>
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-bold text-green-600 dark:text-green-400">
                    {threshold.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.99"
                  step="0.01"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-green-500 dark:bg-gray-700"
                  disabled={isLoading}
                />
                <p className="mt-1 text-[10px] text-body/60 dark:text-bodydark/60">
                  minimum confidence to report a binding site.
                </p>
              </div>

              {/* max iterations */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-body dark:text-bodydark">
                    max iterations
                  </span>
                  <span className="rounded bg-purple-500/10 px-2 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                    {maxIterations}
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={maxIterations}
                  onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-purple-500 dark:bg-gray-700"
                  disabled={isLoading}
                />
                <p className="mt-1 text-[10px] text-body/60 dark:text-bodydark/60">
                  more iterations = better accuracy, longer compute time.
                </p>
              </div>
            </div>
          </div>

          {/* ──── advanced: chemical properties ──── */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              disabled={isLoading}
            >
              <Beaker className="h-4 w-4" />
              chemical properties
              <span className="text-xs font-normal text-body dark:text-bodydark">
                (optional)
              </span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>

          {showAdvanced && (
            <div className="mb-6 grid gap-4 rounded-lg border border-stroke bg-gray-50 p-4 dark:border-form-strokedark dark:bg-form-input md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-medium text-body dark:text-bodydark">
                  molecular weight (da)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={chemicalProperties.molecular_weight ?? ""}
                  onChange={(e) =>
                    handleChemicalPropertyChange("molecular_weight", e.target.value)
                  }
                  placeholder="e.g., 16000"
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-white px-4 py-2 text-sm text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-body dark:text-bodydark">
                  isoelectric point (pi)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={chemicalProperties.isoelectric_point ?? ""}
                  onChange={(e) =>
                    handleChemicalPropertyChange("isoelectric_point", e.target.value)
                  }
                  placeholder="e.g., 6.8"
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-white px-4 py-2 text-sm text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-body dark:text-bodydark">
                  hydrophobicity (0-1)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={chemicalProperties.hydrophobicity ?? ""}
                  onChange={(e) =>
                    handleChemicalPropertyChange("hydrophobicity", e.target.value)
                  }
                  placeholder="e.g., 0.42"
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-white px-4 py-2 text-sm text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* ──── progress indicator ──── */}
          {isLoading && (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-xs text-body dark:text-bodydark">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={12} className="animate-pulse text-primary" />
                  running prediction pipeline...
                </span>
                <span className="font-mono font-bold text-primary">
                  {Math.min(Math.round(progress), 100)}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-blue-500 to-primary transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-body/60 dark:text-bodydark/60">
                <span>preprocessing</span>
                <span>feature extraction</span>
                <span>model inference</span>
                <span>post-processing</span>
              </div>
            </div>
          )}

          {/* ──── action buttons ──── */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !aminoAcidSequence.trim() || !activeDataset || isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isLoading ? "predicting..." : "run prediction"}
            </button>
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg border border-stroke bg-white px-6 py-3 font-medium text-black transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-boxdark-2"
            >
              <X className="h-4 w-4" />
              clear
            </button>
          </div>
        </div>
      )}

      {/* ──── loading state ──── */}
      {isLoading && (
        <div className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <LoadingSpinner message="analyzing protein structure and predicting binding affinity..." />
        </div>
      )}

      {/* ──── error state ──── */}
      {error && !isLoading && (
        <ErrorMessage
          message={error.message}
          code={error.code}
          onRetry={error.code !== "no_dataset" ? handleRetry : undefined}
        />
      )}

      {/* ──── results ──── */}
      {prediction && !isLoading && !error && (
        <div className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
            <Dna className="h-5 w-5 text-primary" />
            prediction results
            {activeDataset && (
              <span className="ml-auto text-xs font-normal text-body dark:text-bodydark">
                dataset: {activeDataset.name}
              </span>
            )}
          </h3>
          <PredictionResults prediction={prediction} />
        </div>
      )}

      {/* ──── prediction history ──── */}
      {datasetPredictions.length > 0 && (
        <div className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
            <History className="h-5 w-5 text-primary" />
            prediction history
            <span className="ml-auto text-xs font-normal text-body dark:text-bodydark">
              {datasetPredictions.length} run{datasetPredictions.length !== 1 ? "s" : ""}
            </span>
          </h3>
          <div className="space-y-2">
            {datasetPredictions
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm transition-colors hover:bg-gray-100 dark:bg-boxdark-2 dark:hover:bg-boxdark-2/80"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Cpu size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-black dark:text-white">
                        {p.modelVersion}
                      </p>
                      <p className="text-xs text-body dark:text-bodydark">
                        {new Date(p.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <p className="font-bold text-black dark:text-white">
                        {p.affinityScore} kcal/mol
                      </p>
                      <p className="text-body dark:text-bodydark">
                        {(p.confidenceScore * 100).toFixed(1)}% confidence
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BindingPrediction;
