"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  FileCheck,
  Target,
  Eye,
  FlaskConical,
} from "lucide-react";
import {
  WorkflowState,
  WorkflowStage,
  subscribeToWorkflow,
  getWorkflowState,
} from "@/lib/workflow/workflowOrchestrator";

interface WorkflowStep {
  id: WorkflowStage;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const workflowSteps: WorkflowStep[] = [
  {
    id: "uploading",
    label: "upload",
    icon: <Upload size={18} />,
    description: "uploading dataset file",
  },
  {
    id: "validating",
    label: "validate",
    icon: <FileCheck size={18} />,
    description: "validating file format and structure",
  },
  {
    id: "predicting",
    label: "predict",
    icon: <Target size={18} />,
    description: "running ai prediction model",
  },
  {
    id: "visualizing",
    label: "visualize",
    icon: <Eye size={18} />,
    description: "preparing 3d visualization",
  },
  {
    id: "completed",
    label: "complete",
    icon: <FlaskConical size={18} />,
    description: "workflow complete",
  },
];

const stageOrder: WorkflowStage[] = [
  "idle",
  "uploading",
  "validating",
  "predicting",
  "visualizing",
  "completed",
];

interface WorkflowProgressProps {
  className?: string;
  showDetails?: boolean;
  onStageClick?: (stage: WorkflowStage) => void;
}

const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  className = "",
  showDetails = true,
  onStageClick,
}) => {
  const [state, setState] = useState<WorkflowState>(getWorkflowState());

  useEffect(() => {
    const unsubscribe = subscribeToWorkflow((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getCurrentStageIndex = (): number => {
    return stageOrder.indexOf(state.stage);
  };

  const getStepStatus = (
    stepId: WorkflowStage
  ): "pending" | "active" | "completed" | "error" => {
    const currentIndex = getCurrentStageIndex();
    const stepIndex = stageOrder.indexOf(stepId);

    if (state.stage === "error") {
      if (stepIndex < currentIndex) return "completed";
      if (stepIndex === currentIndex) return "error";
      return "pending";
    }

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex && state.stage !== "idle") return "active";
    return "pending";
  };

  const getStatusColor = (
    status: "pending" | "active" | "completed" | "error"
  ): string => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white border-green-500";
      case "active":
        return "bg-[#3c50e0] text-white border-[#3c50e0]";
      case "error":
        return "bg-red-500 text-white border-red-500";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-300 dark:border-gray-600";
    }
  };

  const getLineColor = (
    status: "pending" | "active" | "completed" | "error"
  ): string => {
    if (status === "completed") return "bg-green-500";
    if (status === "active") return "bg-[#3c50e0]";
    return "bg-gray-300 dark:bg-gray-600";
  };

  if (state.stage === "idle") {
    return (
      <div
        className={`workflow-progress-idle p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30 ${className}`}
      >
        <div className="text-center">
          <Upload size={32} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            upload a dataset to start the workflow
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`workflow-progress ${className}`}>
      {/* progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            workflow progress
          </span>
          <span className="text-sm text-gray-500">{state.progress}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              state.stage === "error"
                ? "bg-red-500"
                : "bg-gradient-to-r from-[#3c50e0] to-[#8b5cf6]"
            }`}
            style={{ width: `${state.progress}%` }}
          />
        </div>
      </div>

      {/* steps */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {workflowSteps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isLast = index === workflowSteps.length - 1;

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => onStageClick?.(step.id)}
                  className="relative flex flex-col items-center z-10"
                  disabled={status === "pending"}
                >
                  {/* step circle */}
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${getStatusColor(
                      status
                    )}`}
                  >
                    {status === "active" ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : status === "completed" ? (
                      <CheckCircle2 size={18} />
                    ) : status === "error" ? (
                      <XCircle size={18} />
                    ) : (
                      step.icon
                    )}
                  </div>

                  {/* step label */}
                  <span
                    className={`mt-2 text-xs font-medium ${
                      status === "active"
                        ? "text-[#3c50e0]"
                        : status === "completed"
                        ? "text-green-500"
                        : status === "error"
                        ? "text-red-500"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>

                {/* connector line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-2 relative -top-3">
                    <div
                      className={`h-full transition-colors ${getLineColor(
                        getStepStatus(workflowSteps[index + 1].id)
                      )}`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* details section */}
      {showDetails && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">current stage:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {state.stage}
              </span>
            </div>
            {state.datasetId && (
              <div>
                <span className="text-gray-500">dataset:</span>
                <span className="ml-2 font-mono text-xs text-gray-700 dark:text-gray-300">
                  {state.datasetId.substring(0, 8)}...
                </span>
              </div>
            )}
            {state.predictionId && (
              <div>
                <span className="text-gray-500">prediction:</span>
                <span className="ml-2 font-mono text-xs text-gray-700 dark:text-gray-300">
                  {state.predictionId.substring(0, 8)}...
                </span>
              </div>
            )}
            {state.experimentId && (
              <div>
                <span className="text-gray-500">experiment:</span>
                <span className="ml-2 font-mono text-xs text-gray-700 dark:text-gray-300">
                  {state.experimentId.substring(0, 8)}...
                </span>
              </div>
            )}
          </div>

          {state.error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle size={16} />
                <span className="text-sm">{state.error}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkflowProgress;
