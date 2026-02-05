"use client";

import React from "react";
import { 
  Activity, 
  Target, 
  Percent, 
  Atom,
  TrendingUp 
} from "lucide-react";

interface BindingSite {
  residue: string;
  contribution: number;
}

interface PredictionData {
  binding_affinity: number;
  unit: string;
  confidence_score: number;
  interaction_type: string;
  binding_sites: BindingSite[];
}

interface PredictionResultsProps {
  prediction: PredictionData;
}

const PredictionResults: React.FC<PredictionResultsProps> = ({ prediction }) => {
  const getAffinityColor = (affinity: number) => {
    if (affinity <= -10) return "text-green-500";
    if (affinity <= -7) return "text-blue-500";
    if (affinity <= -5) return "text-yellow-500";
    return "text-red-500";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-blue-500";
    if (confidence >= 0.4) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "high confidence";
    if (confidence >= 0.6) return "moderate confidence";
    if (confidence >= 0.4) return "low confidence";
    return "very low confidence";
  };

  return (
    <div className="space-y-6">
      {/* main results grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* binding affinity card */}
        <div className="rounded-xl border border-stroke bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm transition-all hover:shadow-md dark:border-strokedark dark:from-boxdark dark:to-boxdark-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-body dark:text-bodydark">
                binding affinity
              </p>
              <p className={`text-2xl font-bold ${getAffinityColor(prediction.binding_affinity)}`}>
                {prediction.binding_affinity} 
                <span className="ml-1 text-sm font-normal text-body dark:text-bodydark">
                  {prediction.unit}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* confidence score card */}
        <div className="rounded-xl border border-stroke bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm transition-all hover:shadow-md dark:border-strokedark dark:from-boxdark dark:to-boxdark-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
              <Percent className="h-6 w-6 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-body dark:text-bodydark">
                confidence score
              </p>
              <p className="text-2xl font-bold text-black dark:text-white">
                {(prediction.confidence_score * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getConfidenceColor(prediction.confidence_score)}`}
                style={{ width: `${prediction.confidence_score * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-body dark:text-bodydark">
              {getConfidenceLabel(prediction.confidence_score)}
            </p>
          </div>
        </div>

        {/* interaction type card */}
        <div className="rounded-xl border border-stroke bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm transition-all hover:shadow-md dark:border-strokedark dark:from-boxdark dark:to-boxdark-2 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
              <Target className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-body dark:text-bodydark">
                interaction type
              </p>
              <p className="text-lg font-semibold text-black dark:text-white">
                {prediction.interaction_type}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* binding sites section */}
      {prediction.binding_sites && prediction.binding_sites.length > 0 && (
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="mb-4 flex items-center gap-2">
            <Atom className="h-5 w-5 text-primary" />
            <h4 className="text-sm font-semibold text-black dark:text-white">
              predicted binding sites
            </h4>
          </div>
          <div className="space-y-3">
            {prediction.binding_sites.map((site, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-boxdark-2 dark:hover:bg-boxdark-2/80"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </div>
                  <span className="font-mono text-sm font-medium text-black dark:text-white">
                    {site.residue}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${site.contribution * 100}%` }}
                    />
                  </div>
                  <span className="min-w-[3rem] text-right text-sm font-medium text-body dark:text-bodydark">
                    {(site.contribution * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* interpretation note */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800/30 dark:bg-blue-900/10">
        <TrendingUp className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-medium">interpretation guide</p>
          <p className="mt-1 text-blue-700 dark:text-blue-400">
            binding affinity values below -7 kcal/mol typically indicate strong binding. 
            the confidence score reflects how reliable this prediction is based on input data quality.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PredictionResults;
