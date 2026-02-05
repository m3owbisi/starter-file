"use client";

import React, { useState, useCallback } from "react";
import { 
  Dna, 
  FileUp, 
  Beaker, 
  Send, 
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import PredictionResults from "./PredictionResults";

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
}

const BindingPrediction: React.FC = () => {
  // form state
  const [aminoAcidSequence, setAminoAcidSequence] = useState("");
  const [pdbData, setPdbData] = useState<string | null>(null);
  const [pdbFileName, setPdbFileName] = useState<string | null>(null);
  const [chemicalProperties, setChemicalProperties] = useState<ChemicalProperties>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // prediction state
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  // handle pdb file upload
  const handlePdbUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdbData(e.target?.result as string);
        setPdbFileName(file.name);
      };
      reader.readAsText(file);
    }
  }, []);

  // clear pdb file
  const clearPdbFile = useCallback(() => {
    setPdbData(null);
    setPdbFileName(null);
  }, []);

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
    // validate sequence
    if (!aminoAcidSequence || aminoAcidSequence.trim().length < 10) {
      setError({
        message: "please enter an amino acid sequence (minimum 10 characters)",
        code: "invalid_input",
      });
      return;
    }

    // clear previous state
    setError(null);
    setPrediction(null);
    setIsLoading(true);

    try {
      const requestBody: Record<string, unknown> = {
        amino_acid_sequence: aminoAcidSequence.trim().toUpperCase(),
      };

      // add optional pdb data
      if (pdbData) {
        requestBody.pdb_data = pdbData;
      }

      // add optional chemical properties if any are set
      const hasChemicalProperties = Object.values(chemicalProperties).some(
        (v) => v !== undefined
      );
      if (hasChemicalProperties) {
        requestBody.chemical_properties = chemicalProperties;
      }

      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data: PredictionResponse = await response.json();

      if (!data.success || !data.prediction) {
        setError({
          message: data.error || "prediction failed. please try again.",
          code: data.code,
        });
      } else {
        setPrediction(data.prediction);
      }
    } catch {
      setError({
        message: "network error. please check your connection and try again.",
        code: "network_error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [aminoAcidSequence, pdbData, chemicalProperties]);

  // retry prediction
  const handleRetry = useCallback(() => {
    setError(null);
    handleSubmit();
  }, [handleSubmit]);

  // clear all inputs
  const handleClear = useCallback(() => {
    setAminoAcidSequence("");
    setPdbData(null);
    setPdbFileName(null);
    setChemicalProperties({});
    setPrediction(null);
    setError(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* input form */}
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
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

        {/* pdb file upload */}
        <div className="mb-6">
          <label className="mb-3 flex items-center gap-2 text-sm font-medium text-black dark:text-white">
            <FileUp className="h-4 w-4 text-primary" />
            pdb structure file
            <span className="text-xs font-normal text-body dark:text-bodydark">
              (optional)
            </span>
          </label>
          {pdbFileName ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 p-3 dark:border-green-800/30 dark:bg-green-900/10">
              <FileUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="flex-1 text-sm font-medium text-green-800 dark:text-green-300">
                {pdbFileName}
              </span>
              <button
                onClick={clearPdbFile}
                className="rounded-lg p-1 text-green-600 transition-colors hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="file"
                accept=".pdb"
                onChange={handlePdbUpload}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                disabled={isLoading}
              />
              <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stroke bg-gray-50 p-6 transition-colors hover:border-primary hover:bg-gray-100 dark:border-form-strokedark dark:bg-form-input dark:hover:border-primary dark:hover:bg-form-input/80">
                <FileUp className="h-5 w-5 text-body dark:text-bodydark" />
                <span className="text-sm text-body dark:text-bodydark">
                  drag & drop or click to upload .pdb file
                </span>
              </div>
            </div>
          )}
        </div>

        {/* advanced options toggle */}
        <div className="mb-4">
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

        {/* chemical properties inputs */}
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

        {/* action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !aminoAcidSequence.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            predict binding
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

      {/* loading state */}
      {isLoading && (
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <LoadingSpinner message="analyzing protein structure and predicting binding affinity..." />
        </div>
      )}

      {/* error state */}
      {error && !isLoading && (
        <ErrorMessage
          message={error.message}
          code={error.code}
          onRetry={handleRetry}
        />
      )}

      {/* results */}
      {prediction && !isLoading && !error && (
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
            <Dna className="h-5 w-5 text-primary" />
            prediction results
          </h3>
          <PredictionResults prediction={prediction} />
        </div>
      )}
    </div>
  );
};

export default BindingPrediction;
