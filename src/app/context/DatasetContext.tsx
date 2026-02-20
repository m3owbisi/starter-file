"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

// ─────────────────────────────────────────────────────────────────────
// Dataset status lifecycle
// ─────────────────────────────────────────────────────────────────────
export type DatasetStatus = "ready" | "processing" | "completed" | "error";

// ─────────────────────────────────────────────────────────────────────
// Dataset shape — represents a single uploaded protein dataset
// ─────────────────────────────────────────────────────────────────────
export interface Dataset {
  id: string;             // unique identifier (generated on upload)
  name: string;           // human-readable name (e.g., "hemoglobin alpha")
  fileName: string;       // original file name (e.g., "1hba.pdb")
  fileType: string;       // file extension (e.g., "pdb")
  pdbContent: string;     // raw PDB file content
  uploadDate: Date;       // when the dataset was uploaded
  status: DatasetStatus;  // current lifecycle state
  metadata?: {
    chains: number;
    residues: number;
    atoms: number;
    helices: number;
    sheets: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// Prediction history entry (stored per dataset)
// ─────────────────────────────────────────────────────────────────────
export interface PredictionRecord {
  id: string;
  datasetId: string;
  modelVersion: string;
  parameters: Record<string, number>;
  affinityScore: number;
  confidenceScore: number;
  interactionType: string;
  predictedBindingSites: Array<{ residue: string; contribution: number }>;
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────────────
interface DatasetContextValue {
  // currently active dataset (the one being viewed/analyzed)
  activeDataset: Dataset | null;
  setActiveDataset: (dataset: Dataset | null) => void;

  // all uploaded datasets in this session
  datasets: Dataset[];
  addDataset: (dataset: Dataset) => void;
  removeDataset: (id: string) => void;

  // prediction history for the active dataset
  predictions: PredictionRecord[];
  addPrediction: (prediction: PredictionRecord) => void;
  clearPredictions: () => void;
}

const DatasetContext = createContext<DatasetContextValue>({
  activeDataset: null,
  setActiveDataset: () => {},
  datasets: [],
  addDataset: () => {},
  removeDataset: () => {},
  predictions: [],
  addPrediction: () => {},
  clearPredictions: () => {},
});

// ─────────────────────────────────────────────────────────────────────
// Utility: generate a unique dataset ID
// ─────────────────────────────────────────────────────────────────────
export function generateDatasetId(): string {
  return `ds-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ─────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────
export function DatasetProvider({ children }: { children: ReactNode }) {
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);

  const addDataset = useCallback((dataset: Dataset) => {
    setDatasets((prev) => {
      // prevent duplicate IDs
      const filtered = prev.filter((d) => d.id !== dataset.id);
      return [...filtered, dataset];
    });
  }, []);

  const removeDataset = useCallback(
    (id: string) => {
      setDatasets((prev) => prev.filter((d) => d.id !== id));
      // if removing the active dataset, clear it
      if (activeDataset?.id === id) {
        setActiveDataset(null);
      }
    },
    [activeDataset]
  );

  const addPrediction = useCallback((prediction: PredictionRecord) => {
    setPredictions((prev) => [...prev, prediction]);
  }, []);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
  }, []);

  return (
    <DatasetContext.Provider
      value={{
        activeDataset,
        setActiveDataset,
        datasets,
        addDataset,
        removeDataset,
        predictions,
        addPrediction,
        clearPredictions,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────
export function useDataset() {
  return useContext(DatasetContext);
}
