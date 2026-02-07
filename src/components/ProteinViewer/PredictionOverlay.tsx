"use client";

import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Target,
  Activity,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// binding site interface
export interface BindingSite {
  residueId: string;
  chainId: string;
  residueName: string;
  position: number;
  bindingScore: number;
  confidence: number;
  coordinates?: {
    x: number;
    y: number;
    z: number;
  };
}

// prediction data interface
export interface PredictionData {
  _id: string;
  overallScore: number;
  confidenceScore: number;
  bindingSites: BindingSite[];
  modelName: string;
  modelVersion: string;
  inferenceTime: number;
  status: string;
}

interface PredictionOverlayProps {
  predictionId?: string;
  predictionData?: PredictionData | null;
  onBindingSiteSelect?: (site: BindingSite) => void;
  onOverlayToggle?: (visible: boolean) => void;
  className?: string;
}

const PredictionOverlay: React.FC<PredictionOverlayProps> = ({
  predictionId,
  predictionData: externalData,
  onBindingSiteSelect,
  onOverlayToggle,
  className = "",
}) => {
  const [prediction, setPrediction] = useState<PredictionData | null>(externalData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "position">("score");

  // fetch prediction if id provided
  useEffect(() => {
    if (predictionId && !externalData) {
      fetchPrediction();
    }
  }, [predictionId]);

  // use external data if provided
  useEffect(() => {
    if (externalData) {
      setPrediction(externalData);
    }
  }, [externalData]);

  const fetchPrediction = async () => {
    if (!predictionId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/predictions/${predictionId}`);
      const result = await response.json();

      if (result.success) {
        setPrediction(result.data);
      } else {
        setError(result.error || "failed to load prediction");
      }
    } catch (err) {
      setError("failed to fetch prediction data");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayToggle = () => {
    const newState = !overlayVisible;
    setOverlayVisible(newState);
    onOverlayToggle?.(newState);
  };

  const handleSiteClick = (site: BindingSite) => {
    setSelectedSite(site.residueId);
    onBindingSiteSelect?.(site);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return "text-green-500";
    if (score >= 0.6) return "text-blue-500";
    if (score >= 0.4) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 0.8) return "bg-green-500/20";
    if (score >= 0.6) return "bg-blue-500/20";
    if (score >= 0.4) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  const sortedBindingSites = prediction?.bindingSites
    ? [...prediction.bindingSites].sort((a, b) => {
        if (sortBy === "score") {
          return b.bindingScore - a.bindingScore;
        }
        return a.position - b.position;
      })
    : [];

  if (loading) {
    return (
      <div className={`prediction-overlay-panel ${className}`}>
        <div className="flex items-center justify-center p-6">
          <Loader2 size={24} className="text-[#3c50e0] animate-spin" />
          <span className="ml-2 text-gray-500">loading prediction...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`prediction-overlay-panel ${className}`}>
        <div className="flex items-center gap-2 p-4 text-red-500">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className={`prediction-overlay-panel ${className}`}>
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          <Target size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">no prediction data available</p>
          <p className="text-xs mt-1">run a prediction to see binding sites</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`prediction-overlay-panel bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg ${className}`}
    >
      {/* header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3c50e0] to-[#8b5cf6] flex items-center justify-center">
            <Target size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              prediction overlay
            </h3>
            <p className="text-xs text-gray-500">
              {prediction.modelName} v{prediction.modelVersion}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOverlayToggle}
            className={`p-2 rounded-lg transition-colors ${
              overlayVisible
                ? "bg-[#3c50e0]/10 text-[#3c50e0]"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500"
            }`}
            title={overlayVisible ? "hide overlay" : "show overlay"}
          >
            {overlayVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* summary stats */}
      <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-xs text-gray-500">overall</p>
          <p className={`text-lg font-bold ${getScoreColor(prediction.overallScore)}`}>
            {(prediction.overallScore * 100).toFixed(0)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">confidence</p>
          <p className={`text-lg font-bold ${getScoreColor(prediction.confidenceScore)}`}>
            {(prediction.confidenceScore * 100).toFixed(0)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">sites</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {prediction.bindingSites.length}
          </p>
        </div>
      </div>

      {/* binding sites list */}
      {expanded && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">binding sites</span>
            <div className="flex gap-1">
              <button
                onClick={() => setSortBy("score")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  sortBy === "score"
                    ? "bg-[#3c50e0] text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                }`}
              >
                by score
              </button>
              <button
                onClick={() => setSortBy("position")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  sortBy === "position"
                    ? "bg-[#3c50e0] text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                }`}
              >
                by position
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sortedBindingSites.map((site) => (
              <button
                key={site.residueId}
                onClick={() => handleSiteClick(site)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  selectedSite === site.residueId
                    ? "bg-[#3c50e0]/10 border border-[#3c50e0]"
                    : "bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${getScoreBgColor(site.bindingScore)}`}
                      style={{
                        backgroundColor:
                          site.bindingScore >= 0.8
                            ? "#22c55e"
                            : site.bindingScore >= 0.6
                            ? "#3b82f6"
                            : site.bindingScore >= 0.4
                            ? "#eab308"
                            : "#ef4444",
                      }}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {site.residueName}
                    </span>
                    <span className="text-xs text-gray-500">
                      chain {site.chainId} · pos {site.position}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${getScoreColor(site.bindingScore)}`}>
                      {(site.bindingScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                  <span>confidence: {(site.confidence * 100).toFixed(0)}%</span>
                  {site.coordinates && (
                    <span>
                      ({site.coordinates.x.toFixed(1)}, {site.coordinates.y.toFixed(1)},{" "}
                      {site.coordinates.z.toFixed(1)})
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* status footer */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-500">
            <Activity size={12} />
            <span>inference: {prediction.inferenceTime.toFixed(0)}ms</span>
          </div>
          <div className="flex items-center gap-1 text-green-500">
            <CheckCircle2 size={12} />
            <span>{prediction.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionOverlay;
