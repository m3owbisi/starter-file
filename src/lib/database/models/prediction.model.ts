import { Schema, model, models, Document } from "mongoose";

// ─────────────────────────────────────────────────────────────────────
// prediction result schema — stores ml prediction results linked to
// a dataset id, supporting history/comparison/experiment tracking
// ─────────────────────────────────────────────────────────────────────

export interface IPredictionBindingSite {
  residue: string;
  contribution: number;
}

export interface IPrediction extends Document {
  datasetId: string;
  datasetName: string;
  modelVersion: string;
  parametersUsed: {
    temperature: number;
    threshold: number;
    maxIterations: number;
    samplingMethod: string;
  };
  aminoAcidSequence?: string;
  affinityScore: number;
  affinityUnit: string;
  confidenceScore: number;
  interactionType: string;
  predictedBindingSites: IPredictionBindingSite[];
  status: "pending" | "running" | "completed" | "failed";
  errorMessage?: string;
  executionTimeMs?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PredictionBindingSiteSchema = new Schema<IPredictionBindingSite>({
  residue: { type: String, required: true },
  contribution: { type: Number, required: true },
});

const PredictionSchema = new Schema<IPrediction>(
  {
    datasetId: {
      type: String,
      required: true,
      index: true,
    },
    datasetName: {
      type: String,
      required: true,
    },
    modelVersion: {
      type: String,
      required: true,
      default: "proteinbind-v1.0",
    },
    parametersUsed: {
      temperature: { type: Number, default: 0.8 },
      threshold: { type: Number, default: 0.5 },
      maxIterations: { type: Number, default: 1000 },
      samplingMethod: { type: String, default: "monte_carlo" },
    },
    aminoAcidSequence: {
      type: String,
    },
    affinityScore: {
      type: Number,
      required: true,
    },
    affinityUnit: {
      type: String,
      default: "kcal/mol",
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    interactionType: {
      type: String,
      required: true,
    },
    predictedBindingSites: {
      type: [PredictionBindingSiteSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
    },
    errorMessage: {
      type: String,
    },
    executionTimeMs: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// compound index for querying predictions per dataset, most recent first
PredictionSchema.index({ datasetId: 1, createdAt: -1 });

const Prediction =
  models.Prediction || model<IPrediction>("Prediction", PredictionSchema);

export default Prediction;
