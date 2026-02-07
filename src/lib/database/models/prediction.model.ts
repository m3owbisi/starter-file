import { Schema, model, models, Document, Types } from "mongoose";

// prediction status enum
export const PredictionStatus = {
  QUEUED: "queued",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type PredictionStatusType = typeof PredictionStatus[keyof typeof PredictionStatus];

// binding site interface
export interface IBindingSite {
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

// prediction document interface
export interface IPrediction extends Document {
  datasetId: Types.ObjectId;
  experimentId?: Types.ObjectId;
  experimentRunId?: Types.ObjectId;
  userId: Types.ObjectId;
  modelVersion: string;
  modelName: string;
  inputData: {
    sequence?: string;
    ligandSmiles?: string;
    structureType?: string;
  };
  bindingSites: IBindingSite[];
  overallScore: number;
  confidenceScore: number;
  uncertaintyEstimate: number;
  inferenceTime: number;
  status: PredictionStatusType;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// binding site sub-schema
const BindingSiteSchema = new Schema<IBindingSite>(
  {
    residueId: {
      type: String,
      required: true,
    },
    chainId: {
      type: String,
      required: true,
    },
    residueName: {
      type: String,
      required: true,
    },
    position: {
      type: Number,
      required: true,
    },
    bindingScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    coordinates: {
      x: { type: Number },
      y: { type: Number },
      z: { type: Number },
    },
  },
  { _id: false }
);

// input data sub-schema
const InputDataSchema = new Schema(
  {
    sequence: {
      type: String,
      required: false,
    },
    ligandSmiles: {
      type: String,
      required: false,
    },
    structureType: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

// prediction schema
const PredictionSchema = new Schema<IPrediction>(
  {
    datasetId: {
      type: Schema.Types.ObjectId,
      ref: "Dataset",
      required: false,
    },
    experimentId: {
      type: Schema.Types.ObjectId,
      ref: "Experiment",
      required: false,
    },
    experimentRunId: {
      type: Schema.Types.ObjectId,
      ref: "ExperimentRun",
      required: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    modelVersion: {
      type: String,
      required: true,
      default: "1.0.0",
    },
    modelName: {
      type: String,
      required: true,
      default: "proteinbind-transformer-v1",
      lowercase: true,
    },
    inputData: {
      type: InputDataSchema,
      default: {},
    },
    bindingSites: {
      type: [BindingSiteSchema],
      default: [],
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    uncertaintyEstimate: {
      type: Number,
      required: false,
      default: 0,
    },
    inferenceTime: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(PredictionStatus),
      default: PredictionStatus.QUEUED,
    },
    errorMessage: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// indexes
PredictionSchema.index({ userId: 1, createdAt: -1 });
PredictionSchema.index({ datasetId: 1 });
PredictionSchema.index({ experimentId: 1 });
PredictionSchema.index({ status: 1 });
PredictionSchema.index({ overallScore: -1 });

// export model
export const Prediction = models?.Prediction || model<IPrediction>("Prediction", PredictionSchema);
