"use client";

import React, { useState, useEffect, useCallback } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import WorkflowProgress from "@/components/Common/WorkflowProgress";
import ProteinDatasetUploader from "@/components/proteindatasetuploader/ProteinDatasetUploader";
import PredictionOverlay from "@/components/ProteinViewer/PredictionOverlay";
import {
  Upload,
  FileCheck,
  Target,
  Eye,
  FlaskConical,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { workflowOrchestrator, WorkflowState } from "@/lib/workflow/workflowOrchestrator";
import { emit } from "@/lib/events/eventBus";
import Link from "next/link";

const UnifiedWorkflowPage = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [workflowState, setWorkflowState] = useState<WorkflowState>(
    workflowOrchestrator.getState()
  );
  const [uploadedDataset, setUploadedDataset] = useState<{
    id: string;
    filename: string;
    fileType: string;
  } | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    logs: Array<{ level: string; message: string }>;
  } | null>(null);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = workflowOrchestrator.onStateChange((state) => {
      setWorkflowState(state);
    });
    return () => unsubscribe();
  }, []);

  // handle file upload completion
  const handleUploadComplete = async (files: any[]) => {
    if (files.length === 0) return;

    const file = files[0];
    setIsProcessing(true);
    setError(null);

    try {
      // create dataset record
      const response = await fetch("/api/datasets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.savedAs || file.name,
          originalName: file.name,
          fileType: file.name.split(".").pop(),
          fileSize: file.size,
          filePath: file.path || "/uploads/" + file.savedAs,
          autoCreateExperiment: true,
          experimentName: `workflow-${Date.now()}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUploadedDataset({
          id: result.data.dataset._id,
          filename: result.data.dataset.originalName,
          fileType: result.data.dataset.fileType,
        });

        emit("dataset:uploaded", {
          datasetId: result.data.dataset._id,
          filename: result.data.dataset.originalName,
          fileType: result.data.dataset.fileType,
          userId: result.data.dataset.uploadedBy,
        });

        setActiveStep(1);
      } else {
        setError(result.error || "failed to create dataset record");
      }
    } catch (err) {
      setError("failed to process upload");
    } finally {
      setIsProcessing(false);
    }
  };

  // trigger validation
  const handleValidate = async () => {
    if (!uploadedDataset) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/datasets/${uploadedDataset.id}/validate`, {
        method: "POST",
      });

      const result = await response.json();

      setValidationResult({
        isValid: result.isValid,
        logs: result.logs || [],
      });

      if (result.isValid) {
        emit("dataset:validated", {
          datasetId: uploadedDataset.id,
          isValid: true,
          validationLogs: result.logs,
        });
        setActiveStep(2);
      } else {
        setError("validation failed - check logs for details");
      }
    } catch (err) {
      setError("validation request failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // trigger prediction
  const handlePredict = async () => {
    if (!uploadedDataset) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/datasets/${uploadedDataset.id}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (result.success) {
        emit("prediction:started", {
          predictionId: result.predictionId,
          datasetId: uploadedDataset.id,
          userId: result.userId,
        });

        // poll for prediction completion
        await pollPredictionStatus(result.predictionId);
        setActiveStep(3);
      } else {
        setError(result.error || "prediction failed");
      }
    } catch (err) {
      setError("prediction request failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // poll prediction status
  const pollPredictionStatus = async (predictionId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await fetch(`/api/predictions/${predictionId}`);
      const result = await response.json();

      if (result.success) {
        if (result.data.status === "completed") {
          setPredictionResult(result.data);
          emit("prediction:completed", {
            predictionId,
            datasetId: uploadedDataset?.id,
            bindingSitesCount: result.data.bindingSites?.length || 0,
            overallScore: result.data.overallScore,
            confidenceScore: result.data.confidenceScore,
          });
          return;
        } else if (result.data.status === "failed") {
          throw new Error(result.data.errorMessage || "prediction failed");
        }
      }

      attempts++;
    }

    throw new Error("prediction timeout");
  };

  const steps = [
    {
      id: 0,
      title: "upload dataset",
      icon: <Upload size={20} />,
      description: "upload a protein dataset file (pdb, fasta, csv)",
    },
    {
      id: 1,
      title: "validate",
      icon: <FileCheck size={20} />,
      description: "validate file format and structure",
    },
    {
      id: 2,
      title: "predict",
      icon: <Target size={20} />,
      description: "run ai binding prediction",
    },
    {
      id: 3,
      title: "visualize",
      icon: <Eye size={20} />,
      description: "view results in 3d viewer",
    },
  ];

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            unified workflow
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            upload, validate, predict, and visualize protein binding in one seamless flow
          </p>
        </div>

        {/* workflow progress */}
        <div className="mb-8">
          <WorkflowProgress showDetails={false} />
        </div>

        {/* step indicators */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => index <= activeStep && setActiveStep(index)}
                disabled={index > activeStep}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  index === activeStep
                    ? "bg-[#3c50e0] text-white shadow-lg"
                    : index < activeStep
                    ? "bg-green-500/10 text-green-500"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                }`}
              >
                {index < activeStep ? (
                  <CheckCircle2 size={18} />
                ) : (
                  step.icon
                )}
                <span className="text-sm font-medium hidden md:inline">
                  {step.title}
                </span>
              </button>
              {index < steps.length - 1 && (
                <ArrowRight
                  size={16}
                  className={`mx-2 ${
                    index < activeStep ? "text-green-500" : "text-gray-300"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* step content */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
          {/* step 0: upload */}
          {activeStep === 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                step 1: upload dataset
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                drag and drop your protein dataset file or click to browse. supported formats: pdb, fasta, fa, csv
              </p>
              <ProteinDatasetUploader />
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    // simulate upload for demo
                    handleUploadComplete([
                      {
                        name: "sample_protein.pdb",
                        size: 1024000,
                        savedAs: "sample_protein_" + Date.now() + ".pdb",
                        path: "/uploads/sample_protein.pdb",
                      },
                    ]);
                  }}
                  className="text-sm text-[#3c50e0] hover:underline"
                >
                  or use sample dataset for demo
                </button>
              </div>
            </div>
          )}

          {/* step 1: validate */}
          {activeStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                step 2: validate dataset
              </h2>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                  <FileCheck size={24} className="text-[#3c50e0]" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {uploadedDataset?.filename}
                    </p>
                    <p className="text-sm text-gray-500">
                      type: {uploadedDataset?.fileType}
                    </p>
                  </div>
                </div>
              </div>

              {validationResult && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    validation logs
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {validationResult.logs.map((log, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded-lg text-sm ${
                          log.level === "error"
                            ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            : log.level === "warning"
                            ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                            : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        }`}
                      >
                        {log.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleValidate}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#3c50e0] to-[#8b5cf6] text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    validating...
                  </>
                ) : (
                  <>
                    <FileCheck size={18} />
                    validate dataset
                  </>
                )}
              </button>
            </div>
          )}

          {/* step 2: predict */}
          {activeStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                step 3: run binding prediction
              </h2>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl mb-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 size={18} />
                  <span>dataset validated successfully</span>
                </div>
              </div>

              <p className="text-gray-500 dark:text-gray-400 mb-6">
                run the ai-powered binding prediction model on your validated dataset. this will identify potential binding sites and calculate affinity scores.
              </p>

              <button
                onClick={handlePredict}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#3c50e0] to-[#8b5cf6] text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    running prediction...
                  </>
                ) : (
                  <>
                    <Target size={18} />
                    start prediction
                  </>
                )}
              </button>
            </div>
          )}

          {/* step 3: visualize */}
          {activeStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                step 4: view results
              </h2>
              
              {predictionResult && (
                <div className="mb-6">
                  <PredictionOverlay predictionData={predictionResult} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/protein-viewer"
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#3c50e0] transition-colors flex items-center gap-3"
                >
                  <Eye size={24} className="text-[#3c50e0]" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      open protein viewer
                    </p>
                    <p className="text-sm text-gray-500">
                      visualize in 3d with binding sites
                    </p>
                  </div>
                </Link>

                <Link
                  href="/experiments"
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#3c50e0] transition-colors flex items-center gap-3"
                >
                  <FlaskConical size={24} className="text-[#3c50e0]" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      view experiment
                    </p>
                    <p className="text-sm text-gray-500">
                      track in experiment dashboard
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default UnifiedWorkflowPage;
